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
  console.log('🔢 Pagination props:', { page, totalPages, urlParamName });
  
  const router = useRouter()
  const searchParams = useSearchParams()

  // Ensure page is a valid number
  const currentPage = Number(page) || 1;
  
  const onClick = (btnType: string) => {
    try {
      const pageValue = btnType === 'next' 
        ? currentPage + 1 
        : currentPage - 1;

      console.log('🔄 Pagination click:', { btnType, currentPage, newPage: pageValue });

      const newUrl = formUrlQuery({
        params: searchParams.toString(),
        key: urlParamName || 'page',
        value: pageValue.toString(),
      });

      router.push(newUrl, {scroll: false});
    } catch (error) {
      console.error('❌ Error in pagination onClick:', error);
    }
  }

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
        disabled={currentPage >= totalPages}
      >
        Next
      </Button>
    </div>
  )
}

export default Pagination;