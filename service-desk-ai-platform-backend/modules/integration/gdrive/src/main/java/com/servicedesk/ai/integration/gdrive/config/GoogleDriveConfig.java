package com.servicedesk.ai.integration.gdrive.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Data
@Component
@ConfigurationProperties(prefix = "gdrive")
public class GoogleDriveConfig {

    /** Turns the connector and its scheduler on. Off by default so nothing runs unconfigured. */
    private boolean enabled = false;

    /**
     * Path to the service-account JSON key downloaded from Google Cloud.
     * The account's client_email must be granted at least Viewer on the folder.
     */
    private String credentialsPath = "";

    /**
     * Drive folder to index. Everything beneath it is included. Take the id from the
     * folder URL: drive.google.com/drive/folders/<THIS PART>
     */
    private String folderId = "";

    /** Optional shared drive id. Leave blank for My Drive or a shared folder. */
    private String driveId = "";

    /** Files per page when listing. Drive caps this at 1000. */
    private int pageSize = 100;

    /** Safety limit on how many files one sync run will index. */
    private int maxFilesPerSync = 500;

    /** Overlap re-applied to the watermark so a file saved mid-sync is not skipped. */
    private int watermarkOverlapSeconds = 300;

    private int connectionTimeoutMs = 10000;
    private int readTimeoutMs = 60000;
}
