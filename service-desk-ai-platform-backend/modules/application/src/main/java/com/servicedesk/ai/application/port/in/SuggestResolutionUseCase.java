package com.servicedesk.ai.application.port.in;

import com.servicedesk.ai.domain.model.ResolutionSuggestion;

public interface SuggestResolutionUseCase {
    record Command(
        String title,
        String description,
        String callerEmail,
        String userDepartment,
        String category,
        int minConfidenceThreshold
    ) {}

    ResolutionSuggestion suggestResolution(Command command);
}
