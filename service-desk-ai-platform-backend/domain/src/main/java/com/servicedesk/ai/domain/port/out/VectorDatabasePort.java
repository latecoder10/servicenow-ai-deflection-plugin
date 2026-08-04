package com.servicedesk.ai.domain.port.out;

import com.servicedesk.ai.domain.model.KnowledgeChunk;

import java.util.List;

public interface VectorDatabasePort {
    int upsertChunks(String collectionName, List<KnowledgeChunk> chunks);
    
    List<KnowledgeChunk> similaritySearch(String collectionName, List<Float> queryVector, int topK, String departmentFilter, String categoryFilter);
    
    void deleteByDocumentId(String collectionName, String documentId);
    
    long countVectors(String collectionName);
}
