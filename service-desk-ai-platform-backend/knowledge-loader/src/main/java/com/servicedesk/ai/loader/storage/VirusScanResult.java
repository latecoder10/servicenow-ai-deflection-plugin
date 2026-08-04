package com.servicedesk.ai.loader.storage;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VirusScanResult {
    private boolean clean;
    private String scanDetails;
    private String threatName;
}
