package com.servicedesk.ai.application.service;

import com.servicedesk.ai.domain.entity.AttachmentMetadataEntity;
import com.servicedesk.ai.domain.entity.IndexingJobEntity;
import com.servicedesk.ai.domain.entity.KnowledgeChunkEntity;
import com.servicedesk.ai.domain.entity.KnowledgeDocumentEntity;
import com.servicedesk.ai.domain.model.AttachmentMetadata;
import com.servicedesk.ai.domain.model.KnowledgeChunk;
import com.servicedesk.ai.domain.repository.AttachmentMetadataJpaRepository;
import com.servicedesk.ai.domain.repository.IndexingJobJpaRepository;
import com.servicedesk.ai.domain.repository.KnowledgeChunkJpaRepository;
import com.servicedesk.ai.domain.repository.KnowledgeDocumentJpaRepository;
import lombok.Builder;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * The Postgres record of what has been indexed.
 *
 * <p>Only the file-upload path ever wrote to knowledge_documents and knowledge_chunks.
 * Everything synced from ServiceNow or Drive existed purely as vectors in Pinecone,
 * which left three tables inert and meant the index could not be audited, reconciled or
 * rebuilt without re-fetching every record from the source system.
 *
 * <p>This is deliberately a catalogue, not a cache: it stores what was indexed and where
 * its vectors live, not the embeddings. Pinecone remains the thing search reads.
 *
 * <p>Writes here must never fail a sync. The vector index is the searchable artefact and
 * is already committed by the time this runs, so callers record the outcome and carry
 * on rather than rolling a successful index write back.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class IndexedDocumentCatalog {

    /** knowledge_documents.title is NOT NULL and capped at 500. */
    private static final int MAX_TITLE = 500;

    private final KnowledgeDocumentJpaRepository documentRepository;
    private final KnowledgeChunkJpaRepository chunkRepository;
    private final IndexingJobJpaRepository indexingJobRepository;
    private final AttachmentMetadataJpaRepository attachmentRepository;

    @Builder
    public record Entry(
        String connectorType,
        String externalId,
        String externalNumber,
        String vectorDocumentId,
        String title,
        String sourceType,
        String sourceUri,
        String department,
        String category,
        String ownerEmail,
        String recordedBy
    ) {}

    /**
     * Upserts the document row and replaces its chunk rows, then records an indexing job.
     *
     * <p>Chunks are replaced rather than merged, for the same reason the vector upsert
     * clears first: a record that has shrunk since the last sync would otherwise keep
     * its surplus chunks and misreport what is actually in the index.
     *
     * @return the stored document id
     */
    @Transactional
    public UUID recordIndexedDocument(Entry entry, List<KnowledgeChunk> chunks) {
        LocalDateTime now = LocalDateTime.now();
        String actor = entry.recordedBy() != null ? entry.recordedBy() : "system";

        KnowledgeDocumentEntity document = documentRepository
            .findByConnectorTypeAndExternalId(entry.connectorType(), entry.externalId())
            .orElseGet(KnowledgeDocumentEntity::new);

        boolean isNew = document.getId() == null;
        if (isNew) {
            document.setCreatedBy(actor);
        }
        document.setUpdatedBy(actor);

        document.setConnectorType(entry.connectorType());
        document.setExternalId(entry.externalId());
        document.setExternalNumber(entry.externalNumber());
        document.setVectorDocumentId(entry.vectorDocumentId());
        document.setTitle(safeTitle(entry));
        document.setSourceType(entry.sourceType());
        document.setSourceUri(entry.sourceUri());
        document.setDepartmentName(entry.department());
        document.setCategoryName(entry.category());
        document.setOwnerEmail(entry.ownerEmail());
        document.setChunkCount(chunks.size());
        document.setLastIndexedAt(now);
        document.setStatus("READY");

        KnowledgeDocumentEntity saved = documentRepository.save(document);

        if (!isNew) {
            chunkRepository.deleteByDocumentId(saved.getId());
        }

        for (KnowledgeChunk chunk : chunks) {
            KnowledgeChunkEntity row = KnowledgeChunkEntity.builder()
                .documentId(saved.getId())
                .chunkIndex(chunk.getChunkIndex())
                .chunkText(chunk.getTextContent())
                .tokenCount(chunk.getTokenCount())
                .vectorChunkId(chunk.getChunkId())
                .build();
            row.setCreatedBy(actor);
            chunkRepository.save(row);
        }

        IndexingJobEntity job = IndexingJobEntity.builder()
            .documentId(saved.getId())
            .status("COMPLETED")
            .chunksProcessed(chunks.size())
            .totalChunks(chunks.size())
            .progressPercentage(100)
            .startedAt(now)
            .finishedAt(LocalDateTime.now())
            .build();
        job.setCreatedBy(actor);
        indexingJobRepository.save(job);

        return saved.getId();
    }

    /**
     * Records that indexing was attempted and failed, so a gap in the catalogue is
     * visible as a failure rather than as an absence.
     */
    @Transactional
    public void recordIndexingFailure(Entry entry, String reason) {
        LocalDateTime now = LocalDateTime.now();
        UUID documentId = documentRepository
            .findByConnectorTypeAndExternalId(entry.connectorType(), entry.externalId())
            .map(KnowledgeDocumentEntity::getId)
            .orElse(null);

        IndexingJobEntity job = IndexingJobEntity.builder()
            .documentId(documentId)
            .status("FAILED")
            .progressPercentage(0)
            .errorMessage(truncate(reason, 2000))
            .startedAt(now)
            .finishedAt(now)
            .build();
        job.setCreatedBy(entry.recordedBy() != null ? entry.recordedBy() : "system");
        indexingJobRepository.save(job);
    }

    /**
     * Stores attachment references for a record. The binaries stay in the source system;
     * these rows are what make an attachment discoverable without another API round trip.
     *
     * <p>attachment_id is unique, so an attachment already seen is updated in place
     * rather than colliding on a re-sync.
     */
    @Transactional
    public int recordAttachments(List<AttachmentMetadata> attachments, String connectorType, String actor) {
        if (attachments == null || attachments.isEmpty()) {
            return 0;
        }
        int stored = 0;
        for (AttachmentMetadata attachment : attachments) {
            if (attachment.getAttachmentSysId() == null || attachment.getAttachmentSysId().isBlank()) {
                continue;
            }
            AttachmentMetadataEntity row = attachmentRepository
                .findByAttachmentId(attachment.getAttachmentSysId())
                .orElseGet(AttachmentMetadataEntity::new);

            if (row.getId() == null) {
                row.setCreatedBy(actor != null ? actor : "system");
            }
            row.setAttachmentId(attachment.getAttachmentSysId());
            row.setFileName(attachment.getFileName());
            row.setMimeType(attachment.getMimeType());
            row.setFileSize(attachment.getFileSize());
            row.setTableName(attachment.getTableName());
            row.setRecordSysId(attachment.getRecordSysId());
            row.setDownloadUrl(attachment.getDownloadUrl());
            row.setConnectorType(connectorType);
            attachmentRepository.save(row);
            stored++;
        }
        return stored;
    }

    /**
     * Marks a catalogued record as removed once its vectors are purged.
     *
     * <p>Soft delete, and the chunk rows go with it: leaving them behind would make the
     * catalogue claim a document is indexed after it has been deleted from the index,
     * which is worse than having no catalogue at all.
     *
     * @return true when a row was found and marked
     */
    @Transactional
    public boolean markRemoved(String connectorType, String externalId, String actor) {
        return documentRepository.findByConnectorTypeAndExternalId(connectorType, externalId)
            .map(document -> {
                chunkRepository.deleteByDocumentId(document.getId());
                document.setStatus("DELETED");
                document.setChunkCount(0);
                document.setSoftDelete(true);
                document.setUpdatedBy(actor != null ? actor : "system");
                documentRepository.save(document);
                return true;
            })
            .orElse(false);
    }

    /** Never null and never over the column width, because the column is NOT NULL. */
    private String safeTitle(Entry entry) {
        String title = entry.title();
        if (title == null || title.isBlank()) {
            title = entry.externalNumber() != null ? entry.externalNumber() : entry.externalId();
        }
        if (title == null || title.isBlank()) {
            title = "Untitled";
        }
        return truncate(title.trim(), MAX_TITLE);
    }

    private static String truncate(String value, int max) {
        if (value == null) {
            return null;
        }
        return value.length() <= max ? value : value.substring(0, max);
    }
}
