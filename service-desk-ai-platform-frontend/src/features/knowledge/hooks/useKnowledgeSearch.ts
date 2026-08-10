import { useState, useCallback } from 'react';
import { apiGetKnowledgeSearch } from '../../../api/apiKnowledge';
import { KnowledgeSearchParams, KnowledgeSearchResult } from '../../../types/knowledge';
import { ProblemDetails } from '../../../types/common';

export function useKnowledgeSearch() {
  const [searchResults, setSearchResults] = useState<KnowledgeSearchResult | null>(null);
  const [searchLoading, setSearchLoading] = useState<boolean>(false);
  const [searchError, setSearchError] = useState<ProblemDetails | null>(null);

  const performSearch = useCallback(async (params: KnowledgeSearchParams) => {
    if (!params.query || !params.query.trim()) return;

    setSearchLoading(true);
    setSearchError(null);

    const res = await apiGetKnowledgeSearch(params);
    if (res.error) {
      setSearchError(res.error);
      setSearchResults(null);
    } else {
      setSearchResults(res.data);
    }
    setSearchLoading(false);
  }, []);

  const clearSearch = () => {
    setSearchResults(null);
    setSearchError(null);
  };

  return {
    searchResults,
    searchLoading,
    searchError,
    performSearch,
    clearSearch,
  };
}
