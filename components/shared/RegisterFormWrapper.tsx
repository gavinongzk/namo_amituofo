'use client';

import { Suspense, useEffect, useState } from 'react'
import { getOrderCountByEvent } from '@/lib/actions/order.actions'
import { IEvent } from '@/lib/database/models/event.model'
import { CategoryName } from '@/constants'
import { RegisterFormClient } from './RegisterFormClient'
import { RegisterFormSkeleton } from './RegisterFormSkeleton'

async function RegisterFormWrapper({ 
  event 
}: { 
  event: IEvent & { category: { name: CategoryName } }
}) {
  const [initialOrderCount, setInitialOrderCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  const fetchOrderCount = async () => {
    try {
      const count = await getOrderCountByEvent(event._id);
      setInitialOrderCount(count);
    } catch (error) {
      console.error('Error fetching order count:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderCount();
  }, [event._id]);

  if (isLoading) {
    return <RegisterFormSkeleton />;
  }

  return (
    <Suspense fallback={<RegisterFormSkeleton />}>
      <RegisterFormClient 
        event={event} 
        initialOrderCount={initialOrderCount}
        onRefresh={fetchOrderCount}
      />
    </Suspense>
  )
}

export default RegisterFormWrapper
