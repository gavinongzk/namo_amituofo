import { IOrderItem } from '@/lib/database/models/order.model'
import { formatDateTime } from '@/lib/utils'

type Props = {
  registration: IOrderItem
}

const RegistrationCard = ({ registration }: Props) => {
  return (
    <div className="group relative flex min-h-[380px] w-full max-w-[400px] flex-col overflow-hidden rounded-xl bg-white shadow-md transition-all hover:shadow-lg md:min-h-[438px]">
      <div className="flex flex-col gap-3 p-5 md:gap-4">
        <div className="flex flex-col gap-2">
          <h2 className="h3-bold line-clamp-2 text-black">{registration.eventTitle}</h2>
          <p className="p-medium-16 md:p-medium-20 line-clamp-2 text-black">
            {formatDateTime(registration.createdAt).dateTime}
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <p className="p-medium-16 md:p-medium-18 text-black">Queue Number: {registration.customFieldValues[0].queueNumber}</p>
          {registration.customFieldValues[0].fields.map((field, index) => (
            <p key={index} className="p-medium-14 md:p-medium-16 text-grey-600">
              {field.label}: {field.value}
            </p>
          ))}
        </div>
      </div>
    </div>
  )
}

export default RegistrationCard