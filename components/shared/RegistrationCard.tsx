import { IEvent } from '@/lib/database/models/event.model'
import { formatBilingualDateTime } from '@/lib/utils'
import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect } from 'react'
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
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  // Reset image error state when imageUrl changes
  useEffect(() => {
    setImageError(false);
    setImageLoading(true);
  }, [event.imageUrl]);

  return (
    <div className="group relative flex min-h-[320px] w-full max-w-[400px] flex-col overflow-hidden rounded-xl bg-white shadow-md transition-all hover:shadow-lg md:min-h-[380px]">
      <Link 
        href={`/reg/${primaryOrderId}`}
        className="relative flex-center aspect-square w-full bg-gray-50 overflow-hidden rounded-[10px]"
      >
        {event.imageUrl && !imageError ? (
          <>
            <Image 
              src={event.imageUrl} 
              alt={event.title}
              fill
              className={`object-cover transition-opacity duration-300 ${
                imageLoading ? "opacity-0" : "opacity-100"
              }`}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              onLoadingComplete={() => {
                setImageLoading(false);
                setImageError(false);
              }}
              onError={() => {
                console.error(`Failed to load image: ${event.imageUrl}`);
                setImageLoading(false);
                setImageError(true);
              }}
              loading="lazy"
              placeholder="blur"
              blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PC9zdmc+"
              quality={75}
            />
            {imageLoading && (
              <div className="absolute inset-0 bg-gray-100 animate-pulse" />
            )}
          </>
        ) : (
          <div className="flex-center flex-col p-4 text-grey-500 bg-gray-50 w-full h-full rounded-[10px] border-2 border-dashed border-gray-200">
            <div className="flex-center flex-col gap-2 max-w-[200px] text-center">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex-center">
                <div className="w-8 h-8 border-2 border-gray-300 rounded-lg relative overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-4 h-4 bg-gray-300 rounded-full -translate-y-1" />
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 h-3 bg-gray-300" />
                </div>
              </div>
              <p className="p-medium-14 text-gray-600">
                {imageError ? (
                  <span className="text-red-500">Failed to load image</span>
                ) : (
                  "No image available"
                )}
              </p>
              {imageError && (
                <button 
                  onClick={(e) => {
                    e.preventDefault();
                    setImageError(false);
                    setImageLoading(true);
                  }}
                  className="mt-1 text-sm text-primary-500 hover:text-primary-600 hover:underline focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded-sm px-2 py-1"
                >
                  Retry loading
                </button>
              )}
            </div>
          </div>
        )}
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
                  <p className="p-medium-14 md:p-medium-16 text-grey-700 flex items-center justify-between">
                    <span className="flex items-center">
                      <span className="inline-flex items-center justify-center bg-primary-100 text-primary-700 w-5 h-5 rounded-full text-xs font-medium mr-2">
                        {index + 1}
                      </span>
                      {registration.name || 'N/A'}
                    </span>
                    {registration.queueNumber && (
                      <span className="inline-flex items-center justify-center bg-orange-100 text-orange-700 px-2 py-1 rounded-full text-xs font-medium">
                        #{registration.queueNumber}
                      </span>
                    )}
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