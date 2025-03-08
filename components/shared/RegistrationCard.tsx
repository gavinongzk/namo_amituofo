import { IEvent } from '@/lib/database/models/event.model'
import { formatBilingualDateTime } from '@/lib/utils'
import Link from 'next/link'
import { IRegistration } from '@/types'
import Image from 'next/image'
import { Suspense } from 'react'

type Props = {
  event: IRegistration['event']
  registrations: IRegistration['registrations']
}

// Loading placeholder for the image
const ImagePlaceholder = () => (
  <div className="flex-center aspect-square w-full bg-gray-100 animate-pulse">
    <div className="w-10 h-10 rounded-full bg-gray-200" />
  </div>
)

const RegistrationCard = ({ event, registrations }: Props) => {
  const initialDisplayCount = 3;
  const hasMoreRegistrations = registrations.length > initialDisplayCount;

  return (
    <div className="group relative flex min-h-[320px] w-full max-w-[400px] flex-col overflow-hidden rounded-xl bg-white shadow-md transition-all hover:shadow-lg md:min-h-[380px]">
      <Link 
        href={`/orders/${event.orderId}`}
        className="relative flex-center aspect-square w-full bg-gray-50"
      >
        <Suspense fallback={<ImagePlaceholder />}>
          {event.imageUrl ? (
            <Image
              src={event.imageUrl}
              alt={event.title}
              fill
              sizes="(max-width: 400px) 100vw, 400px"
              className="object-cover object-center"
              priority={false}
              loading="lazy"
              quality={75}
            />
          ) : (
            <div className="flex-center w-full h-full bg-gray-100">
              <span className="text-gray-400">No image available</span>
            </div>
          )}
        </Suspense>
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

        <div className="flex-grow">
          <div className="space-y-2">
            {registrations.slice(0, initialDisplayCount).map((registration, index) => (
              <div key={index} className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Queue Number: {registration.queueNumber}</span>
                <span className="font-medium">{registration.name}</span>
              </div>
            ))}
            {hasMoreRegistrations && (
              <p className="text-sm text-gray-500 italic">
                +{registrations.length - initialDisplayCount} more registrations...
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default RegistrationCard