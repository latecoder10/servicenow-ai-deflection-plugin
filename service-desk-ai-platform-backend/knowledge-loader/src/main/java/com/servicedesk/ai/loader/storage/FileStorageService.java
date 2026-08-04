package com.servicedesk.ai.loader.storage;

import java.io.IOException;
import java.io.InputStream;

public interface FileStorageService {
    StoredFileMetaData storeFile(InputStream inputStream, String originalFilename, String mimeType, String folder) throws IOException;
    InputStream loadFile(String storagePath) throws IOException;
    void deleteFile(String storagePath) throws IOException;
    boolean exists(String storagePath);
    String getStorageProviderName();
}
