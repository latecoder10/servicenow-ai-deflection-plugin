import React, { useState } from 'react';
import { Card } from '../../../components/ui/Card';
import { ConfidenceBadge } from './ConfidenceBadge';
import { StepByStepView } from './StepByStepView';
import { Button } from '../../../components/ui/Button';
import { Box, Typography, Paper, Divider, Stack, Chip, IconButton } from '@mui/material';
import { SuggestionResponse } from '../../../types/suggestion';
import { formatDate } from '../../../utils/formatters';
import {
  CheckCircleRounded,
  CancelRounded,
  ContentCopyRounded,
  TerminalRounded,
  BugReportRounded,
  AutoAwesomeRounded,
  MenuBookRounded,
} from '../../../icons';
import { useToast } from '../../../hooks/useToast';

export interface SuggestionResultProps {
  suggestion: SuggestionResponse;
  onCreateIncident: () => void;
}

export const SuggestionResult: React.FC<SuggestionResultProps> = ({
  suggestion,
  onCreateIncident,
}) => {
  const { toastSuccess } = useToast();
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const fullText = `${suggestion.recommendedTitle}\n\n${suggestion.summaryResolution}\n\nSteps:\n${suggestion.stepByStepInstructions?.join('\n')}\n\nCommand/Snippet:\n${suggestion.codeOrCommandSnippet || ''}`;
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    toastSuccess('Resolution details copied to clipboard!');
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <Card
      title={
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AutoAwesomeRounded sx={{ color: '#0366d6' }} />
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#24292e', fontSize: '1.1rem' }}>
              AI Deflection Evaluation Result
            </Typography>
          </Box>
          <ConfidenceBadge score={suggestion.confidenceScore} band={suggestion.confidenceBand} />
        </Box>
      }
      sx={{ mb: 3 }}
    >
      <Stack spacing={2.5}>
        {/* Status Alert Banner */}
        <Box
          sx={{
            p: 2,
            borderRadius: '6px',
            backgroundColor: suggestion.deflectionSuccessful ? '#e6f4ea' : '#fff8c5',
            border: `1px solid ${suggestion.deflectionSuccessful ? '#28a745' : '#f9a825'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 1.5,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            {suggestion.deflectionSuccessful ? (
              <CheckCircleRounded sx={{ color: '#28a745', fontSize: 24 }} />
            ) : (
              <CancelRounded sx={{ color: '#f9a825', fontSize: 24 }} />
            )}
            <Box>
              <Typography
                variant="subtitle2"
                sx={{
                  fontWeight: 700,
                  color: suggestion.deflectionSuccessful ? '#1e7e34' : '#c67d00',
                }}
              >
                {suggestion.deflectionSuccessful
                  ? 'Ticket Deflected Successfully'
                  : 'Deflection Threshold Not Reached'}
              </Typography>
              <Typography variant="body2" sx={{ color: '#586069' }}>
                {suggestion.deflectionSuccessful
                  ? 'Resolution confidence is sufficient to resolve the issue without opening a support ticket.'
                  : 'Resolution confidence is below threshold. Escalate to ServiceNow if needed.'}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              color="inherit"
              size="small"
              startIcon={<ContentCopyRounded />}
              onClick={handleCopy}
            >
              {copied ? 'Copied!' : 'Copy Resolution'}
            </Button>
            {!suggestion.deflectionSuccessful && (
              <Button
                variant="contained"
                color="primary"
                size="small"
                startIcon={<BugReportRounded />}
                onClick={onCreateIncident}
              >
                Create Incident
              </Button>
            )}
          </Box>
        </Box>

        {/* Recommended Title */}
        <Box>
          <Typography variant="caption" sx={{ fontWeight: 600, color: '#586069', display: 'block', mb: 0.5 }}>
            RECOMMENDED SOLUTION TITLE
          </Typography>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#24292e' }}>
            {suggestion.recommendedTitle}
          </Typography>
        </Box>

        {/* Summary Resolution */}
        <Box>
          <Typography variant="caption" sx={{ fontWeight: 600, color: '#586069', display: 'block', mb: 0.5 }}>
            EXECUTIVE RESOLUTION SUMMARY
          </Typography>
          <Typography variant="body1" sx={{ color: '#24292e', lineHeight: 1.6 }}>
            {suggestion.summaryResolution}
          </Typography>
        </Box>

        {/* Step by Step */}
        <StepByStepView steps={suggestion.stepByStepInstructions} />

        {/* Code / Command Snippet */}
        {suggestion.codeOrCommandSnippet && (
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <TerminalRounded sx={{ color: '#0366d6', fontSize: 18 }} />
              <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#24292e' }}>
                Command / Code Snippet
              </Typography>
            </Box>
            <Paper
              sx={{
                p: 2,
                backgroundColor: '#0d1117',
                color: '#c9d1d9',
                fontFamily: '"JetBrains Mono", monospace',
                fontSize: '0.8125rem',
                borderRadius: '6px',
                overflowX: 'auto',
                whiteSpace: 'pre-wrap',
                border: '1px solid #30363d',
              }}
            >
              {suggestion.codeOrCommandSnippet}
            </Paper>
          </Box>
        )}

        <Divider />

        {/* Footer Metadata */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Chip
              icon={<MenuBookRounded sx={{ fontSize: 16 }} />}
              label={`${suggestion.sourcesCount || 3} Vector Sources Used`}
              size="small"
              variant="outlined"
            />
            <Chip
              label={`Model: ${suggestion.generatedByModel || 'gemini-3.6-flash'}`}
              size="small"
              variant="outlined"
            />
          </Box>
          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="caption" sx={{ color: '#586069', display: 'block', fontFamily: 'monospace' }}>
              Correlation ID: {suggestion.correlationId}
            </Typography>
            <Typography variant="caption" sx={{ color: '#586069', display: 'block' }}>
              Evaluated at: {formatDate(suggestion.createdAt)}
            </Typography>
          </Box>
        </Box>
      </Stack>
    </Card>
  );
};
