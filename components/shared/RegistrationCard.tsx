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
    queueNumber: string | undefined;
    name: string | undefined;
  }[];
  isMyTicket?: boolean;
};

const RegistrationCard: React.FC<CardProps> = ({ event, registrations, isMyTicket }) => {
  return (
    <div className="group relative flex min-h-[380px] w-full max-w-[400px] flex-col overflow-hidden rounded-xl bg-white shadow-md transition-all hover:shadow-lg md:min-h-[438px]">
      <Link 
        href={isMyTicket ? `/orders/${event.orderId}` : `/events/${event._id}`} // Conditional redirect
        className="flex-center aspect-square w-full bg-gray-50 bg-cover bg-center text-grey-500"
        style={{backgroundImage: `url(${event.imageUrl})`}}
      />
      <div className="flex flex-col gap-3 p-5 md:gap-4">
        <h3 className="text-xl font-bold text-gray-800">{event.title}</h3>
        <ul className="mt-4 space-y-2">
          {registrations.map((reg, index) => (
            <li key={index} className="flex flex-col py-1 text-gray-600">
              <div className="flex justify-between">
                <span>Queue Number 队列号码: <span className="font-medium">{reg.queueNumber}</span></span>
              </div>
              <div className="flex justify-between">
                <span>Name 姓名: <span className="font-medium">{reg.name}</span></span>
              </div>
            </li>
          ))}
        </ul>
        <Button asChild size="sm" className="mt-4 self-start">
          <Link href={`/orders/${event.orderId}`}>View Order Details 查看订单详情</Link>
        </Button>
      </div>
    </div>
  );
};

export default RegistrationCard;