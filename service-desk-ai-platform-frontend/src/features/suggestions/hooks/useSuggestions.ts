import { useState } from 'react';
import { apiPostSuggestionsResolve } from '../../../api/apiSuggestions';
import { apiPostServiceNowIncidents } from '../../../api/apiServiceNow';
import { ResolveIncidentRequest, SuggestionResponse } from '../../../types/suggestion';
import { CreateIncidentRequest, Incident } from '../../../types/incident';
import { ProblemDetails } from '../../../types/common';
import { useToast } from '../../../hooks/useToast';

export function useSuggestions() {
  const [suggestion, setSuggestion] = useState<SuggestionResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<ProblemDetails | null>(null);
  const [createdIncident, setCreatedIncident] = useState<Incident | null>(null);
  const [incidentLoading, setIncidentLoading] = useState<boolean>(false);

  const { toastSuccess, toastError, toastInfo } = useToast();

  const resolveQuery = async (data: ResolveIncidentRequest) => {
    setLoading(true);
    setError(null);
    setCreatedIncident(null);

    const res = await apiPostSuggestionsResolve(data);
    setLoading(false);

    if (res.error) {
      setError(res.error);
      setSuggestion(null);
      toastError(res.error.detail || 'Failed to generate resolution suggestion');
    } else {
      setSuggestion(res.data);
      if (res.data.deflectionSuccessful) {
        toastSuccess('High confidence AI deflection resolution found!');
      } else {
        toastInfo('Resolution confidence below threshold. You can escalate to ServiceNow.');
      }
    }
  };

  const createIncident = async (data: CreateIncidentRequest) => {
    setIncidentLoading(true);
    const res = await apiPostServiceNowIncidents(data);
    setIncidentLoading(false);

    if (res.error) {
      toastError(res.error.detail || 'Failed to create ServiceNow incident');
      return null;
    } else {
      setCreatedIncident(res.data);
      toastSuccess(`ServiceNow Incident ${res.data.number} created successfully!`);
      return res.data;
    }
  };

  return {
    suggestion,
    loading,
    error,
    createdIncident,
    incidentLoading,
    resolveQuery,
    createIncident,
    clearSuggestion: () => setSuggestion(null),
  };
}
