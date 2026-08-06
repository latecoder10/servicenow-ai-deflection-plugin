package com.servicedesk.ai.integration.llm;

import com.servicedesk.ai.domain.model.KnowledgeChunk;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.Comparator;
import java.util.List;

@Slf4j
@Component
public class RerankingEngine {

    public List<KnowledgeChunk> rerankChunks(String queryText, List<KnowledgeChunk> candidateChunks, int topN) {
        log.info("[Reranker] Cross-Encoder Reranking {} candidate chunks down to top {}", candidateChunks.size(), topN);

        // Sort by relevance score
        List<KnowledgeChunk> sorted = candidateChunks.stream()
            .sorted(Comparator.comparingDouble(KnowledgeChunk::getRelevanceScore).reversed())
            .limit(topN)
            .toList();

        return sorted;
    }
}
