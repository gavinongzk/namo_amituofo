import { getOrderCountByEvent } from '@/lib/actions/order.actions'
import { IEvent } from '@/lib/database/models/event.model'
import { CategoryName } from '@/constants'
import RegisterFormClient from './RegisterFormClient'

async function RegisterFormWrapper({ 
  event 
}: { 
  event: IEvent & { category: { name: CategoryName } }
}) {
  // Fetch initial order count on server
  const initialOrderCount = await getOrderCountByEvent(event._id)

  return (
    <RegisterFormClient 
      event={event} 
      initialOrderCount={initialOrderCount}
    />
  )
}

export default RegisterFormWrapper
