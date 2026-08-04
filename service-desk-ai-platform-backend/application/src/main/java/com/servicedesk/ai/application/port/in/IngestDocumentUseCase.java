package com.servicedesk.ai.application.port.in;

import com.servicedesk.ai.domain.model.DocumentMetadata;

import java.io.InputStream;

public interface IngestDocumentUseCase {
    record Command(
        String fileName,
        String contentType,
        InputStream contentStream,
        String department,
        String category,
        String ownerEmail
    ) {}

    DocumentMetadata ingestDocument(Command command);
}
