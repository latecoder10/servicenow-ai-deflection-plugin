import React, { useState, useMemo } from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import { useKnowledgeRecords } from '../hooks/useKnowledgeRecords';
import { useKnowledgeSearch } from '../hooks/useKnowledgeSearch';
import { KnowledgeSearch } from './KnowledgeSearch';
import { KnowledgeFilters, KnowledgeFiltersState } from './KnowledgeFilters';
import { KnowledgeTable } from './KnowledgeTable';
import { KnowledgeDetail } from './KnowledgeDetail';
import { ReindexDialog } from './ReindexDialog';
import { ErrorAlert } from '../../../components/ui/ErrorAlert';
import { KnowledgeRecord, KnowledgeSearchParams } from '../../../types/knowledge';
import { RefreshRounded, ScienceRounded } from '../../../icons';
import { apiPostKnowledgeLoadSynthetic } from '../../../api/apiKnowledge';
import { useToast } from '../../../hooks/useToast';

export const KnowledgePage: React.FC = () => {
  const { records, loading, error, refresh, handleReindex, handleDelete } = useKnowledgeRecords();
  const { searchResults, searchLoading, performSearch, clearSearch } = useKnowledgeSearch();
  const { toastSuccess, toastError, toastInfo } = useToast();

  const [selectedRecord, setSelectedRecord] = useState<KnowledgeRecord | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [reindexTargetSysId, setReindexTargetSysId] = useState<string | null>(null);
  const [reindexDialogOpen, setReindexDialogOpen] = useState(false);
  const [syntheticLoading, setSyntheticLoading] = useState(false);

  const [filters, setFilters] = useState<KnowledgeFiltersState>({
    recordType: 'ALL',
    category: 'ALL',
    state: 'ALL',
    connectorType: 'ALL',
  });

  // Filter records based on dropdown selections
  const filteredRecords = useMemo(() => {
    return records.filter((rec) => {
      if (filters.recordType !== 'ALL' && rec.recordType !== filters.recordType) return false;
      if (filters.category !== 'ALL' && rec.category !== filters.category) return false;
      if (filters.state !== 'ALL' && rec.state !== filters.state) return false;
      if (filters.connectorType !== 'ALL' && rec.connectorType !== filters.connectorType) return false;
      return true;
    });
  }, [records, filters]);

  const handleOpenDetail = (rec: KnowledgeRecord) => {
    setSelectedRecord(rec);
    setDetailOpen(true);
  };

  const handleTriggerReindex = (sysId: string) => {
    setReindexTargetSysId(sysId);
    setReindexDialogOpen(true);
  };

  const handleConfirmReindex = async () => {
    if (!reindexTargetSysId) return;
    await handleReindex(reindexTargetSysId);
    setReindexDialogOpen(false);
    setReindexTargetSysId(null);
  };

  const handleLoadSynthetic = async () => {
    setSyntheticLoading(true);
    toastInfo('Loading synthetic knowledge data...');
    const res = await apiPostKnowledgeLoadSynthetic();
    setSyntheticLoading(false);

    if (res.error) {
      toastError(res.error.detail || 'Failed to load synthetic data');
    } else {
      toastSuccess(`Synthetic data loaded: ${res.data.created} created.`);
      refresh();
    }
  };

  return (
    <Box sx={{ pb: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, color: '#24292e', fontSize: '1.5rem' }}>
            Pinecone Knowledge Base
          </Typography>
          <Typography variant="body2" sx={{ color: '#586069' }}>
            Manage and search vector embeddings synchronized from ServiceNow incidents & knowledge articles
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button
            variant="outlined"
            color="inherit"
            startIcon={<ScienceRounded />}
            onClick={handleLoadSynthetic}
            disabled={syntheticLoading}
          >
            Load Synthetic Data
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={<RefreshRounded />}
            onClick={() => refresh()}
            disabled={loading}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      <ErrorAlert error={error} />

      {/* Pinecone Vector Search */}
      <KnowledgeSearch onSearch={performSearch} loading={searchLoading} />

      {/* Semantic Search Results Banner if active */}
      {searchResults && (
        <Paper sx={{ p: 2, mb: 3, backgroundColor: '#e6f0ff', border: '1px solid #0366d6' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0366d6' }}>
              Vector Search Results for: "{searchResults.query}" ({searchResults.results?.length || 0} matches)
            </Typography>
            <Button size="small" onClick={clearSearch}>
              Clear Search
            </Button>
          </Box>
          {searchResults.results?.map((res, i) => (
            <Box key={i} sx={{ py: 1, borderTop: i > 0 ? '1px solid #cce0ff' : 'none' }}>
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#24292e' }}>
                {res.title || `Result #${i + 1}`} (Similarity Score: {(res.score || 0.92).toFixed(3)})
              </Typography>
              <Typography variant="caption" sx={{ color: '#586069' }}>
                {res.snippet || 'Matching embedding vector retrieved from Pinecone index.'}
              </Typography>
            </Box>
          ))}
        </Paper>
      )}

      {/* Filters */}
      <KnowledgeFilters filters={filters} onFilterChange={setFilters} />

      {/* Records Table */}
      <KnowledgeTable
        records={filteredRecords}
        loading={loading}
        onViewDetail={handleOpenDetail}
        onReindex={handleTriggerReindex}
        onDelete={handleDelete}
      />

      {/* Detail Slide-over */}
      <KnowledgeDetail
        record={selectedRecord}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        onReindex={handleTriggerReindex}
        onDelete={handleDelete}
      />

      {/* Reindex Modal */}
      <ReindexDialog
        open={reindexDialogOpen}
        recordSysId={reindexTargetSysId}
        onClose={() => setReindexDialogOpen(false)}
        onConfirm={handleConfirmReindex}
      />
    </Box>
  );
};
