'use client'

import { Suspense } from 'react'
import { getAnalyticsData } from '@/lib/actions/analytics.actions'
import AnalyticsDashboard from '@/components/shared/AnalyticsDashboard'
import { Skeleton } from '@/components/ui/skeleton'

export const revalidate = 3600 // Revalidate page every hour

export default async function AnalyticsPage() {
  const data = await getAnalyticsData()
  
  return (
    <Suspense fallback={<AnalyticsSkeleton />}>
      <AnalyticsDashboard initialData={data} />
    </Suspense>
  )
}

function AnalyticsSkeleton() {
  return (
    <div className="p-6 space-y-8">
      <Skeleton className="h-8 w-48" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-[300px]" />
        ))}
      </div>
      <Skeleton className="h-[400px]" />
    </div>
  )
}