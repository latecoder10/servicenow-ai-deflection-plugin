package com.servicedesk.ai.api.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * A ticket raised because deflection did not resolve the problem.
 *
 * <p>Only the two fields ServiceNow itself requires are mandatory. The rest are optional
 * because this is usually submitted straight from the suggestion panel, where the agent
 * has typed a description but not yet categorised anything.
 */
public record CreateIncidentRequest(

    @NotBlank(message = "Title is required")
    @Size(min = 3, max = 250, message = "Title must be between 3 and 250 characters")
    String title,

    @NotBlank(message = "Description is required")
    String description,

    String callerEmail,
    String department,
    String category,
    String subcategory,
    String priority,
    String assignedGroup
) {}
