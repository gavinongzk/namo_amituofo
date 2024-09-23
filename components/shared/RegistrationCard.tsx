import React from 'react';
import { IRegistration } from '@/types';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export type CardProps = {
  registration: IRegistration;
};

const RegistrationCard: React.FC<CardProps> = ({ registration }) => {
  return (
    <div className="group relative flex w-full max-w-400px flex-col overflow-hidden rounded-xl bg-white shadow-md transition-all hover:shadow-lg md:min-h-[438px]">
      <div className="p-5">
        <h3 className="text-xl font-bold">{registration.eventTitle}</h3>
        <ul className="mt-4">
          {registration.registrations.map((reg, index) => (
            <li key={index} className="flex justify-between py-1">
              <span>Queue Number: {reg.queueNumber}</span>
              <span>Name: {reg.name}</span>
            </li>
          ))}
        </ul>
        <Button asChild size="sm" className="mt-4">
          <Link href={`/events/${registration.eventId}`}>View Event</Link>
        </Button>
      </div>
    </div>
  );
};

export default RegistrationCard;