package com.servicedesk.ai.application.port.in;

import com.servicedesk.ai.domain.model.ResolutionSuggestion;

public interface SuggestResolutionUseCase {
    record Command(
        String title,
        String description,
        String callerEmail,
        String userDepartment,
        String category,
        int minConfidenceThreshold,

        /**
         * Whether documents synced from Google Drive may ground the answer. When the
         * agent turns Drive off they get fewer results rather than weaker substitutes,
         * so it is clear what the switch actually did.
         */
        boolean includeDriveResults
    ) {
        /** Keeps existing callers working; Drive results are on unless asked otherwise. */
        public Command(String title, String description, String callerEmail,
                       String userDepartment, String category, int minConfidenceThreshold) {
            this(title, description, callerEmail, userDepartment, category, minConfidenceThreshold, true);
        }
    }

    ResolutionSuggestion suggestResolution(Command command);
}
