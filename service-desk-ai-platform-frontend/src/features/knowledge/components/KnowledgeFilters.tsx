import React from 'react';
import { Box, FormControl, InputLabel, Select, MenuItem, Stack } from '@mui/material';

export interface KnowledgeFiltersState {
  recordType: string;
  category: string;
  state: string;
  connectorType: string;
}

export interface KnowledgeFiltersProps {
  filters: KnowledgeFiltersState;
  onFilterChange: (filters: KnowledgeFiltersState) => void;
  categories?: string[];
}

export const KnowledgeFilters: React.FC<KnowledgeFiltersProps> = ({
  filters,
  onFilterChange,
  categories = ['IT Security', 'Hardware', 'Software', 'Network & VPN', 'Access Management'],
}) => {
  const handleChange = (field: keyof KnowledgeFiltersState, value: string) => {
    onFilterChange({
      ...filters,
      [field]: value,
    });
  };

  return (
    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
      <FormControl size="small" sx={{ minWidth: 160 }}>
        <InputLabel>Record Type</InputLabel>
        <Select
          value={filters.recordType}
          label="Record Type"
          onChange={(e) => handleChange('recordType', e.target.value)}
        >
          <MenuItem value="ALL">All Types</MenuItem>
          <MenuItem value="INCIDENT">Incident</MenuItem>
          <MenuItem value="KNOWLEDGE_ARTICLE">Knowledge Article</MenuItem>
        </Select>
      </FormControl>

      <FormControl size="small" sx={{ minWidth: 160 }}>
        <InputLabel>Category</InputLabel>
        <Select
          value={filters.category}
          label="Category"
          onChange={(e) => handleChange('category', e.target.value)}
        >
          <MenuItem value="ALL">All Categories</MenuItem>
          {categories.map((cat) => (
            <MenuItem key={cat} value={cat}>
              {cat}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl size="small" sx={{ minWidth: 160 }}>
        <InputLabel>State</InputLabel>
        <Select
          value={filters.state}
          label="State"
          onChange={(e) => handleChange('state', e.target.value)}
        >
          <MenuItem value="ALL">All States</MenuItem>
          <MenuItem value="Resolved">Resolved</MenuItem>
          <MenuItem value="Closed">Closed</MenuItem>
          <MenuItem value="Published">Published</MenuItem>
        </Select>
      </FormControl>

      <FormControl size="small" sx={{ minWidth: 160 }}>
        <InputLabel>Connector</InputLabel>
        <Select
          value={filters.connectorType}
          label="Connector"
          onChange={(e) => handleChange('connectorType', e.target.value)}
        >
          <MenuItem value="ALL">All Sources</MenuItem>
          <MenuItem value="SERVICENOW">ServiceNow</MenuItem>
          <MenuItem value="JIRA">Jira</MenuItem>
          <MenuItem value="CONFLUENCE">Confluence</MenuItem>
          <MenuItem value="SHAREPOINT">SharePoint</MenuItem>
        </Select>
      </FormControl>
    </Box>
  );
};
