package com.servicedesk.ai.integration.gdrive;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.servicedesk.ai.integration.gdrive.config.GoogleDriveConfig;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.KeyFactory;
import java.security.PrivateKey;
import java.security.Signature;
import java.security.spec.PKCS8EncodedKeySpec;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Minimal Google Drive v3 client.
 *
 * Authenticates as a service account using the two-legged JWT flow: sign a claim
 * set with the account's private key, exchange it for an access token, cache the
 * token until shortly before it expires. This avoids pulling in the Google client
 * libraries for what amounts to three REST calls, and matches how Pinecone and
 * Gemini are already called here.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class GoogleDriveClient {

    private static final String TOKEN_URL = "https://oauth2.googleapis.com/token";
    private static final String DRIVE_FILES_URL = "https://www.googleapis.com/drive/v3/files";
    private static final String SCOPE_READONLY = "https://www.googleapis.com/auth/drive.readonly";
    private static final String JWT_BEARER = "urn:ietf:params:oauth:grant-type:jwt-bearer";

    private final GoogleDriveConfig config;
    private final ObjectMapper objectMapper = new ObjectMapper();

    private volatile String cachedToken = "";
    private volatile Instant tokenExpiry = Instant.EPOCH;
    private final Object tokenLock = new Object();

    // ---------------------------------------------------------------- listing

    /**
     * Files under the configured folder modified strictly after {@code since},
     * oldest first so an interrupted run can resume from the last success.
     *
     * @param since null for a full sync
     */
    public List<DriveFile> listChangedFiles(Instant since, int maxFiles) {
        String folderId = config.getFolderId();
        if (folderId == null || folderId.isBlank()) {
            throw new IllegalStateException("gdrive.folder-id is not configured");
        }

        List<String> folderIds = collectFolderTree(folderId);
        List<DriveFile> found = new ArrayList<>();
        String token = accessToken();

        for (String parent : folderIds) {
            if (found.size() >= maxFiles) {
                break;
            }
            found.addAll(listInFolder(parent, since, token, maxFiles - found.size()));
        }

        found.sort((a, b) -> {
            Instant x = a.modifiedTime() == null ? Instant.EPOCH : a.modifiedTime();
            Instant y = b.modifiedTime() == null ? Instant.EPOCH : b.modifiedTime();
            return x.compareTo(y);
        });
        return found;
    }

    /** Walks the folder tree breadth-first so nested folders are included. */
    private List<String> collectFolderTree(String rootId) {
        List<String> all = new ArrayList<>();
        all.add(rootId);
        String token = accessToken();

        for (int i = 0; i < all.size(); i++) {
            String q = "'" + all.get(i) + "' in parents"
                + " and mimeType = '" + DriveFile.MIME_FOLDER + "'"
                + " and trashed = false";
            for (JsonNode node : queryFiles(q, token, null)) {
                String id = node.path("id").asText(null);
                if (id != null && !all.contains(id)) {
                    all.add(id);
                }
            }
        }
        return all;
    }

    private List<DriveFile> listInFolder(String parentId, Instant since, String token, int limit) {
        StringBuilder q = new StringBuilder()
            .append("'").append(parentId).append("' in parents")
            .append(" and trashed = false")
            .append(" and mimeType != '").append(DriveFile.MIME_FOLDER).append("'");
        if (since != null) {
            q.append(" and modifiedTime > '").append(since.toString()).append("'");
        }

        String parentName = folderName(parentId, token);
        List<DriveFile> files = new ArrayList<>();

        for (JsonNode node : queryFiles(q.toString(), token, limit)) {
            DriveFile f = new DriveFile(
                node.path("id").asText(null),
                node.path("name").asText(""),
                node.path("mimeType").asText(""),
                parseInstant(node.path("modifiedTime").asText(null)),
                parentName,
                node.path("webViewLink").asText(null)
            );
            if (f.isIndexable()) {
                files.add(f);
            } else {
                log.debug("[Drive] Skipping unsupported type {} ({})", f.name(), f.mimeType());
            }
            if (files.size() >= limit) {
                break;
            }
        }
        return files;
    }

    private List<JsonNode> queryFiles(String query, String token, Integer limit) {
        List<JsonNode> out = new ArrayList<>();
        String pageToken = null;

        do {
            UriComponentsBuilder uri = UriComponentsBuilder.fromHttpUrl(DRIVE_FILES_URL)
                .queryParam("q", query)
                .queryParam("fields", "nextPageToken,files(id,name,mimeType,modifiedTime,webViewLink)")
                .queryParam("pageSize", Math.min(config.getPageSize(), 1000))
                .queryParam("supportsAllDrives", true)
                .queryParam("includeItemsFromAllDrives", true)
                .queryParam("orderBy", "modifiedTime");

            if (config.getDriveId() != null && !config.getDriveId().isBlank()) {
                uri.queryParam("driveId", config.getDriveId()).queryParam("corpora", "drive");
            }
            if (pageToken != null) {
                uri.queryParam("pageToken", pageToken);
            }

            JsonNode root = getJson(uri.encode().toUriString(), token);
            for (JsonNode f : root.path("files")) {
                out.add(f);
                if (limit != null && out.size() >= limit) {
                    return out;
                }
            }
            pageToken = root.path("nextPageToken").asText(null);
        } while (pageToken != null && !pageToken.isBlank());

        return out;
    }

    private String folderName(String folderId, String token) {
        try {
            JsonNode node = getJson(DRIVE_FILES_URL + "/" + folderId
                + "?fields=name&supportsAllDrives=true", token);
            return node.path("name").asText(null);
        } catch (Exception e) {
            log.debug("[Drive] Could not read folder name for {}: {}", folderId, e.getMessage());
            return null;
        }
    }

    // -------------------------------------------------------------- content

    /**
     * File content as bytes. Google-native documents are exported as .docx; anything
     * else is downloaded as stored.
     *
     * @return the bytes, and the mime type they are actually in
     */
    public Downloaded download(DriveFile file) {
        String token = accessToken();
        String url;
        String effectiveMime;

        if (file.isGoogleNative()) {
            url = DRIVE_FILES_URL + "/" + file.id() + "/export?mimeType="
                + DriveFile.MIME_DOCX + "&supportsAllDrives=true";
            effectiveMime = DriveFile.MIME_DOCX;
        } else {
            url = DRIVE_FILES_URL + "/" + file.id() + "?alt=media&supportsAllDrives=true";
            effectiveMime = file.mimeType();
        }

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);
        // As URI, not String: the export mimeType contains characters RestTemplate would
        // re-encode, producing a request Drive rejects.
        ResponseEntity<byte[]> response = rest().exchange(
            java.net.URI.create(url), HttpMethod.GET, new HttpEntity<>(headers), byte[].class);

        byte[] body = response.getBody();
        return new Downloaded(body == null ? new byte[0] : body, effectiveMime);
    }

    public record Downloaded(byte[] content, String mimeType) {}

    // ----------------------------------------------------------------- auth

    /** True when credentials resolve and the folder is readable. */
    public boolean testConnection() {
        String folderId = config.getFolderId();
        if (folderId == null || folderId.isBlank()) {
            // Without this guard the request becomes /files/?fields=... and Google
            // answers "Invalid field selection id", which points at the wrong thing.
            log.warn("[Drive] gdrive.folder-id is not configured. Set GDRIVE_FOLDER_ID to the id "
                + "in the folder URL: drive.google.com/drive/folders/THIS_PART");
            return false;
        }

        try {
            String token = accessToken();
            getJson(DRIVE_FILES_URL + "/" + folderId
                + "?fields=id,name&supportsAllDrives=true", token);
            log.info("[Drive] Connection OK, folder {} is readable", folderId);
            return true;
        } catch (Exception e) {
            String message = e.getMessage() == null ? "" : e.getMessage();
            // Drive answers 404 rather than 403 for a folder the caller cannot see,
            // so a missing share and a wrong id look identical from here.
            if (message.contains("404")) {
                log.warn("[Drive] Folder {} not found. Either the id is wrong, or the folder has "
                    + "not been shared with the service account. Share it as Viewer with the "
                    + "client_email in {}", folderId, config.getCredentialsPath());
            } else {
                log.warn("[Drive] Connection test failed: {}", message);
            }
            return false;
        }
    }

    private String accessToken() {
        if (Instant.now().isBefore(tokenExpiry) && !cachedToken.isEmpty()) {
            return cachedToken;
        }
        synchronized (tokenLock) {
            if (Instant.now().isBefore(tokenExpiry) && !cachedToken.isEmpty()) {
                return cachedToken;
            }
            return fetchToken();
        }
    }

    private String fetchToken() {
        JsonNode key = readServiceAccountKey();
        String clientEmail = key.path("client_email").asText("");
        String privateKeyPem = key.path("private_key").asText("");

        if (clientEmail.isBlank() || privateKeyPem.isBlank()) {
            throw new IllegalStateException(
                "Service account key at " + config.getCredentialsPath()
                    + " is missing client_email or private_key");
        }

        long now = Instant.now().getEpochSecond();
        long expires = now + 3600;

        String header = base64Url("{\"alg\":\"RS256\",\"typ\":\"JWT\"}");
        String claims = base64Url("{"
            + "\"iss\":\"" + clientEmail + "\","
            + "\"scope\":\"" + SCOPE_READONLY + "\","
            + "\"aud\":\"" + TOKEN_URL + "\","
            + "\"exp\":" + expires + ","
            + "\"iat\":" + now
            + "}");

        String signingInput = header + "." + claims;
        String assertion = signingInput + "." + sign(signingInput, privateKeyPem);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
        org.springframework.util.MultiValueMap<String, String> form =
            new org.springframework.util.LinkedMultiValueMap<>();
        form.add("grant_type", JWT_BEARER);
        form.add("assertion", assertion);

        try {
            ResponseEntity<String> response = rest()
                .postForEntity(TOKEN_URL, new HttpEntity<>(form, headers), String.class);
            JsonNode body = objectMapper.readTree(response.getBody());

            cachedToken = body.path("access_token").asText("");
            long ttl = body.path("expires_in").asLong(3600);
            tokenExpiry = Instant.now().plusSeconds(Math.max(ttl - 300, 60));

            log.info("[Drive] Access token acquired for {}, valid {}s", clientEmail, ttl);
            return cachedToken;
        } catch (Exception e) {
            throw new IllegalStateException("Google Drive token request failed: " + e.getMessage(), e);
        }
    }

    private JsonNode readServiceAccountKey() {
        String configured = config.getCredentialsPath();
        if (configured == null || configured.isBlank()) {
            throw new IllegalStateException("gdrive.credentials-path is not configured");
        }

        Path resolved = resolveCredentials(configured);
        if (resolved == null) {
            // The working directory depends on how the app was launched: running the api
            // module puts it in modules/api, so a path relative to the project root does
            // not resolve. Report every location tried rather than one that failed.
            throw new IllegalStateException(
                "Cannot find the service account key. gdrive.credentials-path is '" + configured
                    + "' and the working directory is '" + Path.of("").toAbsolutePath() + "'. "
                    + "Tried: " + String.join(", ", candidatePaths(configured))
                    + ". Use an absolute path to remove the ambiguity.");
        }

        try {
            return objectMapper.readTree(Files.readAllBytes(resolved));
        } catch (Exception e) {
            throw new IllegalStateException(
                "Service account key at " + resolved + " could not be parsed as JSON: " + e.getMessage(), e);
        }
    }

    /** First readable candidate, or null when none exist. */
    private Path resolveCredentials(String configured) {
        for (String candidate : candidatePaths(configured)) {
            Path p = Path.of(candidate);
            if (Files.isReadable(p)) {
                if (!p.isAbsolute()) {
                    log.info("[Drive] Resolved credentials to {}", p.toAbsolutePath());
                }
                return p;
            }
        }
        return null;
    }

    /**
     * An absolute path is used as given. A relative one is also tried against the parent
     * and grandparent directories, so a path written relative to the project root still
     * works when the app is launched from a module directory.
     */
    private List<String> candidatePaths(String configured) {
        Path given = Path.of(configured);
        if (given.isAbsolute()) {
            return List.of(configured);
        }
        return List.of(
            configured,
            Path.of("..", configured).normalize().toString(),
            Path.of("..", "..", configured).normalize().toString());
    }

    private String sign(String data, String privateKeyPem) {
        try {
            String normalised = privateKeyPem
                .replace("-----BEGIN PRIVATE KEY-----", "")
                .replace("-----END PRIVATE KEY-----", "")
                .replaceAll("\\s", "");
            byte[] der = Base64.getDecoder().decode(normalised);
            PrivateKey key = KeyFactory.getInstance("RSA")
                .generatePrivate(new PKCS8EncodedKeySpec(der));

            Signature signer = Signature.getInstance("SHA256withRSA");
            signer.initSign(key);
            signer.update(data.getBytes(StandardCharsets.UTF_8));
            return Base64.getUrlEncoder().withoutPadding().encodeToString(signer.sign());
        } catch (Exception e) {
            throw new IllegalStateException("Could not sign the service account JWT: " + e.getMessage(), e);
        }
    }

    // ---------------------------------------------------------------- plumbing

    /**
     * The url must already be encoded.
     *
     * It is passed as a URI rather than a String because RestTemplate treats a String as
     * a template and encodes it a second time, turning the %20 in a search query into
     * %2520. Drive rejects that with "Invalid Value" on the q parameter.
     */
    private JsonNode getJson(String url, String token) {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);
        try {
            ResponseEntity<String> response = rest().exchange(
                java.net.URI.create(url), HttpMethod.GET, new HttpEntity<>(headers), String.class);
            return objectMapper.readTree(response.getBody());
        } catch (Exception e) {
            throw new IllegalStateException("Drive request failed (" + url + "): " + e.getMessage(), e);
        }
    }

    private RestTemplate rest() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(config.getConnectionTimeoutMs());
        factory.setReadTimeout(config.getReadTimeoutMs());
        return new RestTemplate(factory);
    }

    private String base64Url(String json) {
        return Base64.getUrlEncoder().withoutPadding()
            .encodeToString(json.getBytes(StandardCharsets.UTF_8));
    }

    private Instant parseInstant(String value) {
        try {
            return value == null ? null : Instant.parse(value);
        } catch (Exception e) {
            return null;
        }
    }

    /** Exposed for the connector's diagnostics. */
    public Map<String, Object> describe() {
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("enabled", config.isEnabled());
        out.put("folderId", config.getFolderId());
        out.put("credentialsConfigured", config.getCredentialsPath() != null && !config.getCredentialsPath().isBlank());
        return out;
    }
}
