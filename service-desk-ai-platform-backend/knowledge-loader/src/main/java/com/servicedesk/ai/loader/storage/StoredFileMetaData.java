package com.servicedesk.ai.loader.storage;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StoredFileMetaData {
    private UUID fileId;
    private String originalFilename;
    private String storedFilename;
    private String storagePath;
    private String mimeType;
    private Long sizeBytes;
    private String checksumSha256;
    private String storageProvider;
    private LocalDateTime uploadTimestamp;
}
