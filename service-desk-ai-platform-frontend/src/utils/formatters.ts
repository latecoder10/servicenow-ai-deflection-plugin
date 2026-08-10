import { format, parseISO, isValid } from 'date-fns';

export function formatDate(dateStr?: string | null, formatStr: string = 'MMM dd, yyyy HH:mm'): string {
  if (!dateStr) return '—';
  try {
    const date = parseISO(dateStr);
    if (!isValid(date)) return dateStr;
    return format(date, formatStr);
  } catch {
    return dateStr;
  }
}

export function formatFileSize(bytes?: number | null): string {
  if (bytes === undefined || bytes === null || isNaN(bytes)) return '0 B';
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export const formatBytes = formatFileSize;

export function formatNumber(num?: number | null): string {
  if (num === undefined || num === null || isNaN(num)) return '0';
  return new Intl.NumberFormat('en-US').format(num);
}

export function formatCurrency(amount?: number | null): string {
  if (amount === undefined || amount === null || isNaN(amount)) return '$0';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatPercent(value?: number | null): string {
  if (value === undefined || value === null || isNaN(value)) return '0%';
  return `${value.toFixed(1)}%`;
}

export function formatDurationMs(ms?: number | null): string {
  if (ms === undefined || ms === null || isNaN(ms)) return '0s';
  if (ms < 1000) return `${ms}ms`;
  const seconds = (ms / 1000).toFixed(1);
  return `${seconds}s`;
}
