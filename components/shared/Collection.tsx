import { IEvent } from '@/lib/database/models/event.model'
import { CustomField } from '@/types';
import React from 'react'
import Card from './Card'
import Pagination from './Pagination'

type CollectionProps = {
  data: (IEvent & { 
    orderId?: string, 
    customFieldValues?: CustomField[], 
    queueNumber?: string, 
    registrationCount?: number 
  })[];
  emptyTitle: string;
  emptyStateSubtext: string;
  limit: number;
  page: number | string;
  totalPages?: number;
  urlParamName?: string;
  collectionType?: 'Events_Organized' | 'My_Tickets' | 'All_Events';
  userId?: string;
}

const Collection = ({
  data,
  emptyTitle,
  emptyStateSubtext,
  page,
  totalPages = 0,
  collectionType,
  urlParamName,
  userId,
}: CollectionProps) => {
  console.log('🎯 Collection received props:', {
    dataLength: data?.length,
    page,
    totalPages,
    collectionType
  });

  // Ensure data is an array and handle null/undefined
  const safeData = Array.isArray(data) ? data : [];
  
  // Filter out null/undefined events and log any that are found
  const validData = safeData.filter(event => {
    if (!event) {
      console.warn('⚠️ Null/undefined event found in collection data');
      return false;
    }
    if (!event._id) {
      console.warn('⚠️ Event missing _id:', event);
      return false;
    }
    return true;
  });

  console.log('📦 Processed collection data:', {
    originalLength: data?.length,
    validLength: validData.length
  });

  return (
    <>
      {validData.length > 0 ? (
        <div className="flex flex-col items-center gap-6 sm:gap-8 md:gap-10">
          <ul className="grid w-full grid-cols-1 gap-4 sm:gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:gap-6">
            {validData.map((event) => {
              console.log('🎨 Rendering event:', {
                id: event._id,
                title: event.title
              });
              
              const hasOrderLink = collectionType === 'Events_Organized';
              const isMyTicket = collectionType === 'My_Tickets';

              return (
                <li key={event._id} className="flex justify-center">
                  <Card 
                    event={event} 
                    hasOrderLink={hasOrderLink} 
                    isMyTicket={isMyTicket} 
                    userId={userId}
                  />
                </li>
              );
            })}
          </ul>

          {totalPages > 1 && (
            <Pagination 
              urlParamName={urlParamName || 'page'}
              page={Number(page) || 1}
              totalPages={Math.max(1, Number(totalPages))}
            />
          )}
        </div>
      ) : (
        <div className="flex-center wrapper min-h-[200px] w-full flex-col gap-3 rounded-[14px] bg-grey-50 py-28 text-center">
          <h3 className="p-bold-20 md:h5-bold">{emptyTitle}</h3>
          <p className="p-regular-14">{emptyStateSubtext}</p>
        </div>
      )}
    </>
  );
};

export default Collection;