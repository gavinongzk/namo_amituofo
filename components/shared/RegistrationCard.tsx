import React from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export type CardProps = {
  event: {
    _id: string;
    title: string;
    imageUrl: string;
    organizer: { _id: string };
    orderId?: string;
    customFieldValues?: {
      groupId: string;
      fields: {
        id: string;
        label: string;
        type: string;
        value: string;
      }[];
    }[];
    queueNumber?: string;
    attendeeCount?: number;
  };
  registrations: {
    queueNumber: string;
    name: string;
  }[];
  isMyTicket?: boolean;
};

const RegistrationCard: React.FC<CardProps> = ({ event, registrations, isMyTicket }) => {
  return (
    <div className="group relative flex min-h-[380px] w-full max-w-[400px] flex-col overflow-hidden rounded-xl bg-white shadow-md transition-all hover:shadow-lg md:min-h-[438px]">
      <Link 
        href={isMyTicket ? `/orders/${event.orderId}` : `/events/${event._id}`}
        className="flex-center aspect-square w-full bg-gray-50 bg-cover bg-center text-grey-500"
        style={{backgroundImage: `url(${event.imageUrl})`}}
      />
      <div className="flex flex-col gap-3 p-5 md:gap-4">
        <h3 className="text-xl font-bold text-gray-800">{event.title}</h3>
        <ul className="mt-4 space-y-2">
          {registrations.map((reg, index) => (
            <li key={index} className="flex justify-between py-1 text-gray-600">
              <span>Queue Number: <span className="font-medium">{reg.queueNumber}</span></span>
              <span>Name: <span className="font-medium">{reg.name}</span></span>
            </li>
          ))}
        </ul>
        {event.customFieldValues && event.customFieldValues.map((group, groupIndex) => (
          <div key={group.groupId}>
            <h4 className="font-semibold mt-2">Group {groupIndex + 1}</h4>
            <ul className="space-y-1">
              {group.fields.map((field) => (
                <li key={field.id} className="text-sm">
                  <span className="font-medium">{field.label}:</span> {field.value}
                </li>
              ))}
            </ul>
          </div>
        ))}
        <Button asChild size="sm" className="mt-4 self-start">
          <Link href={`/events/${event._id}`}>View Event</Link>
        </Button>
      </div>
    </div>
  );
};

export default RegistrationCard;