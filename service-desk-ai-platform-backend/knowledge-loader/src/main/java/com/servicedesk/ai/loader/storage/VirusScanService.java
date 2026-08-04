package com.servicedesk.ai.loader.storage;

import java.io.InputStream;

public interface VirusScanService {
    VirusScanResult scanStream(InputStream inputStream, String filename);
}
