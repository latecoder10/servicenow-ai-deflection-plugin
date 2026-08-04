package com.servicedesk.ai.domain.port.out;

import com.servicedesk.ai.domain.model.KnowledgeChunk;
import com.servicedesk.ai.domain.model.ResolutionSuggestion;

import java.util.List;

public interface LlmPort {
    ResolutionSuggestion generateResolution(
        String userTitle,
        String userDescription,
        String userDepartment,
        List<KnowledgeChunk> contextChunks,
        String promptTemplate
    );
    
    List<KnowledgeChunk> rerank(String queryText, List<KnowledgeChunk> candidateChunks, int topN);
}
