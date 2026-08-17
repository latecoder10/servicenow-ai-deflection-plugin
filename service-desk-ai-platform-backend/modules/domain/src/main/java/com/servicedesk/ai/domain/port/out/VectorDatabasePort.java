package com.servicedesk.ai.domain.port.out;

import com.servicedesk.ai.domain.model.KnowledgeChunk;

import java.util.List;
import java.util.Map;

public interface VectorDatabasePort {
    int upsertChunks(String collectionName, List<KnowledgeChunk> chunks);

    default int upsertVectors(String collectionName, List<VectorEntry> entries) {
        return 0;
    }

    default void upsertVector(String vectorId, List<Float> embedding, Map<String, Object> metadata, String text) {
        // Default: no-op. Implementors override for direct upsert.
    }

    record VectorEntry(String id, List<Float> embedding, Map<String, Object> metadata) {}

    default void deleteVector(String vectorId) {
        // Default: no-op. Implementors override for single-vector delete.
    }
    
    List<KnowledgeChunk> similaritySearch(String collectionName, List<Float> queryVector, int topK, String departmentFilter, String categoryFilter);

    /**
     * Narrows a search to particular knowledge sources.
     *
     * @param excludedConnectorTypes connector types to leave out, e.g. GOOGLE_DRIVE when
     *                               the agent has switched Drive results off. Empty means
     *                               search everything.
     */
    default List<KnowledgeChunk> similaritySearch(String collectionName, List<Float> queryVector, int topK,
                                                  String departmentFilter, String categoryFilter,
                                                  java.util.Set<String> excludedConnectorTypes) {
        return similaritySearch(collectionName, queryVector, topK, departmentFilter, categoryFilter);
    }
    
    void deleteByDocumentId(String collectionName, String documentId);
    
    long countVectors(String collectionName);
}
