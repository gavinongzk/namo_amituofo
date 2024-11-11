import { IEvent } from '@/lib/database/models/event.model'
import { formatDateTime } from '@/lib/utils'
import Image from 'next/image'
import Link from 'next/link'
import { IRegistration } from '@/types'

type Props = {
  event: IRegistration['event']
  registrations: IRegistration['registrations']
}

const RegistrationCard = ({ event, registrations }: Props) => {
  return (
    <div className="group relative flex min-h-[380px] w-full max-w-[400px] flex-col overflow-hidden rounded-xl bg-white shadow-md transition-all hover:shadow-lg md:min-h-[438px]">
      <Link 
        href={`/orders/${event.orderId}`}
        className="flex-center aspect-square w-full bg-gray-50 bg-cover bg-center text-grey-500 transition-transform duration-300 group-hover:scale-105"
        style={{backgroundImage: `url(${event.imageUrl})`}}
      />

      <div className="flex flex-col gap-3 p-5 md:gap-4">
        <div className="flex flex-col gap-2">
          <h2 className="h3-bold line-clamp-2 text-black group-hover:text-primary-500 transition-colors duration-200">{event.title}</h2>
          <p className="p-medium-16 md:p-medium-20 line-clamp-2 text-grey-500">
            {event.startDateTime && formatDateTime(event.startDateTime).dateTime}
          </p>
        </div>

        <div className="flex flex-col gap-2 mt-4">
          {registrations.map((registration, index) => (
            <div key={index} className="bg-gray-50 p-3 rounded-lg animate-fadeIn">
              <p className="p-medium-16 md:p-medium-18 text-black">Queue Number: {registration.queueNumber || 'N/A'}</p>
              <p className="p-medium-14 md:p-medium-16 text-grey-600">Name: {registration.name || 'N/A'}</p>
            </div>
          ))}
        </div>

        <Link href={`/orders/${event.orderId}`} className="flex gap-2 mt-4 text-primary-500 underline hover:text-primary-600 transition-colors duration-200 group-hover:translate-x-2">
          <p>View Details</p>
        </Link>
      </div>
    </div>
  )
}

export default RegistrationCard