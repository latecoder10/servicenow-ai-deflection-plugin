import { useState, useMemo } from 'react';

export function usePagination<T>(items: T[], initialPageSize: number = 10) {
  const [page, setPage] = useState<number>(0);
  const [pageSize, setPageSize] = useState<number>(initialPageSize);

  const total = items.length;
  const pageCount = Math.ceil(total / pageSize) || 1;

  const paginatedItems = useMemo(() => {
    const start = page * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, page, pageSize]);

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangePageSize = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPageSize(parseInt(event.target.value, 10));
    setPage(0);
  };

  return {
    page,
    pageSize,
    total,
    pageCount,
    paginatedItems,
    setPage,
    setPageSize,
    handleChangePage,
    handleChangePageSize,
  };
}
