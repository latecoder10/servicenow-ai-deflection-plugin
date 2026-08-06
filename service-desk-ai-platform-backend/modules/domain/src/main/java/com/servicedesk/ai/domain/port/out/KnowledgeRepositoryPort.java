package com.servicedesk.ai.domain.port.out;

import com.servicedesk.ai.domain.model.DocumentMetadata;
import com.servicedesk.ai.domain.model.Feedback;

import java.util.List;
import java.util.Optional;

public interface KnowledgeRepositoryPort {
    DocumentMetadata saveDocumentMetadata(DocumentMetadata metadata);
    
    Optional<DocumentMetadata> findDocumentById(String documentId);
    
    List<DocumentMetadata> findAllDocuments();
    
    void deleteDocumentMetadata(String documentId);
    
    void saveFeedback(Feedback feedback);
}
