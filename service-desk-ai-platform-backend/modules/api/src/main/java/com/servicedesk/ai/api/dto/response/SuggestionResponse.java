package com.servicedesk.ai.api.dto.response;

import java.time.Instant;
import java.util.List;

public record SuggestionResponse(
    String suggestionId,
    String queryTitle,
    String recommendedTitle,
    String summaryResolution,
    List<String> stepByStepInstructions,
    String codeOrCommandSnippet,
    int confidenceScore,
    String confidenceBand,
    boolean deflectionSuccessful,
    int sourcesCount,
    String generatedByModel,
    Instant createdAt,
    String correlationId
) {}
