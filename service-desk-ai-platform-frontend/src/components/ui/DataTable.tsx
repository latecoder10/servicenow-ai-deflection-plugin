import React, { useState, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Paper,
  Box,
} from '@mui/material';
import { DataTablePagination } from './DataTablePagination';
import { DataTableToolbar } from './DataTableToolbar';
import { EmptyState } from './EmptyState';
import { TableSkeleton } from './Skeleton';

export interface Column<T> {
  id: string;
  label: string;
  minWidth?: number;
  align?: 'left' | 'right' | 'center';
  sortable?: boolean;
  render?: (row: T) => React.ReactNode;
  getValue?: (row: T) => any;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  title?: string;
  searchPlaceholder?: string;
  searchable?: boolean;
  searchKeys?: (keyof T)[];
  onRowClick?: (row: T) => void;
  actions?: React.ReactNode;
  emptyTitle?: string;
  emptyDescription?: string;
  initialPageSize?: number;
}

export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  loading = false,
  title,
  searchPlaceholder,
  searchable = true,
  searchKeys,
  onRowClick,
  actions,
  emptyTitle,
  emptyDescription,
  initialPageSize = 10,
}: DataTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(initialPageSize);
  const [orderBy, setOrderBy] = useState<string | null>(null);
  const [order, setOrder] = useState<'asc' | 'desc'>('asc');

  const handleSort = (columnId: string) => {
    const isAsc = orderBy === columnId && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(columnId);
  };

  // Filter items
  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return data;
    const query = searchQuery.toLowerCase().trim();

    return data.filter((row) => {
      if (searchKeys && searchKeys.length > 0) {
        return searchKeys.some((key) => {
          const val = row[key];
          return val !== undefined && val !== null && String(val).toLowerCase().includes(query);
        });
      }
      return Object.values(row).some((val) => {
        return val !== undefined && val !== null && String(val).toLowerCase().includes(query);
      });
    });
  }, [data, searchQuery, searchKeys]);

  // Sort items
  const sortedData = useMemo(() => {
    if (!orderBy) return filteredData;
    const col = columns.find((c) => c.id === orderBy);

    return [...filteredData].sort((a, b) => {
      let valA = col?.getValue ? col.getValue(a) : a[orderBy];
      let valB = col?.getValue ? col.getValue(b) : b[orderBy];

      if (valA === undefined || valA === null) valA = '';
      if (valB === undefined || valB === null) valB = '';

      if (typeof valA === 'string' && typeof valB === 'string') {
        return order === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }

      return order === 'asc' ? (valA < valB ? -1 : 1) : valA < valB ? 1 : -1;
    });
  }, [filteredData, orderBy, order, columns]);

  // Paginated items
  const paginatedData = useMemo(() => {
    const start = page * rowsPerPage;
    return sortedData.slice(start, start + rowsPerPage);
  }, [sortedData, page, rowsPerPage]);

  return (
    <Paper sx={{ border: '1px solid #e1e4e8', borderRadius: '6px', overflow: 'hidden' }}>
      {(title || searchable || actions) && (
        <DataTableToolbar
          title={title}
          searchQuery={searchQuery}
          onSearchChange={searchable ? (val) => { setSearchQuery(val); setPage(0); } : undefined}
          searchPlaceholder={searchPlaceholder}
          actions={actions}
        />
      )}

      <TableContainer>
        <Table sx={{ minWidth: 650 }} size="small">
          <TableHead>
            <TableRow sx={{ backgroundColor: '#f6f8fa' }}>
              {columns.map((col) => (
                <TableCell
                  key={col.id}
                  align={col.align || 'left'}
                  style={{ minWidth: col.minWidth, fontWeight: 600, color: '#24292e', py: 1.5 }}
                >
                  {col.sortable !== false ? (
                    <TableSortLabel
                      active={orderBy === col.id}
                      direction={orderBy === col.id ? order : 'asc'}
                      onClick={() => handleSort(col.id)}
                    >
                      {col.label}
                    </TableSortLabel>
                  ) : (
                    col.label
                  )}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={columns.length} sx={{ p: 3 }}>
                  <TableSkeleton rows={5} columns={columns.length} />
                </TableCell>
              </TableRow>
            ) : paginatedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} sx={{ p: 0 }}>
                  <EmptyState title={emptyTitle} description={emptyDescription} />
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((row, idx) => (
                <TableRow
                  key={idx}
                  hover
                  onClick={() => onRowClick && onRowClick(row)}
                  sx={{
                    cursor: onRowClick ? 'pointer' : 'default',
                    backgroundColor: idx % 2 === 1 ? '#fafbfc' : '#ffffff',
                    '&:hover': {
                      backgroundColor: '#f1f5f9 !important',
                    },
                  }}
                >
                  {columns.map((col) => (
                    <TableCell key={col.id} align={col.align || 'left'} sx={{ py: 1.25, fontSize: '0.875rem' }}>
                      {col.render ? col.render(row) : col.getValue ? col.getValue(row) : row[col.id]}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {!loading && sortedData.length > 0 && (
        <DataTablePagination
          count={sortedData.length}
          page={page}
          rowsPerPage={rowsPerPage}
          onPageChange={(_, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
        />
      )}
    </Paper>
  );
}
