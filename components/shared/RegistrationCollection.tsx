import React, { FC } from 'react';
import RegistrationCard from './RegistrationCard';
import Pagination from './Pagination';
import { IRegistration } from '@/types';

type CollectionProps = {
  data: IRegistration[];
  emptyTitle: string;
  emptyStateSubtext: string;
  limit: number;
  page: number | string;
  totalPages?: number;
  urlParamName?: string;
  collectionType?: 'Events_Organized' | 'My_Tickets' | 'My_Registrations' | 'All_Events';
};

const RegistrationCollection: FC<CollectionProps> = ({
  data,
  emptyTitle,
  emptyStateSubtext,
  limit = 3,
  page,
  totalPages = 0,
  collectionType,
  urlParamName,
}) => {
  const offset = (Number(page) - 1) * Number(limit);
  const paginatedData = data.slice(offset, offset + Number(limit));

  return (
    <>
      {paginatedData.length > 0 ? (
        <div className="flex flex-col items-center gap-10">
          <ul className="grid w-full grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:gap-10">
            {paginatedData.map((item: IRegistration) => (
              <li key={item.event._id} className="flex justify-center">
                <RegistrationCard
                  event={{
                    ...item.event,
                    imageUrl: item.event.imageUrl || '',
                    customFieldValues: item.event.customFieldValues?.map(group => ({
                      groupId: group.groupId || '',
                      fields: group.fields?.map(field => ({
                        id: field.id || '',
                        label: field.label || '',
                        type: field.type || '',
                        value: field.value || ''
                      })) || []
                    })) || []
                  }}
                  registrations={item.registrations.map(reg => ({
                    queueNumber: reg.queueNumber || '',
                    name: reg.name || ''
                  }))}
                  isMyTicket={collectionType === 'My_Tickets'}
                />
              </li>
            ))}
          </ul>

          {totalPages > 1 && (
            <Pagination urlParamName={urlParamName} page={page} totalPages={totalPages} />
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

export default RegistrationCollection;