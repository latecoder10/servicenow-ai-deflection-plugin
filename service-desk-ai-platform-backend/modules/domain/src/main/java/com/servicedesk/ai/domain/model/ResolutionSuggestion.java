package com.servicedesk.ai.domain.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ResolutionSuggestion {
    private String suggestionId;
    private String queryTitle;
    private String queryDescription;
    private String recommendedTitle;
    private String summaryResolution;
    private List<String> stepByStepInstructions;
    private String codeOrCommandSnippet;
    private ConfidenceScore confidenceScore;
    private List<KnowledgeChunk> referencedSources;
    private boolean deflectionSuccessful;
    private String generatedByModel;
    private Instant createdAt;
    private String correlationId;
}
