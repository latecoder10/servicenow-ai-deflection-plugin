package com.servicedesk.ai.api.controller;

import com.servicedesk.ai.application.service.AsyncDocumentIngestionService;
import com.servicedesk.ai.domain.entity.KnowledgeDocumentEntity;
import com.servicedesk.ai.domain.entity.UploadJobEntity;
import com.servicedesk.ai.domain.repository.KnowledgeDocumentJpaRepository;
import com.servicedesk.ai.domain.repository.UploadJobJpaRepository;
import com.servicedesk.ai.loader.storage.FileStorageService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.InputStreamResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/files")
@RequiredArgsConstructor
@Tag(name = "Local File Storage & Async Pipeline", description = "Enterprise async file ingestion, storage abstraction, and document status monitoring")
public class FileStorageController {

    private final AsyncDocumentIngestionService ingestionService;
    private final FileStorageService fileStorageService;
    private final KnowledgeDocumentJpaRepository documentRepository;
    private final UploadJobJpaRepository uploadJobRepository;

    @PostMapping("/upload")
    @Operation(summary = "Submit file upload for non-blocking asynchronous background virus scan, storage, and chunking")
    public ResponseEntity<UploadJobEntity> uploadFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "uploadedBy", required = false, defaultValue = "enterprise_admin") String uploadedBy) throws IOException {

        UploadJobEntity job = ingestionService.submitUploadJob(
                file.getBytes(),
                file.getOriginalFilename(),
                file.getContentType(),
                uploadedBy
        );

        return ResponseEntity.ok(job);
    }

    @GetMapping("/jobs/{jobId}")
    @Operation(summary = "Get async ingestion progress and status for an UploadJob")
    public ResponseEntity<UploadJobEntity> getJobStatus(@PathVariable UUID jobId) {
        return uploadJobRepository.findById(jobId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping
    @Operation(summary = "List all stored knowledge documents and their PostgreSQL metadata status")
    public ResponseEntity<List<KnowledgeDocumentEntity>> listAllDocuments() {
        return ResponseEntity.ok(documentRepository.findAll());
    }

    @GetMapping("/{documentId}/download")
    @Operation(summary = "Download stored file from local volume storage directory")
    public ResponseEntity<Resource> downloadFile(@PathVariable UUID documentId) throws IOException {
        KnowledgeDocumentEntity doc = documentRepository.findById(documentId)
                .orElseThrow(() -> new RuntimeException("Document not found with ID: " + documentId));

        InputStream fileStream = fileStorageService.loadFile(doc.getStoragePath());
        InputStreamResource resource = new InputStreamResource(fileStream);

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(doc.getMimeType() != null ? doc.getMimeType() : "application/octet-stream"))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + doc.getOriginalFilename() + "\"")
                .body(resource);
    }
}
