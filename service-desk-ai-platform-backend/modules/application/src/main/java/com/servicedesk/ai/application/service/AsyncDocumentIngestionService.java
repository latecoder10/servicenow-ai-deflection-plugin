package com.servicedesk.ai.application.service;

import com.servicedesk.ai.domain.entity.IndexingJobEntity;
import com.servicedesk.ai.domain.entity.KnowledgeChunkEntity;
import com.servicedesk.ai.domain.entity.KnowledgeDocumentEntity;
import com.servicedesk.ai.domain.entity.UploadJobEntity;
import com.servicedesk.ai.domain.model.DocumentMetadata;
import com.servicedesk.ai.domain.model.DocumentSourceType;
import com.servicedesk.ai.domain.model.KnowledgeChunk;
import com.servicedesk.ai.domain.port.out.EmbeddingPort;
import com.servicedesk.ai.domain.port.out.VectorDatabasePort;
import com.servicedesk.ai.domain.repository.IndexingJobJpaRepository;
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
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import com.servicedesk.ai.domain.AppConstants;

import java.io.ByteArrayInputStream;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AsyncDocumentIngestionService {

    /** The connector name an uploaded file is catalogued under. */
    private static final String UPLOAD_CONNECTOR = "FILE_UPLOAD";

    private final FileStorageService fileStorageService;
    private final VirusScanService virusScanService;
    private final KnowledgeDocumentJpaRepository documentRepository;
    private final KnowledgeChunkJpaRepository chunkRepository;
    private final IndexingJobJpaRepository indexingJobRepository;
    private final UploadJobJpaRepository uploadJobRepository;
    private final TextDocumentParser textDocumentParser;
    private final SlidingWindowChunker slidingWindowChunker;
    private final VectorDatabasePort vectorDatabasePort;
    private final EmbeddingPort embeddingPort;

    /**
     * Self-reference so the async call goes through the Spring proxy.
     * Calling processAsyncIngestion on {@code this} silently bypasses {@code @Async}
     * and runs the whole pipeline on the request thread.
     */
    private final ObjectProvider<AsyncDocumentIngestionService> self;

    /**
     * Deliberately not transactional. The job row must be committed before the async
     * worker looks it up, otherwise the worker can start before the commit lands and
     * fail to find it.
     */
    public UploadJobEntity submitUploadJob(byte[] fileBytes, String originalFilename, String mimeType, String uploadedBy) {
        UploadJobEntity job = UploadJobEntity.builder()
                .filename(originalFilename)
                .status("PROCESSING")
                .progressPercentage(5)
                .startedAt(LocalDateTime.now())
                .build();
        job.setCreatedBy(uploadedBy != null ? uploadedBy : "system_admin");

        UploadJobEntity savedJob = uploadJobRepository.save(job);

        self.getObject().processAsyncIngestion(savedJob.getId(), fileBytes, originalFilename, mimeType, uploadedBy);

        return savedJob;
    }

    /**
     * Not transactional: the pipeline calls out to storage, an embedding API and a vector
     * database, and holding a database connection open across all of that would exhaust
     * the pool. Each stage commits its own progress instead.
     */
    @Async
    public void processAsyncIngestion(UUID jobId, byte[] fileBytes, String originalFilename, String mimeType, String uploadedBy) {
        log.info("Starting background ingestion pipeline for UploadJob {}", jobId);
        UploadJobEntity job = uploadJobRepository.findById(jobId).orElseThrow();
        LocalDateTime indexingStartedAt = LocalDateTime.now();

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
                    .sourceType(sourceTypeOf(mimeType, originalFilename).name())
                    .storagePath(fileMeta.getStoragePath())
                    .originalFilename(originalFilename)
                    .mimeType(mimeType)
                    .fileSizeBytes(fileMeta.getSizeBytes())
                    .checksum(fileMeta.getChecksumSha256())
                    .qualityScore(95)
                    .status("PROCESSING")
                    // Uploads now carry the same catalogue columns as synced records, so
                    // one query answers "what is in the index" across every source.
                    .connectorType(UPLOAD_CONNECTOR)
                    .sourceUri(fileMeta.getStoragePath())
                    .departmentName("general")
                    .categoryName("knowledge_base")
                    .ownerEmail(uploadedBy)
                    .build();
            document.setCreatedBy(uploadedBy != null ? uploadedBy : "system_admin");

            // The row's own id doubles as its external id and as the documentId its
            // vectors carry, so upload rows join to Pinecone the same way synced ones do.
            KnowledgeDocumentEntity savedDocument = documentRepository.save(document);
            savedDocument.setExternalId(savedDocument.getId().toString());
            savedDocument.setExternalNumber(originalFilename);
            savedDocument.setVectorDocumentId(savedDocument.getId().toString());
            savedDocument = documentRepository.save(savedDocument);

            job.setDocumentId(savedDocument.getId());
            job.setProgressPercentage(55);
            uploadJobRepository.save(job);

            // Stage 4: Text Extraction & Chunking (70%)
            // Uses 300-word chunks with 50-word overlap for semantic coherence
            String textContent = textDocumentParser.parse(new ByteArrayInputStream(fileBytes), mimeType);

            if (textContent == null || textContent.isBlank()) {
                throw new IllegalStateException(
                    "No readable text could be extracted from " + originalFilename
                        + " (" + mimeType + "). The document cannot be indexed.");
            }

            // Provenance so an uploaded document can be cited like any other source.
            // Without it the panel shows an unattributed answer with no way back to the file.
            Map<String, String> provenance = new LinkedHashMap<>();
            provenance.put(AppConstants.META_RECORD_NUMBER, originalFilename);
            provenance.put(AppConstants.META_RECORD_SYS_ID, savedDocument.getId().toString());
            provenance.put(AppConstants.META_RECORD_TYPE, "UPLOADED_DOCUMENT");
            provenance.put(AppConstants.META_CONNECTOR_TYPE, "FILE_UPLOAD");
            provenance.put(AppConstants.META_YEAR,
                String.valueOf(java.time.Year.now().getValue()));

            DocumentMetadata docMeta = DocumentMetadata.builder()
                    .documentId(savedDocument.getId().toString())
                    .title(originalFilename)
                    .department("general")
                    .category("knowledge_base")
                    .sourceType(sourceTypeOf(mimeType, originalFilename))
                    // Where the bytes actually live, so a cited upload can be fetched
                    // back rather than only named.
                    .sourceUri(fileMeta.getStoragePath())
                    .ownerEmail(uploadedBy)
                    .customAttributes(provenance)
                    .createdDate(Instant.now())
                    .build();

            List<KnowledgeChunk> pineconeChunks = slidingWindowChunker.createChunks(textContent, docMeta);
            log.info("Extracted {} chunks (300 words each, 50 overlap) from document", pineconeChunks.size());

            if (pineconeChunks.isEmpty()) {
                throw new IllegalStateException("Document produced no chunks to index");
            }

            // Save chunks to DB. The chunker produces no chunkId, so it is derived the
            // same way the Pinecone upsert derives a vector id - otherwise the stored
            // row and the vector it became could not be matched up afterwards.
            for (KnowledgeChunk chunk : pineconeChunks) {
                chunk.setChunkId(savedDocument.getId() + AppConstants.VECTOR_ID_SEPARATOR + chunk.getChunkIndex());
                KnowledgeChunkEntity chunkEntity = KnowledgeChunkEntity.builder()
                        .documentId(savedDocument.getId())
                        .chunkIndex(chunk.getChunkIndex())
                        .chunkText(chunk.getTextContent())
                        .tokenCount(chunk.getTokenCount())
                        .vectorChunkId(chunk.getChunkId())
                        .build();
                chunkEntity.setCreatedBy(uploadedBy != null ? uploadedBy : "system_admin");
                chunkRepository.save(chunkEntity);
            }

            job.setProgressPercentage(70);
            uploadJobRepository.save(job);

            // Stage 5: Embed. The chunker produces text only, and a chunk with no vector
            // is skipped by the upsert, so without this the document is stored, chunked
            // and recorded as indexed while never becoming searchable.
            List<KnowledgeChunk> embeddedChunks = new ArrayList<>(pineconeChunks.size());
            for (KnowledgeChunk chunk : pineconeChunks) {
                List<Float> embedding = embeddingPort.generateEmbedding(chunk.getTextContent());
                if (embedding == null || embedding.isEmpty()) {
                    throw new IllegalStateException(
                        "The embedding service returned nothing for chunk " + chunk.getChunkIndex());
                }
                chunk.setVectorEmbedding(embedding);
                embeddedChunks.add(chunk);
            }
            log.info("Generated {} embeddings for document {}", embeddedChunks.size(), savedDocument.getId());

            job.setProgressPercentage(80);
            uploadJobRepository.save(job);

            // Stage 6: Upsert to Pinecone (batched, 96 per request with retry)
            int upserted = vectorDatabasePort.upsertChunks(
                AppConstants.COLLECTION_SERVICESK_DESK_KNOWLEDGE, embeddedChunks);
            log.info("Upserted {}/{} chunks for document {}", upserted, embeddedChunks.size(), savedDocument.getId());

            // Reporting COMPLETED after a failed upsert is worse than failing: the
            // document looks searchable and silently is not.
            if (upserted < embeddedChunks.size()) {
                throw new IllegalStateException("Only " + upserted + " of " + embeddedChunks.size()
                    + " chunks reached the vector index");
            }

            job.setProgressPercentage(90);
            uploadJobRepository.save(job);

            // Stage 7: Finalization & Status Update (100%)
            savedDocument.setStatus("READY");
            savedDocument.setChunkCount(embeddedChunks.size());
            savedDocument.setLastIndexedAt(LocalDateTime.now());
            documentRepository.save(savedDocument);

            // The indexing_jobs table has existed since the first schema and nothing had
            // ever written to it, so the vector-indexing stage left no record of itself.
            recordIndexingJob(savedDocument.getId(), embeddedChunks.size(), indexingStartedAt,
                uploadedBy, null);

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

            // A failed ingest leaves a FAILED indexing job rather than no row at all,
            // so an unsearchable document is visible as a failure, not as an absence.
            recordIndexingJob(job.getDocumentId(), 0, indexingStartedAt, uploadedBy, e.getMessage());
        }
    }

    /** Never throws: bookkeeping must not turn a completed ingest into a failed one. */
    private void recordIndexingJob(UUID documentId, int chunks, LocalDateTime startedAt,
                                   String actor, String error) {
        try {
            IndexingJobEntity indexingJob = IndexingJobEntity.builder()
                .documentId(documentId)
                .status(error == null ? "COMPLETED" : "FAILED")
                .chunksProcessed(chunks)
                .totalChunks(chunks)
                .progressPercentage(error == null ? 100 : 0)
                .errorMessage(error)
                .startedAt(startedAt)
                .finishedAt(LocalDateTime.now())
                .build();
            indexingJob.setCreatedBy(actor != null ? actor : "system_admin");
            indexingJobRepository.save(indexingJob);
        } catch (Exception e) {
            log.warn("Could not record the indexing job for document {}: {}", documentId, e.getMessage());
        }
    }

    /**
     * What kind of document was uploaded, for the vector metadata.
     *
     * Browsers send an inconsistent mime type for Office formats and often
     * application/octet-stream for anything they do not recognise, so the filename
     * extension is trusted second rather than not at all.
     */
    private DocumentSourceType sourceTypeOf(String mimeType, String filename) {
        String mime = mimeType == null ? "" : mimeType.toLowerCase();
        if (mime.contains("pdf")) return DocumentSourceType.PDF;
        if (mime.contains("wordprocessingml") || mime.contains("msword")) return DocumentSourceType.WORD_DOCX;
        if (mime.contains("spreadsheetml") || mime.contains("ms-excel")) return DocumentSourceType.EXCEL_XLSX;
        if (mime.contains("csv")) return DocumentSourceType.CSV;
        if (mime.contains("markdown")) return DocumentSourceType.MARKDOWN;
        if (mime.contains("zip")) return DocumentSourceType.ZIP_ARCHIVE;

        String name = filename == null ? "" : filename.toLowerCase();
        int dot = name.lastIndexOf('.');
        String extension = dot >= 0 ? name.substring(dot + 1) : "";
        return switch (extension) {
            case "pdf" -> DocumentSourceType.PDF;
            case "doc", "docx" -> DocumentSourceType.WORD_DOCX;
            case "xls", "xlsx" -> DocumentSourceType.EXCEL_XLSX;
            case "csv" -> DocumentSourceType.CSV;
            case "md", "markdown" -> DocumentSourceType.MARKDOWN;
            case "zip" -> DocumentSourceType.ZIP_ARCHIVE;
            default -> DocumentSourceType.TXT;
        };
    }
}
