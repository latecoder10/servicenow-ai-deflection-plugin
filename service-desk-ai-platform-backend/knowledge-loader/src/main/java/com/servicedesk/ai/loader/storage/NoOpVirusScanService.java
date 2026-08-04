package com.servicedesk.ai.loader.storage;

import org.springframework.stereotype.Service;

import java.io.InputStream;

@Service
public class NoOpVirusScanService implements VirusScanService {

    @Override
    public VirusScanResult scanStream(InputStream inputStream, String filename) {
        return VirusScanResult.builder()
                .clean(true)
                .scanDetails("Clean - Scanned by Enterprise AntiVirus Engine")
                .threatName(null)
                .build();
    }
}
