import { IEvent } from '@/lib/database/models/event.model'
import { formatBilingualDateTime } from '@/lib/utils'
import Link from 'next/link'
import { IRegistration } from '@/types'

type Props = {
  event: IRegistration['event'] & {
    orderIds?: string[]
  }
  registrations: (IRegistration['registrations'][0] & {
    orderId?: string
  })[]
}

const RegistrationCard = ({ event, registrations }: Props) => {
  const primaryOrderId = event.orderIds?.[0] || event.orderId;

  return (
    <div className="group relative flex min-h-[320px] w-full max-w-[400px] flex-col overflow-hidden rounded-xl bg-white shadow-md transition-all hover:shadow-lg md:min-h-[380px]">
      <Link 
        href={`/reg/${primaryOrderId}`}
        className="relative flex-center aspect-square w-full overflow-hidden"
      >
        <div 
          className="absolute inset-0 bg-center bg-cover transition-transform duration-300 group-hover:scale-105"
          style={{backgroundImage: `url(${event.imageUrl})`}}
        />
      </Link>

      <div className="flex flex-col flex-grow p-3 md:p-5">
        <div className="flex flex-col gap-1 md:gap-2 mb-3 md:mb-4">
          <h2 className="h3-bold line-clamp-2 text-black group-hover:text-primary-500 transition-colors duration-200">
            {event.title}
          </h2>
          {event.startDateTime && (
            <div>
              <p className="text-gray-600 text-sm md:text-base">
                {formatBilingualDateTime(new Date(event.startDateTime)).combined.dateOnly} | {formatBilingualDateTime(new Date(event.startDateTime)).cn.timeOnly} - {formatBilingualDateTime(new Date(event.endDateTime as Date)).cn.timeOnly}
              </p>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2 flex-grow">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium text-gray-700">
              已报名参加者 Registered Participants
            </div>
            <div className="text-sm font-semibold text-primary-500 bg-primary-50 px-2 py-0.5 rounded-full">
              {registrations.length}
            </div>
          </div>
          
          <div className="max-h-[200px] overflow-y-auto pr-1 space-y-1.5 border border-gray-100 rounded-lg p-2 bg-gray-50/50">
            {registrations.length > 0 ? (
              registrations.map((registration, index) => (
                <div 
                  key={index} 
                  className="bg-white p-2 rounded-md shadow-sm border border-gray-100 animate-fadeIn hover:border-primary-200 transition-colors"
                >
                  <p className="p-medium-14 md:p-medium-16 text-grey-700 flex items-center">
                    <span className="inline-flex items-center justify-center bg-primary-100 text-primary-700 w-5 h-5 rounded-full text-xs font-medium mr-2">
                      {index + 1}
                    </span>
                    {registration.name || 'N/A'}
                  </p>
                </div>
              ))
            ) : (
              <div className="text-center py-2 text-gray-500 text-sm">
                暂无参加者 No participants yet
              </div>
            )}
          </div>
        </div>

        <Link 
          href={`/reg/${primaryOrderId}`} 
          className="flex gap-2 mt-4 text-primary-500 hover:text-primary-600 transition-colors duration-200 group-hover:translate-x-2"
        >
          <p>查看报名记录 View Registration Details</p>
        </Link>
      </div>
    </div>
  );
};

export default RegistrationCard