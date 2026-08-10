import React, { useState } from 'react';
import { Card } from '../../../components/ui/Card';
import { SearchInput } from '../../../components/ui/SearchInput';
import { Button } from '../../../components/ui/Button';
import { Box, Slider, Typography, FormControl, InputLabel, Select, MenuItem, Grid } from '@mui/material';
import { SearchRounded, PsychologyRounded } from '../../../icons';
import { KnowledgeSearchParams } from '../../../types/knowledge';

export interface KnowledgeSearchProps {
  onSearch: (params: KnowledgeSearchParams) => void;
  loading?: boolean;
}

export const KnowledgeSearch: React.FC<KnowledgeSearchProps> = ({ onSearch, loading }) => {
  const [query, setQuery] = useState('');
  const [workspace, setWorkspace] = useState('Enterprise IT');
  const [category, setCategory] = useState('ALL');
  const [topK, setTopK] = useState(5);

  const handleTriggerSearch = () => {
    if (!query.trim()) return;
    onSearch({
      query,
      workspace,
      category: category === 'ALL' ? undefined : category,
      topK,
    });
  };

  return (
    <Card
      title="Pinecone Vector Semantic Search"
      subtitle="Perform real-time high-dimensional embedding similarity search on indexed ServiceNow knowledge"
      sx={{ mb: 3 }}
    >
      <Grid container spacing={2} sx={{ alignItems: 'center' }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <SearchInput
            value={query}
            onChange={setQuery}
            onSearch={handleTriggerSearch}
            placeholder="e.g. How do I reset VPN credentials or request software license?"
            fullWidth
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 2.5 }}>
          <FormControl fullWidth size="small">
            <InputLabel>Workspace</InputLabel>
            <Select value={workspace} label="Workspace" onChange={(e) => setWorkspace(e.target.value)}>
              <MenuItem value="Enterprise IT">Enterprise IT</MenuItem>
              <MenuItem value="HR Services">HR Services</MenuItem>
              <MenuItem value="Finance & Ops">Finance & Ops</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid size={{ xs: 6, sm: 3, md: 1.5 }}>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, display: 'block', mb: 0.5 }}>
            Top-K Results: {topK}
          </Typography>
          <Slider
            value={topK}
            min={1}
            max={20}
            onChange={(_, val) => setTopK(val as number)}
            size="small"
            valueLabelDisplay="auto"
          />
        </Grid>

        <Grid size={{ xs: 6, sm: 3, md: 2 }}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<SearchRounded />}
            onClick={handleTriggerSearch}
            loading={loading}
            fullWidth
          >
            Vector Search
          </Button>
        </Grid>
      </Grid>
    </Card>
  );
};
