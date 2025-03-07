import React from 'react'
import { IEvent } from '@/lib/database/models/event.model';
import { Button } from '../ui/button';
import { useRouter } from 'next/navigation';

const Checkout = ({ event, userId }: { event: IEvent, userId: string }) => {
  const router = useRouter();

  const handleRegister = () => {
    router.push(`/events/details/${event._id}/register`);
  }

  return (
    <Button onClick={handleRegister} role="link" size="lg" className="button sm:w-fit">
      Register for Event
    </Button>
  )
}

export default Checkout