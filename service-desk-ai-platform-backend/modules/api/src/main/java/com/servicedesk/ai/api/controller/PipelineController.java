package com.servicedesk.ai.api.controller;

import com.servicedesk.ai.domain.entity.SyncJobEntity;
import com.servicedesk.ai.domain.repository.SyncJobJpaRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "Pipeline Monitor", description = "Asynchronous Synchronization & Ingestion Pipeline Monitoring")
@RestController
@RequestMapping("/api/v1/pipeline")
@RequiredArgsConstructor
public class PipelineController {

    private final SyncJobJpaRepository syncJobRepository;

    @Operation(summary = "List recent synchronization pipeline execution jobs")
    @GetMapping("/jobs")
    public ResponseEntity<List<SyncJobEntity>> listSyncJobs() {
        return ResponseEntity.ok(syncJobRepository.findTop10ByOrderByStartedAtDesc());
    }

    @Operation(summary = "Get detailed execution status for a specific job ID")
    @GetMapping("/jobs/{jobId}")
    public ResponseEntity<SyncJobEntity> getSyncJobStatus(@PathVariable String jobId) {
        return syncJobRepository.findByJobId(jobId)
            .map(ResponseEntity::ok)
            .orElseGet(() -> ResponseEntity.notFound().build());
    }
}
