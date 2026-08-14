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
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

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
    @Operation(summary = "Submit file upload for asynchronous virus scan, storage, and chunking")
    public ResponseEntity<UploadJobEntity> uploadFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "uploadedBy", required = false, defaultValue = "enterprise_admin") String uploadedBy) throws IOException {

        // An empty upload would otherwise be accepted, embedded as nothing, and left as a
        // permanently empty document in the index.
        if (file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "The uploaded file is empty");
        }

        String filename = file.getOriginalFilename();
        if (filename == null || filename.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "The uploaded file has no name");
        }
        // Reject traversal attempts before the name reaches the storage layer.
        if (filename.contains("..") || filename.contains("/") || filename.contains("\\")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                "File name must not contain path separators");
        }

        UploadJobEntity job = ingestionService.submitUploadJob(
                file.getBytes(),
                filename,
                file.getContentType(),
                uploadedBy
        );

        return ResponseEntity.accepted().body(job);
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
        // A bare RuntimeException here surfaced as a 500, telling the caller nothing about
        // whether the document was missing or the server had failed.
        KnowledgeDocumentEntity doc = documentRepository.findById(documentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                    "No document with id " + documentId));

        if (doc.getStoragePath() == null || doc.getStoragePath().isBlank()) {
            throw new ResponseStatusException(HttpStatus.GONE,
                "The document record exists but its stored file is no longer available");
        }

        InputStream fileStream = fileStorageService.loadFile(doc.getStoragePath());
        InputStreamResource resource = new InputStreamResource(fileStream);

        // Quote-strip the filename: an embedded quote would break the header and let the
        // browser save the file under a name of the uploader's choosing.
        String safeName = doc.getOriginalFilename() == null
            ? "document"
            : doc.getOriginalFilename().replace("\"", "").replace("\r", "").replace("\n", "");

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(doc.getMimeType() != null ? doc.getMimeType() : "application/octet-stream"))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + safeName + "\"")
                .body(resource);
    }
}
