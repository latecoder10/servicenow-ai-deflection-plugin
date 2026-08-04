package com.servicedesk.ai.application.service;

import com.servicedesk.ai.domain.model.ConfidenceScore;
import com.servicedesk.ai.domain.model.KnowledgeChunk;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ConfidenceCalculator {

    public ConfidenceScore calculateConfidence(List<KnowledgeChunk> chunks, String promptCategory) {
        if (chunks == null || chunks.isEmpty()) {
            return ConfidenceScore.of(15);
        }

        // Factor 1: Vector Relevance Score Average (60% weight)
        double avgRelevance = chunks.stream()
            .mapToDouble(KnowledgeChunk::getRelevanceScore)
            .average()
            .orElse(0.0);

        // Factor 2: Top Match Highest Similarity (30% weight)
        double maxRelevance = chunks.stream()
            .mapToDouble(KnowledgeChunk::getRelevanceScore)
            .max()
            .orElse(0.0);

        // Factor 3: Source Count & Recency Weight (10% weight)
        double sourceBonus = Math.min(chunks.size() * 3.0, 10.0);

        double compositeScore = (avgRelevance * 60.0) + (maxRelevance * 30.0) + sourceBonus;
        int rounded = (int) Math.round(Math.min(compositeScore, 98.0));

        return ConfidenceScore.of(Math.max(rounded, 20));
    }
}
