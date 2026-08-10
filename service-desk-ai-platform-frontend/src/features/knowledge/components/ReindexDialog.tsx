import React from 'react';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';

export interface ReindexDialogProps {
  open: boolean;
  recordSysId: string | null;
  onClose: () => void;
  onConfirm: () => void;
  loading?: boolean;
}

export const ReindexDialog: React.FC<ReindexDialogProps> = ({
  open,
  recordSysId,
  onClose,
  onConfirm,
  loading = false,
}) => {
  return (
    <ConfirmDialog
      open={open}
      onClose={onClose}
      onConfirm={onConfirm}
      title="Confirm Reindex Operation"
      message={`Are you sure you want to re-extract embeddings and reindex record ${recordSysId || ''} into Pinecone? This will update vector representations.`}
      confirmLabel="Reindex Vector"
      severity="info"
      loading={loading}
    />
  );
};
