package com.servicedesk.ai.domain.model;

import com.servicedesk.ai.common.exception.DomainException;

public record ConfidenceScore(int value, String confidenceBand) {
    public ConfidenceScore {
        if (value < 0 || value > 100) {
            throw new DomainException("INVALID_CONFIDENCE_SCORE", "Confidence score value must be between 0 and 100 inclusive");
        }
    }

    public static ConfidenceScore of(int percentage) {
        String band;
        if (percentage >= 85) {
            band = "VERY_HIGH";
        } else if (percentage >= 70) {
            band = "HIGH";
        } else if (percentage >= 50) {
            band = "MEDIUM";
        } else {
            band = "LOW";
        }
        return new ConfidenceScore(percentage, band);
    }

    public boolean isDeflectionEligible(int minThreshold) {
        return value >= minThreshold;
    }
}
