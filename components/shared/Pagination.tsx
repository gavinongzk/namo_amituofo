"use client"

import { useRouter, useSearchParams } from 'next/navigation'
import React from 'react'
import { Button } from '../ui/button'
import { formUrlQuery } from '@/lib/utils'

type PaginationProps = {
  page: number | string;
  totalPages: number;
  urlParamName?: string;
}

const Pagination = ({ page, totalPages, urlParamName }: PaginationProps) => {

  const router = useRouter()
  const searchParams = useSearchParams()

  // More defensive page number conversion
  const currentPage = React.useMemo(() => {
    const parsed = Number(page);
    return isNaN(parsed) ? 1 : parsed;
  }, [page]);

  // Validate totalPages
  const validTotalPages = React.useMemo(() => {
    const parsed = Number(totalPages);
    return isNaN(parsed) || parsed < 1 ? 1 : parsed;
  }, [totalPages]);

  const onClick = React.useCallback((btnType: 'next' | 'prev') => {
    try {

      const pageValue = btnType === 'next' 
        ? Math.min(currentPage + 1, validTotalPages)
        : Math.max(currentPage - 1, 1);

      const paramKey = urlParamName || 'page';
      const newUrl = formUrlQuery({
        params: searchParams.toString(),
        key: paramKey,
        value: pageValue.toString(),
      });
      
      router.push(newUrl, { scroll: false });
    } catch (error) {
      console.error('❌ Error in pagination onClick:', error);
      // Provide fallback behavior
      const fallbackUrl = window.location.pathname;
      router.push(fallbackUrl);
    }
  }, [currentPage, validTotalPages, searchParams, urlParamName, router]);

  return (
    <div className="flex gap-2">
      <Button
        size="lg"
        variant="outline"
        className="w-28"
        onClick={() => onClick('prev')}
        disabled={currentPage <= 1}
      >
        Previous
      </Button>
      <Button
        size="lg"
        variant="outline"
        className="w-28"
        onClick={() => onClick('next')}
        disabled={currentPage >= validTotalPages}
      >
        Next
      </Button>
    </div>
  )
}

// Add display name for better debugging
Pagination.displayName = 'Pagination';

export default Pagination;