package com.servicedesk.ai.domain.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Feedback {
    private String feedbackId;
    private String suggestionId;
    private String userEmail;
    private boolean isHelpful; // Explicit thumb up/down
    private String comment;
    private boolean incidentCreated; // Implicit feedback: was ticket created anyway?
    private String createdIncidentSysId;
    private Instant createdAt;
}
