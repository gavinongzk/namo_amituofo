import { Suspense } from 'react'
import { getOrderCountByEvent } from '@/lib/actions/order.actions'
import { IEvent } from '@/lib/database/models/event.model'
import { CategoryName } from '@/constants'
import RegisterFormClient from './RegisterFormClient'

const RegisterFormSkeleton = () => (
  <div className="animate-pulse space-y-6">
    <div className="h-8 bg-gray-200 rounded w-1/4" />
    <div className="space-y-3">
      <div className="h-12 bg-gray-200 rounded" />
      <div className="h-12 bg-gray-200 rounded" />
    </div>
    <div className="h-10 bg-gray-200 rounded w-1/3" />
  </div>
)

async function RegisterFormWrapper({ 
  event 
}: { 
  event: IEvent & { category: { name: CategoryName } }
}) {
  // Fetch initial order count on server
  const initialOrderCount = await getOrderCountByEvent(event._id)

  return (
    <Suspense fallback={<RegisterFormSkeleton />}>
      <RegisterFormClient 
        event={event} 
        initialOrderCount={initialOrderCount}
      />
    </Suspense>
  )
}

export default RegisterFormWrapper
