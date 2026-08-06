package com.servicedesk.ai.domain.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class KnowledgeChunk {
    private String chunkId;
    private String documentId;
    private int chunkIndex;
    private String textContent;
    private String headerHierarchy;
    private int tokenCount;
    private List<Float> vectorEmbedding;
    private DocumentMetadata metadata;
    private double relevanceScore;
}
