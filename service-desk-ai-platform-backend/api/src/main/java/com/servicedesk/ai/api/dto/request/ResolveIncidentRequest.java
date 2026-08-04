package com.servicedesk.ai.api.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ResolveIncidentRequest(
    @NotBlank(message = "Title is required")
    @Size(min = 3, max = 250, message = "Title must be between 3 and 250 characters")
    String title,

    @NotBlank(message = "Description is required")
    String description,

    String callerEmail,
    String userDepartment,
    String category,

    int minConfidenceThreshold
) {
    public ResolveIncidentRequest {
        if (minConfidenceThreshold <= 0) {
            minConfidenceThreshold = 75; // Default L1 deflection threshold
        }
    }
}
