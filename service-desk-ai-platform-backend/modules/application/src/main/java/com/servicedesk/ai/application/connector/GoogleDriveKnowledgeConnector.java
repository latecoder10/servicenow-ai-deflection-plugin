package com.servicedesk.ai.application.connector;

import com.servicedesk.ai.application.service.IndexedDocumentCatalog;
import com.servicedesk.ai.domain.AppConstants;
import com.servicedesk.ai.domain.entity.ConnectorConfigurationEntity;
import com.servicedesk.ai.domain.model.*;
import com.servicedesk.ai.domain.port.out.EmbeddingPort;
import com.servicedesk.ai.domain.port.out.KnowledgeConnector;
import com.servicedesk.ai.domain.port.out.VectorDatabasePort;
import com.servicedesk.ai.domain.repository.ConnectorConfigurationJpaRepository;
import com.servicedesk.ai.domain.settings.PlatformSettingsService;
import com.servicedesk.ai.domain.util.TextChunker;
import com.servicedesk.ai.integration.gdrive.DriveFile;
import com.servicedesk.ai.integration.gdrive.DriveFrontMatter;
import com.servicedesk.ai.integration.gdrive.GoogleDriveClient;
import com.servicedesk.ai.integration.gdrive.config.GoogleDriveConfig;
import com.servicedesk.ai.loader.parser.TextDocumentParser;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.io.ByteArrayInputStream;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.util.*;

/**
 * Indexes documents from a Google Drive folder into the vector store.
 *
 * Incremental by modification time: each run asks Drive for files changed since
 * the stored watermark, indexes them, then advances the watermark to the newest
 * file it successfully processed. A short overlap is subtracted so a document
 * saved while a run was in flight is picked up next time rather than skipped.
 *
 * Re-indexing a file is safe. Vector ids are derived from the Drive file id, so
 * an edited document overwrites its own chunks instead of accumulating copies.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class GoogleDriveKnowledgeConnector implements KnowledgeConnector {

    public static final String CONNECTOR_TYPE = "GOOGLE_DRIVE";
    private static final String VECTOR_PREFIX = "gd-";

    private final GoogleDriveConfig config;
    private final GoogleDriveClient driveClient;
    private final TextDocumentParser textParser;
    private final EmbeddingPort embeddingPort;
    private final VectorDatabasePort vectorDatabasePort;
    private final ConnectorConfigurationJpaRepository connectorRepository;
    private final IndexedDocumentCatalog catalog;
    private final PlatformSettingsService settings;

    @Override
    public String getConnectorType() {
        return CONNECTOR_TYPE;
    }

    /**
     * Whether the connector may run. Read from settings at call time rather than from
     * the bound config, so an operator can switch Drive on or off from the UI without
     * a redeploy. The bound value remains the default when nothing is stored.
     */
    private boolean isEnabled() {
        return settings.getBoolean("gdrive.enabled", config.isEnabled());
    }

    /**
     * Pushes the stored folder and drive ids onto the bound config before the client
     * reads them.
     *
     * <p>GoogleDriveClient takes both from GoogleDriveConfig internally, and that class
     * lives in the integration module which does not depend on the settings service.
     * Rather than thread the ids through every client call, the config bean is updated
     * in place at the two entry points that precede any Drive request. Both are
     * single-threaded per run, so there is no interleaving to worry about.
     */
    private void applyStoredDriveSettings() {
        String folderId = settings.getString("gdrive.folder-id", config.getFolderId());
        if (folderId != null && !folderId.equals(config.getFolderId())) {
            log.info("[Drive] Using folder id from settings rather than the environment");
            config.setFolderId(folderId);
        }
        String driveId = settings.getString("gdrive.drive-id", config.getDriveId());
        if (driveId != null && !driveId.equals(config.getDriveId())) {
            config.setDriveId(driveId);
        }
    }

    @Override
    public boolean testConnection(Map<String, String> configMap) {
        if (!isEnabled()) {
            log.info("[Drive] Connector is disabled (gdrive.enabled=false)");
            return false;
        }
        applyStoredDriveSettings();
        return driveClient.testConnection();
    }

    @Override
    public SyncResult synchronize(SyncRequest request) {
        Instant startedAt = Instant.now();
        long start = System.currentTimeMillis();

        SyncResult.SyncResultBuilder result = SyncResult.builder()
            .jobId(request.getJobId())
            .connectorType(CONNECTOR_TYPE)
            .syncType(request.getSyncType())
            .startedAt(startedAt);

        if (!isEnabled()) {
            return result.status("FAILED")
                .errorMessage("Google Drive connector is disabled (gdrive.enabled=false)")
                .completedAt(Instant.now())
                .executionTimeMs(System.currentTimeMillis() - start)
                .build();
        }

        applyStoredDriveSettings();

        // FULL ignores the watermark; INCREMENTAL resumes from it.
        Instant since = "FULL".equalsIgnoreCase(request.getSyncType())
            ? null
            : (request.getSinceTimestamp() != null ? request.getSinceTimestamp() : storedWatermark());

        int maxFiles = settings.getInt("gdrive.max-files-per-sync", config.getMaxFilesPerSync());
        int limit = request.getBatchLimit() > 0
            ? Math.min(request.getBatchLimit(), maxFiles)
            : maxFiles;

        int fetched = 0, created = 0, skipped = 0, failed = 0;
        Instant newestProcessed = null;

        try {
            List<DriveFile> files = driveClient.listChangedFiles(since, limit);
            fetched = files.size();
            log.info("[Drive] {} file(s) changed since {}", fetched, since == null ? "the beginning" : since);

            for (DriveFile file : files) {
                try {
                    int chunks = indexFile(file);
                    if (chunks > 0) {
                        created++;
                        if (file.modifiedTime() != null
                            && (newestProcessed == null || file.modifiedTime().isAfter(newestProcessed))) {
                            newestProcessed = file.modifiedTime();
                        }
                    } else {
                        skipped++;
                        log.debug("[Drive] No indexable text in {}", file.name());
                    }
                } catch (Exception e) {
                    failed++;
                    log.warn("[Drive] Failed to index {}: {}", file.name(), e.getMessage());
                }
            }

            // Only advance past files that actually succeeded, so a failure is retried.
            if (newestProcessed != null) {
                saveWatermark(newestProcessed.minusSeconds(config.getWatermarkOverlapSeconds()));
            }

            return result
                .status(failed > 0 ? "COMPLETED_WITH_ERRORS" : "COMPLETED")
                .itemsFetched(fetched).itemsCreated(created)
                .itemsSkipped(skipped).itemsFailed(failed)
                .completedAt(Instant.now())
                .executionTimeMs(System.currentTimeMillis() - start)
                .build();

        } catch (Exception e) {
            log.error("[Drive] Sync failed: {}", e.getMessage(), e);
            return result.status("FAILED")
                .errorMessage(e.getMessage())
                .itemsFetched(fetched).itemsCreated(created)
                .itemsSkipped(skipped).itemsFailed(failed)
                .completedAt(Instant.now())
                .executionTimeMs(System.currentTimeMillis() - start)
                .build();
        }
    }

    /** @return number of chunks indexed, 0 when the file yielded no usable text */
    private int indexFile(DriveFile file) {
        GoogleDriveClient.Downloaded downloaded = driveClient.download(file);
        if (downloaded.content().length == 0) {
            return 0;
        }

        String rawText = textParser.parse(
            new ByteArrayInputStream(downloaded.content()), downloaded.mimeType());
        if (rawText == null || rawText.isBlank()) {
            return 0;
        }

        DriveFrontMatter front = DriveFrontMatter.parse(rawText);
        String body = front.body().isBlank() ? rawText : front.body();

        String title = front.getOrDefault(DriveFrontMatter.TITLE, file.baseName());
        String category = front.getOrDefault(DriveFrontMatter.CATEGORY,
            file.parentName() != null ? file.parentName() : AppConstants.DEFAULT_CATEGORY);
        String department = front.getOrDefault(DriveFrontMatter.DEPARTMENT, AppConstants.DEFAULT_DEPARTMENT);

        // Title, category and keywords are prepended so a query matching the subject
        // scores against them, not only against whatever the first paragraph says.
        // Keywords matter most: they carry the words a user actually types, such as
        // "working from home" on an article titled "VPN will not connect".
        StringBuilder payload = new StringBuilder()
            .append("Title: ").append(title).append('\n')
            .append("Category: ").append(category).append('\n');
        if (front.get(DriveFrontMatter.TAGS) != null) {
            payload.append("Keywords: ").append(front.get(DriveFrontMatter.TAGS)).append('\n');
        }
        payload.append(body);

        Map<String, String> provenance = buildProvenance(file, front, title, category);

        List<String> textChunks = TextChunker.chunkText(
            payload.toString(), AppConstants.CHUNK_SIZE_CHARS, AppConstants.CHUNK_OVERLAP_CHARS);

        Set<String> tags = parseTags(front.get(DriveFrontMatter.TAGS));
        String owner = front.get(DriveFrontMatter.OWNER);

        List<KnowledgeChunk> chunks = new ArrayList<>();
        for (int i = 0; i < textChunks.size(); i++) {
            String chunkText = textChunks.get(i);
            DocumentMetadata meta = DocumentMetadata.builder()
                .documentId(VECTOR_PREFIX + file.id())
                .title(title)
                .category(category)
                .department(department)
                .sourceType(DocumentSourceType.GOOGLE_DRIVE_DOC)
                .sourceUri(file.webViewLink())
                .tags(tags)
                // "Owner: IT Service Desk" is usually a team, not a mailbox, so only a
                // genuine address is promoted; the rest rides in provenance as a name.
                .ownerEmail(owner != null && owner.contains("@") ? owner.trim() : null)
                .version(front.get(DriveFrontMatter.REVIEWED))
                .customAttributes(provenance)
                .createdDate(file.modifiedTime() != null ? file.modifiedTime() : Instant.now())
                .build();

            chunks.add(KnowledgeChunk.builder()
                .chunkId(VECTOR_PREFIX + file.id() + AppConstants.VECTOR_ID_SEPARATOR + i)
                .documentId(VECTOR_PREFIX + file.id())
                .chunkIndex(i)
                .textContent(chunkText)
                .tokenCount(TextChunker.estimateTokens(chunkText))
                .vectorEmbedding(embeddingPort.generateEmbedding(chunkText))
                .metadata(meta)
                .build());
        }

        vectorDatabasePort.upsertChunks(AppConstants.COLLECTION_SERVICESK_DESK_KNOWLEDGE, chunks);

        // Best effort, after the index write: the vectors are already committed, so a
        // catalogue failure must not make a searchable document look unindexed.
        try {
            catalog.recordIndexedDocument(IndexedDocumentCatalog.Entry.builder()
                .connectorType(CONNECTOR_TYPE)
                .externalId(file.id())
                .externalNumber(front.getOrDefault(DriveFrontMatter.DOC_ID, title))
                .vectorDocumentId(VECTOR_PREFIX + file.id())
                .title(title)
                .sourceType(DocumentSourceType.GOOGLE_DRIVE_DOC.name())
                .sourceUri(file.webViewLink())
                .department(department)
                .category(category)
                .ownerEmail(owner != null && owner.contains("@") ? owner.trim() : null)
                .recordedBy("gdrive-sync")
                .build(), chunks);
        } catch (Exception e) {
            log.warn("[Drive] '{}' is indexed but was not catalogued: {}", title, e.getMessage());
        }

        log.info("[Drive] Indexed '{}' as {} chunk(s), category={}", title, chunks.size(), category);
        return chunks.size();
    }

    /** "wifi, wireless, dropping" -> three tags. Null when the document declared none. */
    private Set<String> parseTags(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        Set<String> tags = new LinkedHashSet<>();
        for (String tag : raw.split(",")) {
            if (!tag.isBlank()) {
                tags.add(tag.trim());
            }
        }
        return tags.isEmpty() ? null : tags;
    }

    /** Provenance so a Drive-sourced suggestion can be cited like a ServiceNow one. */
    private Map<String, String> buildProvenance(DriveFile file, DriveFrontMatter front,
                                                String title, String category) {
        Map<String, String> provenance = new LinkedHashMap<>();
        // Cite the article's own identifier when it has one ("IT-002"), so the panel
        // shows what the team calls the document rather than a truncated title.
        provenance.put(AppConstants.META_RECORD_NUMBER,
            front.getOrDefault(DriveFrontMatter.DOC_ID, title));
        provenance.put(AppConstants.META_RECORD_SYS_ID, file.id());
        provenance.put(AppConstants.META_RECORD_TYPE, "GOOGLE_DRIVE_DOC");
        provenance.put(AppConstants.META_CONNECTOR_TYPE, CONNECTOR_TYPE);
        provenance.put(AppConstants.META_CATEGORY, category);

        String priority = front.get(DriveFrontMatter.PRIORITY);
        if (priority != null && !priority.isBlank()) {
            provenance.put(AppConstants.META_PRIORITY, priority);
        }
        if (file.webViewLink() != null) {
            provenance.put(AppConstants.META_SOURCE_URL, file.webViewLink());
        }
        // OWNER and REVIEWED are known keys, so the passthrough below skips them; kept
        // here because "who maintains this" is the first thing an agent asks of a doc.
        String owner = front.get(DriveFrontMatter.OWNER);
        if (owner != null && !owner.isBlank()) {
            provenance.put("owner", owner.trim());
        }
        String reviewed = front.get(DriveFrontMatter.REVIEWED);
        if (reviewed != null && !reviewed.isBlank()) {
            provenance.put("lastReviewed", reviewed.trim());
        }

        Instant modified = file.modifiedTime() != null ? file.modifiedTime() : Instant.now();
        provenance.put(AppConstants.META_YEAR,
            String.valueOf(modified.atZone(ZoneOffset.UTC).getYear()));

        // Anything the team invented that we do not model is still carried through.
        front.fields().forEach((k, v) -> {
            if (!DriveFrontMatter.KNOWN_KEYS.contains(k)) {
                provenance.putIfAbsent(k, v);
            }
        });
        return provenance;
    }

    // ------------------------------------------------------------- watermark

    private Instant storedWatermark() {
        return connectorRepository.findByConnectorType(CONNECTOR_TYPE)
            .map(ConnectorConfigurationEntity::getLastSyncAt)
            .map(t -> t.atZone(ZoneId.systemDefault()).toInstant())
            .orElse(null);
    }

    private void saveWatermark(Instant value) {
        ConnectorConfigurationEntity entity = connectorRepository.findByConnectorType(CONNECTOR_TYPE)
            .orElseGet(() -> {
                ConnectorConfigurationEntity fresh = new ConnectorConfigurationEntity();
                fresh.setConnectorType(CONNECTOR_TYPE);
                fresh.setInstanceUrl("https://drive.google.com/drive/folders/" + config.getFolderId());
                fresh.setIsActive(true);
                return fresh;
            });
        entity.setLastSyncAt(LocalDateTime.ofInstant(value, ZoneId.systemDefault()));
        connectorRepository.save(entity);
        log.debug("[Drive] Watermark advanced to {}", value);
    }

    // ---------------------------------------------- unsupported for this source

    @Override
    public List<KnowledgeRecord> fetchChanges(Instant since, int maxLimit) {
        // Drive documents are not ServiceNow-shaped records; synchronize() indexes
        // them directly rather than mapping them onto KnowledgeRecord.
        return List.of();
    }


}
