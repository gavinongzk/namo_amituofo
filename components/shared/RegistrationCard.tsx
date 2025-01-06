import { IEvent } from '@/lib/database/models/event.model'
import { formatBilingualDateTime } from '@/lib/utils'
import Link from 'next/link'
import { IRegistration } from '@/types'

type Props = {
  event: IRegistration['event']
  registrations: IRegistration['registrations']
}

const RegistrationCard = ({ event, registrations }: Props) => {
  const initialDisplayCount = 3;
  const hasMoreRegistrations = registrations.length > initialDisplayCount;

  return (
    <div className="group relative flex min-h-[380px] w-full max-w-[400px] flex-col overflow-hidden rounded-xl bg-white shadow-md transition-all hover:shadow-lg md:min-h-[438px]">
      <Link 
        href={`/orders/${event.orderId}`}
        className="flex-center aspect-square w-full bg-gray-50 bg-cover bg-center text-grey-500 transition-transform duration-300 group-hover:scale-105"
        style={{backgroundImage: `url(${event.imageUrl})`}}
      />

      <div className="flex flex-col gap-3 p-5 md:gap-4">
        <div className="flex flex-col gap-2">
          <h2 className="h3-bold line-clamp-2 text-black group-hover:text-primary-500 transition-colors duration-200">
            {event.title}
          </h2>
          <p className="p-medium-16 md:p-medium-20 line-clamp-2 text-grey-500">
            {event.startDateTime && formatBilingualDateTime(event.startDateTime).combined.dateTime}
          </p>
        </div>

        <div className="flex flex-col gap-2 mt-4">
          {/* Always show initial registrations */}
          {registrations.slice(0, initialDisplayCount).map((registration, index) => (
            <div key={index} className="bg-gray-50 p-3 rounded-lg animate-fadeIn">
              <p className="p-medium-16 md:p-medium-18 text-black">
                <span className="block">排队号码</span>
                <span className="block">Queue Number: {registration.queueNumber || 'N/A'}</span>
              </p>
              <p className="p-medium-14 md:p-medium-16 text-grey-600">
                <span className="block">姓名</span>
                <span className="block">Name: {registration.name || 'N/A'}</span>
              </p>
            </div>
          ))}

          {/* Show remaining registrations in an expandable details element */}
          {hasMoreRegistrations && (
            <details className="group/details">
              <summary className="cursor-pointer text-primary-500 hover:text-primary-600 transition-colors list-none">
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-sm font-medium">
                    <span className="block">显示更多 {registrations.length - initialDisplayCount} 个</span>
                    <span className="block">Show {registrations.length - initialDisplayCount} More</span>
                  </span>
                  <svg 
                    className="w-4 h-4 transition-transform group-open/details:rotate-180" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </summary>
              <div className="mt-2 space-y-2">
                {registrations.slice(initialDisplayCount).map((registration, index) => (
                  <div 
                    key={index + initialDisplayCount} 
                    className="bg-gray-50 p-3 rounded-lg animate-fadeIn"
                  >
                    <p className="p-medium-16 md:p-medium-18 text-black">
                      <span className="block">排队号码</span>
                      <span className="block">Queue Number: {registration.queueNumber || 'N/A'}</span>
                    </p>
                    <p className="p-medium-14 md:p-medium-16 text-grey-600">
                      <span className="block">姓名</span>
                      <span className="block">Name: {registration.name || 'N/A'}</span>
                    </p>
                  </div>
                ))}
              </div>
            </details>
          )}
        </div>

        <Link 
          href={`/orders/${event.orderId}`} 
          className="flex gap-2 mt-4 text-primary-500 underline hover:text-primary-600 transition-colors duration-200 group-hover:translate-x-2"
        >
          <p>
            <span className="block">查看详情</span>
            <span className="block">View Details</span>
          </p>
        </Link>
      </div>
    </div>
  );
};

export default RegistrationCard