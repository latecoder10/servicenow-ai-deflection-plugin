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
public class Incident {
    private String id;
    private String sysId; // ServiceNow sys_id
    private String number; // INC0012948
    private String title;
    private String description;
    private String callerEmail;
    private String department;
    private String category;
    private String subcategory;
    private String priority; // 1 - Critical, 2 - High, 3 - Moderate, 4 - Low
    private String state; // New, In Progress, Resolved, Closed
    private String resolutionNotes;
    private String assignedGroup;
    private Instant sysCreatedOn;
    private Instant sysUpdatedOn;
}
