package com.servicedesk.ai.application.service;

import com.servicedesk.ai.domain.model.KnowledgeChunk;
import com.servicedesk.ai.domain.port.out.EmbeddingPort;
import com.servicedesk.ai.domain.port.out.VectorDatabasePort;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class DuplicateDetectionEngine {

    private final EmbeddingPort embeddingPort;
    private final VectorDatabasePort vectorDatabasePort;

    public boolean isDuplicateIncident(String title, String description, double threshold) {
        String queryText = title + " " + description;
        List<Float> queryVector = embeddingPort.generateEmbedding(queryText);
        
        List<KnowledgeChunk> matches = vectorDatabasePort.similaritySearch(
            "Resolved_Incidents",
            queryVector,
            3,
            null,
            null
        );

        return matches.stream()
            .anyMatch(chunk -> chunk.getRelevanceScore() >= threshold);
    }
}
