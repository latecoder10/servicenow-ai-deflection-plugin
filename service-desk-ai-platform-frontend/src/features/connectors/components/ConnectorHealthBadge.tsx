import React from 'react';
import { StatusChip } from '../../../components/ui/StatusChip';

export interface ConnectorHealthBadgeProps {
  status?: 'HEALTHY' | 'WARNING' | 'ERROR' | 'DISCONNECTED' | 'CONNECTED' | string;
}

export const ConnectorHealthBadge: React.FC<ConnectorHealthBadgeProps> = ({ status = 'HEALTHY' }) => {
  return <StatusChip status={status} />;
};
