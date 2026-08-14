package com.servicedesk.ai.application.service;

import com.servicedesk.ai.application.port.in.SyncServiceNowUseCase;
import com.servicedesk.ai.domain.entity.ConnectorConfigurationEntity;
import com.servicedesk.ai.domain.entity.SyncJobEntity;
import com.servicedesk.ai.domain.model.KnowledgeChunk;
import com.servicedesk.ai.domain.model.KnowledgeRecord;
import com.servicedesk.ai.domain.port.out.EmbeddingPort;
import com.servicedesk.ai.domain.port.out.ServiceNowPort;
import com.servicedesk.ai.domain.port.out.VectorDatabasePort;
import com.servicedesk.ai.domain.repository.ConnectorConfigurationJpaRepository;
import com.servicedesk.ai.domain.repository.SyncJobJpaRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * The behaviour that decides whether a sync is trustworthy: does it resume from real
 * progress, and does it notice when nothing actually reached the index.
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class ServiceNowSyncOrchestratorTest {

    @Mock private ServiceNowPort serviceNowPort;
    @Mock private VectorDatabasePort vectorDatabasePort;
    @Mock private EmbeddingPort embeddingPort;
    @Mock private SyncJobJpaRepository syncJobRepository;
    @Mock private ConnectorConfigurationJpaRepository connectorRepository;
    @Mock private IndexedDocumentCatalog catalog;

    private ServiceNowSyncOrchestrator orchestrator;

    private static final Instant RECORD_UPDATED = Instant.parse("2026-07-13T18:18:28Z");

    @BeforeEach
    void setUp() {
        orchestrator = new ServiceNowSyncOrchestrator(
            serviceNowPort, vectorDatabasePort, embeddingPort, syncJobRepository, connectorRepository, catalog);

        when(embeddingPort.generateEmbedding(anyString())).thenReturn(List.of(0.1f, 0.2f));
        when(syncJobRepository.save(any())).thenAnswer(i -> i.getArgument(0));
        when(connectorRepository.save(any())).thenAnswer(i -> i.getArgument(0));
    }

    private KnowledgeRecord record(String sysId, String number) {
        return KnowledgeRecord.builder()
            .recordSysId(sysId)
            .recordNumber(number)
            .title("VPN will not connect")
            .description("The client fails to start")
            .resolutionNotes("Restart the service")
            .category("Network")
            .priority("1 - Critical")
            .recordType("INCIDENT")
            .sysUpdatedOn(RECORD_UPDATED)
            .build();
    }

    /** One page of results, then an empty page so the paging loop terminates. */
    private void givenRecords(KnowledgeRecord... records) {
        when(serviceNowPort.fetchAllResolvedKnowledgeRecordsSince(any(), anyInt(), eq(0)))
            .thenReturn(List.of(records));
        when(serviceNowPort.fetchAllResolvedKnowledgeRecordsSince(any(), anyInt(), intThat(o -> o > 0)))
            .thenReturn(List.of());
    }

    @Test
    @DisplayName("An indexed record is catalogued in Postgres with its source identity")
    void indexedRecordIsCatalogued() {
        when(connectorRepository.findByConnectorType("SERVICENOW")).thenReturn(Optional.empty());
        givenRecords(record("abc", "INC001"));
        when(vectorDatabasePort.upsertChunks(anyString(), anyList())).thenAnswer(i ->
            ((List<?>) i.getArgument(1)).size());

        orchestrator.sync(new SyncServiceNowUseCase.Command("ALL", null, false));

        ArgumentCaptor<IndexedDocumentCatalog.Entry> entry =
            ArgumentCaptor.forClass(IndexedDocumentCatalog.Entry.class);
        verify(catalog).recordIndexedDocument(entry.capture(), anyList());

        assertEquals("SERVICENOW", entry.getValue().connectorType());
        assertEquals("abc", entry.getValue().externalId());
        assertEquals("INC001", entry.getValue().externalNumber());
        // The vector documentId is the join between the row and its Pinecone entries,
        // so it has to carry the same prefix the chunks were written under.
        assertEquals("sn-abc", entry.getValue().vectorDocumentId());
    }

    @Test
    @DisplayName("A catalogue failure does not fail a record that is already in the index")
    void catalogueFailureDoesNotFailTheRecord() {
        when(connectorRepository.findByConnectorType("SERVICENOW")).thenReturn(Optional.empty());
        givenRecords(record("abc", "INC001"));
        when(vectorDatabasePort.upsertChunks(anyString(), anyList())).thenAnswer(i ->
            ((List<?>) i.getArgument(1)).size());
        doThrow(new RuntimeException("connection pool exhausted"))
            .when(catalog).recordIndexedDocument(any(), anyList());

        SyncServiceNowUseCase.Result result =
            orchestrator.sync(new SyncServiceNowUseCase.Command("ALL", null, false));

        // The vectors are committed before the catalogue write. Counting the record as
        // failed would also hold the watermark back and replay it on every future run,
        // for a record that is genuinely searchable.
        assertTrue(result.status(), "bookkeeping must not fail a successfully indexed record");
        assertEquals(1, result.totalIndexed());
        verify(connectorRepository).save(any());
    }

    @Test
    @DisplayName("An incremental run resumes from the stored watermark, not from the clock")
    void incrementalRunResumesFromTheWatermark() {
        Instant watermark = Instant.parse("2026-06-01T00:00:00Z");
        ConnectorConfigurationEntity config = new ConnectorConfigurationEntity();
        config.setConnectorType("SERVICENOW");
        config.setLastSyncAt(LocalDateTime.ofInstant(watermark, ZoneId.systemDefault()));
        when(connectorRepository.findByConnectorType("SERVICENOW")).thenReturn(Optional.of(config));

        givenRecords(record("abc", "INC001"));
        when(vectorDatabasePort.upsertChunks(anyString(), anyList())).thenAnswer(i ->
            ((List<?>) i.getArgument(1)).size());

        orchestrator.sync(new SyncServiceNowUseCase.Command("ALL", null, false));

        ArgumentCaptor<Instant> since = ArgumentCaptor.forClass(Instant.class);
        verify(serviceNowPort, atLeastOnce())
            .fetchAllResolvedKnowledgeRecordsSince(since.capture(), anyInt(), anyInt());
        assertEquals(watermark, since.getAllValues().get(0),
            "a fixed lookback would re-index the same records on every run");
    }

    @Test
    @DisplayName("A full run ignores the watermark and re-reads everything")
    void fullRunIgnoresTheWatermark() {
        ConnectorConfigurationEntity config = new ConnectorConfigurationEntity();
        config.setLastSyncAt(LocalDateTime.now());
        when(connectorRepository.findByConnectorType("SERVICENOW")).thenReturn(Optional.of(config));

        givenRecords(record("abc", "INC001"));
        when(vectorDatabasePort.upsertChunks(anyString(), anyList())).thenAnswer(i ->
            ((List<?>) i.getArgument(1)).size());

        orchestrator.sync(new SyncServiceNowUseCase.Command("ALL", null, true));

        ArgumentCaptor<Instant> since = ArgumentCaptor.forClass(Instant.class);
        verify(serviceNowPort, atLeastOnce())
            .fetchAllResolvedKnowledgeRecordsSince(since.capture(), anyInt(), anyInt());
        assertEquals(Instant.EPOCH, since.getAllValues().get(0));
    }

    @Test
    @DisplayName("The watermark advances from the record's own timestamp")
    void watermarkComesFromTheRecordNotTheClock() {
        when(connectorRepository.findByConnectorType("SERVICENOW")).thenReturn(Optional.empty());
        givenRecords(record("abc", "INC001"));
        when(vectorDatabasePort.upsertChunks(anyString(), anyList())).thenAnswer(i ->
            ((List<?>) i.getArgument(1)).size());

        orchestrator.sync(new SyncServiceNowUseCase.Command("ALL", null, false));

        ArgumentCaptor<ConnectorConfigurationEntity> saved =
            ArgumentCaptor.forClass(ConnectorConfigurationEntity.class);
        verify(connectorRepository).save(saved.capture());

        Instant stored = saved.getValue().getLastSyncAt().atZone(ZoneId.systemDefault()).toInstant();
        assertTrue(stored.isBefore(RECORD_UPDATED),
            "an overlap is subtracted so a record saved mid-run is not skipped");
        assertTrue(stored.isAfter(RECORD_UPDATED.minusSeconds(600)),
            "the overlap should be minutes, not an arbitrary reset");
    }

    @Test
    @DisplayName("A failed upsert is counted as a failure, not a success")
    void failedUpsertIsNotReportedAsIndexed() {
        when(connectorRepository.findByConnectorType("SERVICENOW")).thenReturn(Optional.empty());
        givenRecords(record("abc", "INC001"));

        // Pinecone rejected the batch. Previously the return value was discarded and the
        // record was counted as created regardless.
        when(vectorDatabasePort.upsertChunks(anyString(), anyList())).thenReturn(0);

        SyncServiceNowUseCase.Result result =
            orchestrator.sync(new SyncServiceNowUseCase.Command("ALL", null, false));

        assertEquals(0, result.totalIndexed(), "nothing reached the index, so nothing was indexed");
        assertFalse(result.status(), "a run that indexed nothing must not report success");
    }

    @Test
    @DisplayName("The watermark does not move past a record that failed to index")
    void watermarkDoesNotSkipFailedRecords() {
        when(connectorRepository.findByConnectorType("SERVICENOW")).thenReturn(Optional.empty());
        givenRecords(record("abc", "INC001"));
        when(vectorDatabasePort.upsertChunks(anyString(), anyList())).thenReturn(0);

        orchestrator.sync(new SyncServiceNowUseCase.Command("ALL", null, false));

        // Progress may still be recorded, but never at or beyond the failed record:
        // that would mean it is skipped by every future run.
        ArgumentCaptor<ConnectorConfigurationEntity> saved =
            ArgumentCaptor.forClass(ConnectorConfigurationEntity.class);
        verify(connectorRepository, atMost(1)).save(saved.capture());

        if (!saved.getAllValues().isEmpty()) {
            Instant stored = saved.getValue().getLastSyncAt().atZone(ZoneId.systemDefault()).toInstant();
            assertTrue(stored.isBefore(RECORD_UPDATED),
                "the watermark passed a record that never reached the index");
        }
    }

    @Test
    @DisplayName("An older failure holds the watermark back even when newer records succeeded")
    void anOlderFailureHoldsTheWatermarkBack() {
        Instant older = RECORD_UPDATED.minusSeconds(86_400);

        KnowledgeRecord fails = record("old", "INC_OLD");
        fails.setSysUpdatedOn(older);
        KnowledgeRecord succeeds = record("new", "INC_NEW");   // uses RECORD_UPDATED

        when(serviceNowPort.fetchAllResolvedKnowledgeRecordsSince(any(), anyInt(), eq(0)))
            .thenReturn(List.of(fails, succeeds));
        when(serviceNowPort.fetchAllResolvedKnowledgeRecordsSince(any(), anyInt(), intThat(o -> o > 0)))
            .thenReturn(List.of());
        when(connectorRepository.findByConnectorType("SERVICENOW")).thenReturn(Optional.empty());

        // The older record fails, the newer one succeeds.
        when(vectorDatabasePort.upsertChunks(anyString(), anyList()))
            .thenReturn(0)
            .thenAnswer(i -> ((List<?>) i.getArgument(1)).size());

        orchestrator.sync(new SyncServiceNowUseCase.Command("ALL", null, false));

        ArgumentCaptor<ConnectorConfigurationEntity> saved =
            ArgumentCaptor.forClass(ConnectorConfigurationEntity.class);
        verify(connectorRepository).save(saved.capture());
        Instant stored = saved.getValue().getLastSyncAt().atZone(ZoneId.systemDefault()).toInstant();

        assertTrue(stored.isBefore(older),
            "advancing to the newest success would strand the older failure permanently");
    }

    @Test
    @DisplayName("Every chunk carries provenance so the answer can be cited")
    void chunksCarryProvenance() {
        when(connectorRepository.findByConnectorType("SERVICENOW")).thenReturn(Optional.empty());
        givenRecords(record("46e2fee9", "INC0000015"));
        when(vectorDatabasePort.upsertChunks(anyString(), anyList())).thenAnswer(i ->
            ((List<?>) i.getArgument(1)).size());

        orchestrator.sync(new SyncServiceNowUseCase.Command("ALL", null, false));

        @SuppressWarnings("unchecked")
        ArgumentCaptor<List<KnowledgeChunk>> chunks = ArgumentCaptor.forClass(List.class);
        verify(vectorDatabasePort).upsertChunks(anyString(), chunks.capture());

        KnowledgeChunk first = chunks.getValue().get(0);
        var attrs = first.getMetadata().customAttributes();
        assertEquals("INC0000015", attrs.get("recordNumber"));
        assertEquals("46e2fee9", attrs.get("recordSysId"));
        assertEquals("SERVICENOW", attrs.get("connectorType"),
            "without connectorType the source filter and the sidebar badge cannot work");
        assertNotNull(first.getVectorEmbedding(), "a chunk with no vector is skipped by the upsert");
    }
}
