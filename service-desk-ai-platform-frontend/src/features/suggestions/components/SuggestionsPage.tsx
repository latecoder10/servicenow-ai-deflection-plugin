import React, { useState } from 'react';
import { Box, Typography } from '@mui/material';
import { useSuggestions } from '../hooks/useSuggestions';
import { SuggestionForm } from './SuggestionForm';
import { SuggestionResult } from './SuggestionResult';
import { CreateIncidentDialog } from './CreateIncidentDialog';
import { ErrorAlert } from '../../../components/ui/ErrorAlert';
import { ResolveIncidentRequest } from '../../../types/suggestion';

export const SuggestionsPage: React.FC = () => {
  const {
    suggestion,
    loading,
    error,
    incidentLoading,
    resolveQuery,
    createIncident,
  } = useSuggestions();

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [lastQueryData, setLastQueryData] = useState<ResolveIncidentRequest | null>(null);

  const handleSubmitQuery = async (data: ResolveIncidentRequest) => {
    setLastQueryData(data);
    await resolveQuery(data);
  };

  const handleOpenCreateIncident = () => {
    setCreateDialogOpen(true);
  };

  const handleConfirmCreateIncident = async (data: any) => {
    const res = await createIncident(data);
    if (res) {
      setCreateDialogOpen(false);
    }
  };

  return (
    <Box sx={{ pb: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: '#24292e', fontSize: '1.5rem' }}>
          AI Ticket Deflection Engine
        </Typography>
        <Typography variant="body2" sx={{ color: '#586069' }}>
          Submit user incident queries to test real-time Google Gemini 3.6 Flash vector resolution suggestions
        </Typography>
      </Box>

      {/* Error Alert */}
      <ErrorAlert error={error} />

      {/* Suggestion Form */}
      <Box sx={{ mb: 3 }}>
        <SuggestionForm onSubmit={handleSubmitQuery} loading={loading} />
      </Box>

      {/* Suggestion Result */}
      {suggestion && (
        <SuggestionResult
          suggestion={suggestion}
          onCreateIncident={handleOpenCreateIncident}
        />
      )}

      {/* Create Incident Dialog */}
      <CreateIncidentDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onSubmit={handleConfirmCreateIncident}
        loading={incidentLoading}
        initialTitle={lastQueryData?.title || ''}
        initialDescription={lastQueryData?.description || ''}
        initialCategory={lastQueryData?.category || 'IT Security'}
        initialEmail={lastQueryData?.callerEmail || 'ayan.estspace@gmail.com'}
      />
    </Box>
  );
};
