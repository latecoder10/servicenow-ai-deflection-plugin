import { useState, useEffect, useCallback } from 'react';
import {
  apiGetFiles,
  apiPostFileUpload,
  apiGetUploadJob,
} from '../../../api/apiFiles';
import { KnowledgeDocumentEntity, UploadJobEntity } from '../../../types/file';
import { ProblemDetails } from '../../../types/common';
import { useToast } from '../../../hooks/useToast';

export function useFiles() {
  const [files, setFiles] = useState<KnowledgeDocumentEntity[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [activeUploadJob, setActiveUploadJob] = useState<UploadJobEntity | null>(null);
  const [error, setError] = useState<ProblemDetails | null>(null);

  const { toastSuccess, toastError, toastInfo } = useToast();

  const fetchFiles = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await apiGetFiles();
    if (res.data) {
      setFiles(res.data);
    } else if (res.error) {
      setError(res.error);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  const pollUploadJob = async (jobId: string) => {
    const maxAttempts = 60;
    let attempts = 0;
    while (attempts < maxAttempts) {
      const res = await apiGetUploadJob(jobId);
      if (res.data) {
        setActiveUploadJob(res.data);
        setUploadProgress(res.data.progressPercentage || 0);

        if (res.data.status === 'COMPLETED' || res.data.status === 'READY') {
          toastSuccess('File uploaded and processed successfully!');
          fetchFiles();
          setActiveUploadJob(null);
          return;
        }
        if (res.data.status === 'FAILED') {
          toastError(res.data.errorMessage || 'File processing failed.');
          setActiveUploadJob(null);
          return;
        }
      }
      attempts++;
      await new Promise((r) => setTimeout(r, 2000));
    }
    setActiveUploadJob(null);
  };

  const handleUpload = async (fileToUpload: File) => {
    setUploading(true);
    setUploadProgress(0);
    toastInfo(`Uploading ${fileToUpload.name}...`);

    const formData = new FormData();
    formData.append('file', fileToUpload);

    const res = await apiPostFileUpload(formData, (e) => {
      if (e.total) {
        setUploadProgress(Math.round((e.loaded / e.total) * 30));
      }
    });

    setUploading(false);

    if (res.error) {
      toastError(res.error.detail || `Failed to upload ${fileToUpload.name}`);
    } else {
      setUploadProgress(30);
      toastInfo('File uploaded. Processing in background...');
      pollUploadJob(res.data.id);
    }
  };

  return {
    files,
    loading,
    uploading,
    uploadProgress,
    activeUploadJob,
    error,
    fetchFiles,
    uploadFile: handleUpload,
  };
}
