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
        String cid = com.servicedesk.ai.common.model.CorrelationContext.getCorrelationId();
        log.info("[SuggestionEngine][{}] Processing query: '{}' for user: {}", cid, command.title(), command.callerEmail());

        long totalStart = System.currentTimeMillis();

        // 1. Generate Query Vector
        long stepStart = System.currentTimeMillis();
        String combinedQuery = command.title() + " " + command.description();
        List<Float> queryVector = embeddingPort.generateEmbedding(combinedQuery);
        long embeddingTime = System.currentTimeMillis() - stepStart;
        log.info("[SuggestionEngine][{}] Step 1 - Gemini Embedding: {}ms (dim={})", cid, embeddingTime, queryVector.size());

        // 2. Vector Search across Pinecone collections
        stepStart = System.currentTimeMillis();
        List<KnowledgeChunk> candidateChunks = vectorDatabasePort.similaritySearch(
            "Knowledge_Articles",
            queryVector,
            8,
            command.userDepartment(),
            command.category()
        );
        long searchTime = System.currentTimeMillis() - stepStart;
        log.info("[SuggestionEngine][{}] Step 2 - Pinecone Search: {}ms (found {} candidates)", cid, searchTime, candidateChunks.size());

        // 3. Re-rank retrieved knowledge
        stepStart = System.currentTimeMillis();
        List<KnowledgeChunk> topChunks = llmPort.rerank(combinedQuery, candidateChunks, 5);
        long rerankTime = System.currentTimeMillis() - stepStart;
        log.info("[SuggestionEngine][{}] Step 3 - Reranking: {}ms (top {} selected)", cid, rerankTime, topChunks.size());

        // 4. Calculate Confidence
        stepStart = System.currentTimeMillis();
        ConfidenceScore confidenceScore = confidenceCalculator.calculateConfidence(topChunks, command.category());
        long confidenceTime = System.currentTimeMillis() - stepStart;
        log.info("[SuggestionEngine][{}] Step 4 - Confidence Calculation: {}ms (score={})", cid, confidenceTime, confidenceScore.value());

        // 5. LLM Prompt Generation
        stepStart = System.currentTimeMillis();
        String promptTemplate = promptBuilderService.buildUserPrompt(
            command.title(),
            command.description(),
            command.userDepartment(),
            topChunks
        );
        long promptTime = System.currentTimeMillis() - stepStart;
        log.info("[SuggestionEngine][{}] Step 5 - Prompt Builder: {}ms (prompt length={} chars)", cid, promptTime, promptTemplate.length());

        // 6. LLM Resolution Generation
        stepStart = System.currentTimeMillis();
        ResolutionSuggestion suggestion = llmPort.generateResolution(
            command.title(),
            command.description(),
            command.userDepartment(),
            topChunks,
            promptTemplate
        );
        long llmTime = System.currentTimeMillis() - stepStart;
        log.info("[SuggestionEngine][{}] Step 6 - Gemini LLM: {}ms (response length={} chars)", cid, llmTime, suggestion.getSummaryResolution() != null ? suggestion.getSummaryResolution().length() : 0);

        // 7. Override confidence with calculated score
        suggestion.setConfidenceScore(confidenceScore);
        suggestion.setDeflectionSuccessful(confidenceScore.isDeflectionEligible(command.minConfidenceThreshold()));

        long totalTime = System.currentTimeMillis() - totalStart;
        log.info("[SuggestionEngine][{}] COMPLETED in {}ms | suggestionId={} | confidence={} | deflected={} | steps=[embed:{}ms, search:{}ms, rerank:{}ms, confidence:{}ms, prompt:{}ms, llm:{}ms]",
            cid, totalTime, suggestion.getSuggestionId(), confidenceScore.value(), suggestion.isDeflectionSuccessful(),
            embeddingTime, searchTime, rerankTime, confidenceTime, promptTime, llmTime);

        return suggestion;
    }
}
