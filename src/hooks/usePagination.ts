import { useState, useMemo, useCallback } from 'react';

interface UsePaginationOptions {
  pageSize?: number;
}

export function usePagination<T>(data: T[], options?: UsePaginationOptions) {
  const [pageSize, setPageSize] = useState(options?.pageSize ?? 10);
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(data.length / pageSize));

  const safePage = Math.min(currentPage, totalPages);

  const paginatedData = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return data.slice(start, start + pageSize);
  }, [data, safePage, pageSize]);

  const reset = useCallback(() => setCurrentPage(1), []);

  const setPage = useCallback((page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  }, [totalPages]);

  const changePageSize = useCallback((size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  }, []);

  return {
    paginatedData,
    currentPage: safePage,
    totalPages,
    totalItems: data.length,
    pageSize,
    setPage,
    setPageSize: changePageSize,
    reset,
  };
}
