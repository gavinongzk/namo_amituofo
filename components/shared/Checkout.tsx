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
    <Button
      onClick={handleRegister}
      role="link"
      size="lg"
      className="button w-full sm:w-fit bg-primary text-primary-foreground font-semibold shadow-md hover:bg-primary/90 hover:shadow-lg focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2"
    >
      Register for Event
    </Button>
  )
}

export default Checkout