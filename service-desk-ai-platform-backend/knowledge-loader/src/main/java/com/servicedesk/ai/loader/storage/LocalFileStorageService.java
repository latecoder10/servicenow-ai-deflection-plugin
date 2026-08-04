package com.servicedesk.ai.loader.storage;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.BufferedInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.security.DigestInputStream;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.util.HexFormat;
import java.util.UUID;

@Service
@Slf4j
public class LocalFileStorageService implements FileStorageService {

    @Value("${storage.local.root-path:./storage}")
    private String rootPath;

    @Value("${storage.local.document-folder:documents}")
    private String documentFolder;

    @Value("${storage.local.temp-folder:temp}")
    private String tempFolder;

    @Value("${storage.local.archive-folder:archive}")
    private String archiveFolder;

    @Value("${storage.local.failed-folder:failed}")
    private String failedFolder;

    @Override
    public StoredFileMetaData storeFile(InputStream inputStream, String originalFilename, String mimeType, String folderName) throws IOException {
        UUID fileId = UUID.randomUUID();
        String extension = "";
        if (originalFilename != null && originalFilename.contains(".")) {
            extension = originalFilename.substring(originalFilename.lastIndexOf("."));
        }

        String storedFilename = fileId.toString() + extension;
        String targetSubFolder = (folderName != null && !folderName.isBlank()) ? folderName : documentFolder;

        Path destinationFolder = Paths.get(rootPath, targetSubFolder).toAbsolutePath().normalize();
        Files.createDirectories(destinationFolder);

        Path targetPath = destinationFolder.resolve(storedFilename);

        MessageDigest digest;
        try {
            digest = MessageDigest.getInstance("SHA-256");
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 algorithm not available", e);
        }

        long sizeBytes;
        try (DigestInputStream digestInputStream = new DigestInputStream(new BufferedInputStream(inputStream), digest)) {
            sizeBytes = Files.copy(digestInputStream, targetPath, StandardCopyOption.REPLACE_EXISTING);
        }

        String checksumHex = HexFormat.of().formatHex(digest.digest());

        log.info("Stored file locally at {} (Size: {} bytes, Checksum SHA-256: {})", targetPath, sizeBytes, checksumHex);

        return StoredFileMetaData.builder()
                .fileId(fileId)
                .originalFilename(originalFilename)
                .storedFilename(storedFilename)
                .storagePath(targetPath.toString())
                .mimeType(mimeType)
                .sizeBytes(sizeBytes)
                .checksumSha256(checksumHex)
                .storageProvider("LOCAL_FILE_SYSTEM")
                .uploadTimestamp(LocalDateTime.now())
                .build();
    }

    @Override
    public InputStream loadFile(String storagePath) throws IOException {
        Path path = Paths.get(storagePath).toAbsolutePath().normalize();
        if (!Files.exists(path)) {
            throw new IOException("File not found at path: " + storagePath);
        }
        return Files.newInputStream(path);
    }

    @Override
    public void deleteFile(String storagePath) throws IOException {
        Path path = Paths.get(storagePath).toAbsolutePath().normalize();
        Files.deleteIfExists(path);
    }

    @Override
    public boolean exists(String storagePath) {
        Path path = Paths.get(storagePath).toAbsolutePath().normalize();
        return Files.exists(path);
    }

    @Override
    public String getStorageProviderName() {
        return "LOCAL_FILE_SYSTEM";
    }
}
