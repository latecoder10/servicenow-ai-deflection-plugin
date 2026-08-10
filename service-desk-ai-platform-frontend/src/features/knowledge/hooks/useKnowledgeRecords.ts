import { useState, useEffect, useCallback } from 'react';
import {
  apiGetKnowledgeRecords,
  apiPostKnowledgeReindex,
  apiDeleteKnowledgeRecord,
} from '../../../api/apiKnowledge';
import { KnowledgeRecord, KnowledgeRecordsParams } from '../../../types/knowledge';
import { ProblemDetails } from '../../../types/common';
import { useToast } from '../../../hooks/useToast';

export function useKnowledgeRecords(initialParams?: KnowledgeRecordsParams) {
  const [records, setRecords] = useState<KnowledgeRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<ProblemDetails | null>(null);
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  const { toastSuccess, toastError } = useToast();

  const fetchRecords = useCallback(async (params?: KnowledgeRecordsParams) => {
    setLoading(true);
    setError(null);
    const res = await apiGetKnowledgeRecords(params || initialParams);
    if (res.error) {
      setError(res.error);
    } else {
      setRecords(res.data || []);
    }
    setLoading(false);
  }, [initialParams]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const handleReindex = async (recordSysId: string) => {
    setActionLoading(true);
    const res = await apiPostKnowledgeReindex(recordSysId);
    setActionLoading(false);

    if (res.error) {
      toastError(res.error.detail || 'Failed to reindex record');
      return false;
    } else {
      toastSuccess(`Reindex initiated for record ${recordSysId}`);
      fetchRecords();
      return true;
    }
  };

  const handleDelete = async (recordSysId: string) => {
    setActionLoading(true);
    const res = await apiDeleteKnowledgeRecord(recordSysId);
    setActionLoading(false);

    if (res.error) {
      toastError(res.error.detail || 'Failed to delete knowledge record');
      return false;
    } else {
      toastSuccess(`Knowledge record ${recordSysId} removed from Pinecone index`);
      fetchRecords();
      return true;
    }
  };

  return {
    records,
    loading,
    error,
    actionLoading,
    refresh: fetchRecords,
    handleReindex,
    handleDelete,
  };
}
