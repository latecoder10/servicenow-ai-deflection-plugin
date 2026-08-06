package com.servicedesk.ai.application.service;

import com.servicedesk.ai.domain.entity.KnowledgeChunkEntity;
import com.servicedesk.ai.domain.entity.KnowledgeDocumentEntity;
import com.servicedesk.ai.domain.entity.UploadJobEntity;
import com.servicedesk.ai.domain.model.DocumentMetadata;
import com.servicedesk.ai.domain.model.KnowledgeChunk;
import com.servicedesk.ai.domain.port.out.VectorDatabasePort;
import com.servicedesk.ai.domain.repository.KnowledgeChunkJpaRepository;
import com.servicedesk.ai.domain.repository.KnowledgeDocumentJpaRepository;
import com.servicedesk.ai.domain.repository.UploadJobJpaRepository;
import com.servicedesk.ai.loader.chunking.SlidingWindowChunker;
import com.servicedesk.ai.loader.parser.TextDocumentParser;
import com.servicedesk.ai.loader.storage.FileStorageService;
import com.servicedesk.ai.loader.storage.StoredFileMetaData;
import com.servicedesk.ai.loader.storage.VirusScanResult;
import com.servicedesk.ai.loader.storage.VirusScanService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayInputStream;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AsyncDocumentIngestionService {

    private final FileStorageService fileStorageService;
    private final VirusScanService virusScanService;
    private final KnowledgeDocumentJpaRepository documentRepository;
    private final KnowledgeChunkJpaRepository chunkRepository;
    private final UploadJobJpaRepository uploadJobRepository;
    private final TextDocumentParser textDocumentParser;
    private final SlidingWindowChunker slidingWindowChunker;
    private final VectorDatabasePort vectorDatabasePort;

    @Transactional
    public UploadJobEntity submitUploadJob(byte[] fileBytes, String originalFilename, String mimeType, String uploadedBy) {
        UploadJobEntity job = UploadJobEntity.builder()
                .filename(originalFilename)
                .status("PROCESSING")
                .progressPercentage(5)
                .startedAt(LocalDateTime.now())
                .build();
        job.setCreatedBy(uploadedBy != null ? uploadedBy : "system_admin");

        UploadJobEntity savedJob = uploadJobRepository.save(job);

        processAsyncIngestion(savedJob.getId(), fileBytes, originalFilename, mimeType, uploadedBy);

        return savedJob;
    }

    @Async
    @Transactional
    public void processAsyncIngestion(UUID jobId, byte[] fileBytes, String originalFilename, String mimeType, String uploadedBy) {
        log.info("Starting background ingestion pipeline for UploadJob {}", jobId);
        UploadJobEntity job = uploadJobRepository.findById(jobId).orElseThrow();

        try {
            // Stage 1: Virus Scan (15%)
            VirusScanResult scanResult = virusScanService.scanStream(new ByteArrayInputStream(fileBytes), originalFilename);
            if (!scanResult.isClean()) {
                job.setStatus("FAILED");
                job.setErrorMessage("Virus scan failed: " + scanResult.getThreatName());
                job.setFinishedAt(LocalDateTime.now());
                uploadJobRepository.save(job);
                return;
            }
            job.setProgressPercentage(15);
            uploadJobRepository.save(job);

            // Stage 2: Physical Storage (35%)
            StoredFileMetaData fileMeta = fileStorageService.storeFile(
                    new ByteArrayInputStream(fileBytes),
                    originalFilename,
                    mimeType,
                    "documents"
            );
            job.setProgressPercentage(35);
            uploadJobRepository.save(job);

            // Stage 3: Metadata Persistence (55%)
            KnowledgeDocumentEntity document = KnowledgeDocumentEntity.builder()
                    .title(originalFilename != null ? originalFilename : "Untitled Document")
                    .sourceType("FILE_UPLOAD")
                    .storagePath(fileMeta.getStoragePath())
                    .originalFilename(originalFilename)
                    .mimeType(mimeType)
                    .fileSizeBytes(fileMeta.getSizeBytes())
                    .checksum(fileMeta.getChecksumSha256())
                    .qualityScore(95)
                    .status("PROCESSING")
                    .build();
            document.setCreatedBy(uploadedBy != null ? uploadedBy : "system_admin");

            KnowledgeDocumentEntity savedDocument = documentRepository.save(document);
            job.setDocumentId(savedDocument.getId());
            job.setProgressPercentage(55);
            uploadJobRepository.save(job);

            // Stage 4: Text Extraction & Chunking (70%)
            // Uses 300-word chunks with 50-word overlap for semantic coherence
            String textContent = textDocumentParser.parse(new ByteArrayInputStream(fileBytes), mimeType);

            DocumentMetadata docMeta = DocumentMetadata.builder()
                    .documentId(savedDocument.getId().toString())
                    .title(originalFilename)
                    .department("general")
                    .category("knowledge_base")
                    .createdDate(Instant.now())
                    .build();

            List<KnowledgeChunk> pineconeChunks = slidingWindowChunker.createChunks(textContent, docMeta);
            log.info("Extracted {} chunks (300 words each, 50 overlap) from document", pineconeChunks.size());

            // Save chunks to DB
            for (KnowledgeChunk chunk : pineconeChunks) {
                KnowledgeChunkEntity chunkEntity = KnowledgeChunkEntity.builder()
                        .documentId(savedDocument.getId())
                        .chunkIndex(chunk.getChunkIndex())
                        .chunkText(chunk.getTextContent())
                        .tokenCount(chunk.getTokenCount())
                        .build();
                chunkEntity.setCreatedBy(uploadedBy != null ? uploadedBy : "system_admin");
                chunkRepository.save(chunkEntity);
            }

            job.setProgressPercentage(70);
            uploadJobRepository.save(job);

            // Stage 5: Upsert to Pinecone (batched, 96 per request with retry)
            int upserted = vectorDatabasePort.upsertChunks("Knowledge_Articles", pineconeChunks);
            log.info("Upserted {}/{} chunks to Pinecone for document {}", upserted, pineconeChunks.size(), savedDocument.getId());

            job.setProgressPercentage(90);
            uploadJobRepository.save(job);

            // Stage 6: Finalization & Status Update (100%)
            savedDocument.setStatus("READY");
            documentRepository.save(savedDocument);

            job.setProgressPercentage(100);
            job.setStatus("COMPLETED");
            job.setFinishedAt(LocalDateTime.now());
            uploadJobRepository.save(job);

            log.info("Successfully completed asynchronous document ingestion for job {}", jobId);

        } catch (Exception e) {
            log.error("Error executing background ingestion for job {}: {}", jobId, e.getMessage(), e);
            job.setStatus("FAILED");
            job.setErrorMessage(e.getMessage());
            job.setFinishedAt(LocalDateTime.now());
            uploadJobRepository.save(job);
        }
    }
}
