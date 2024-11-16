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
  // Add debug logs for initial props
  console.log('🔢 Pagination mounted with props:', { 
    page, 
    pageType: typeof page,
    totalPages, 
    totalPagesType: typeof totalPages,
    urlParamName 
  });
  
  const router = useRouter()
  const searchParams = useSearchParams()

  // More defensive page number conversion
  const currentPage = React.useMemo(() => {
    const parsed = Number(page);
    console.log('📊 Parsing page number:', { input: page, parsed, isNaN: isNaN(parsed) });
    return isNaN(parsed) ? 1 : parsed;
  }, [page]);

  // Validate totalPages
  const validTotalPages = React.useMemo(() => {
    const parsed = Number(totalPages);
    console.log('📚 Validating total pages:', { input: totalPages, parsed, isNaN: isNaN(parsed) });
    return isNaN(parsed) || parsed < 1 ? 1 : parsed;
  }, [totalPages]);

  const onClick = React.useCallback((btnType: 'next' | 'prev') => {
    try {
      console.log('🔄 Pagination click started:', { btnType, currentPage, validTotalPages });

      const pageValue = btnType === 'next' 
        ? Math.min(currentPage + 1, validTotalPages)
        : Math.max(currentPage - 1, 1);

      console.log('📝 Calculating new page:', { 
        btnType, 
        currentPage, 
        pageValue,
        searchParams: searchParams.toString() 
      });

      const paramKey = urlParamName || 'page';
      const newUrl = formUrlQuery({
        params: searchParams.toString(),
        key: paramKey,
        value: pageValue.toString(),
      });

      console.log('🔗 Generated new URL:', { newUrl, paramKey, pageValue });
      
      router.push(newUrl, { scroll: false });
    } catch (error) {
      console.error('❌ Error in pagination onClick:', error);
      // Provide fallback behavior
      const fallbackUrl = window.location.pathname;
      console.log('⚠️ Using fallback URL:', fallbackUrl);
      router.push(fallbackUrl);
    }
  }, [currentPage, validTotalPages, searchParams, urlParamName, router]);

  // Add debug render log
  console.log('🎨 Pagination rendering with:', { 
    currentPage, 
    validTotalPages,
    isPrevDisabled: currentPage <= 1,
    isNextDisabled: currentPage >= validTotalPages
  });

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