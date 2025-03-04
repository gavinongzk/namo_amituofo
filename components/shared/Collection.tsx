import { IEvent } from '@/lib/database/models/event.model'
import { CustomField } from '@/types';
import React from 'react'
import Card from './Card'
import Pagination from './Pagination'
import { formatBilingualDateTime, createEventUrl } from '@/lib/utils'

type CollectionProps = {
  data: (IEvent & { 
    orderId?: string, 
    customFieldValues?: any[], 
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
}

const Collection = ({
  data,
  emptyTitle,
  emptyStateSubtext,
  limit,
  page,
  totalPages = 1,
  urlParamName,
  collectionType
}: CollectionProps) => {
  const validData = data.filter(event => event !== null);

  return (
    <>
      {validData.length > 0 ? (
        <div className="flex flex-col items-center gap-10">
          <ul className="grid w-full grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:gap-10">
            {validData.map((event) => {
              const hasOrderLink = collectionType === 'Events_Organized';
              const isMyTicket = collectionType === 'My_Tickets';

              return (
                <li key={event._id} className="flex justify-center">
                  <Card 
                    event={event} 
                    hasOrderLink={hasOrderLink} 
                    isMyTicket={isMyTicket} 
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