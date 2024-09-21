// app/(root)/events/[id]/register/page.tsx
import RegisterForm from '@/components/shared/RegisterForm'
import { getEventById } from '@/lib/actions/event.actions'
import Image from 'next/image'

const RegisterPage = async ({ params: { id } }: { params: { id: string } }) => {
  const event = await getEventById(id)

  return (
    <>
      <section className="bg-primary-50 bg-dotted-pattern bg-cover bg-center py-5 md:py-10">
        <h3 className="wrapper h3-bold text-center sm:text-left">Register for Event</h3>
      </section>

      <div className="wrapper my-8">
        <div className="flex flex-col md:flex-row gap-8">
          <div className="flex-1">
            <Image
              src={event.imageUrl}
              alt={event.title}
              width={500}
              height={500}
              className="w-full object-cover rounded-lg"
            />
          </div>
          <div className="flex-1">
            <RegisterForm event={event} />
          </div>
        </div>
      </div>
    </>
  )
}

export default RegisterPage