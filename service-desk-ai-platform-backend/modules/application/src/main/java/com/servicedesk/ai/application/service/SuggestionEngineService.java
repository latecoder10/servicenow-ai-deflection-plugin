package com.servicedesk.ai.application.service;

import com.servicedesk.ai.application.port.in.SuggestResolutionUseCase;
import com.servicedesk.ai.domain.model.ConfidenceScore;
import com.servicedesk.ai.domain.model.KnowledgeChunk;
import com.servicedesk.ai.domain.model.ResolutionSuggestion;
import com.servicedesk.ai.domain.port.out.EmbeddingPort;
import com.servicedesk.ai.domain.port.out.LlmPort;
import com.servicedesk.ai.domain.port.out.VectorDatabasePort;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class SuggestionEngineService implements SuggestResolutionUseCase {

    private final EmbeddingPort embeddingPort;
    private final VectorDatabasePort vectorDatabasePort;
    private final LlmPort llmPort;
    private final ConfidenceCalculator confidenceCalculator;
    private final PromptBuilderService promptBuilderService;

    @Override
    public ResolutionSuggestion suggestResolution(Command command) {
        log.info("Processing resolution suggestion query: '{}' for user: {}", command.title(), command.callerEmail());

        // 1. Generate Query Vector
        String combinedQuery = command.title() + " " + command.description();
        List<Float> queryVector = embeddingPort.generateEmbedding(combinedQuery);

        // 2. Vector Search across Pinecone collections
        List<KnowledgeChunk> candidateChunks = vectorDatabasePort.similaritySearch(
            "Knowledge_Articles",
            queryVector,
            10,
            command.userDepartment(),
            command.category()
        );

        // 3. Re-rank retrieved knowledge
        List<KnowledgeChunk> topChunks = llmPort.rerank(combinedQuery, candidateChunks, 5);

        // 4. Calculate Confidence
        ConfidenceScore confidenceScore = confidenceCalculator.calculateConfidence(topChunks, command.category());

        // 5. LLM Prompt Generation
        String promptTemplate = promptBuilderService.buildUserPrompt(
            command.title(),
            command.description(),
            command.userDepartment(),
            topChunks
        );

        ResolutionSuggestion suggestion = llmPort.generateResolution(
            command.title(),
            command.description(),
            command.userDepartment(),
            topChunks,
            promptTemplate
        );

        suggestion.setConfidenceScore(confidenceScore);
        suggestion.setDeflectionSuccessful(confidenceScore.isDeflectionEligible(command.minConfidenceThreshold()));

        log.info("Generated resolution suggestion ID: {}, Confidence: {}%", suggestion.getSuggestionId(), confidenceScore.value());

        return suggestion;
    }
}
