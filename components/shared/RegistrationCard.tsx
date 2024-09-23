import React from 'react';
import { IRegistration } from '@/types';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { auth } from '@clerk/nextjs';

export type CardProps = {
  registration: IRegistration;
  event: {
    _id: string;
    title: string;
    imageUrl: string;
    organizer: { _id: string };
    orderId?: string;
    customFieldValues?: { id: string; label: string; value: string }[];
    queueNumber?: string;
    attendeeCount?: number;
  };
  isMyTicket?: boolean;
};

const RegistrationCard: React.FC<CardProps> = ({ registration, event, isMyTicket }) => {
  const { sessionClaims } = auth();
  const userId = sessionClaims?.dbUserId as string;
  const isEventCreator = userId === event.organizer._id.toString();

  return (
    <div className="group relative flex min-h-[380px] w-full max-w-[400px] flex-col overflow-hidden rounded-xl bg-white shadow-md transition-all hover:shadow-lg md:min-h-[438px]">
      <Link 
        href={isMyTicket ? `/orders/${event.orderId}` : `/events/${event._id}`} // Conditional redirect
        className="flex-center aspect-square w-full bg-gray-50 bg-cover bg-center text-grey-500"
        style={{backgroundImage: `url(${event.imageUrl})`}}
      />
      <div className="flex flex-col gap-3 p-5 md:gap-4">
        <h3 className="text-xl font-bold text-gray-800">{registration.event.title}</h3>
        <ul className="mt-4 space-y-2">
          {registration.registrations.map((reg, index) => (
            <li key={index} className="flex justify-between py-1 text-gray-600">
              <span>Queue Number: <span className="font-medium">{reg.queueNumber}</span></span>
              <span>Name: <span className="font-medium">{reg.name}</span></span>
            </li>
          ))}
        </ul>
        <Button asChild size="sm" className="mt-4 self-start">
          <Link href={`/events/${registration.eventId}`}>View Event</Link>
        </Button>
      </div>
    </div>
  );
};

export default RegistrationCard;