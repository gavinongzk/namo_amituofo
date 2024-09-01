// app/(root)/events/[id]/register/page.tsx
import RegisterForm from '@/components/shared/RegisterForm'
import { getEventById } from '@/lib/actions/event.actions'

const RegisterPage = async ({ params: { id } }: { params: { id: string } }) => {
  const event = await getEventById(id)

  return (
    <>
      <section className="bg-primary-50 bg-dotted-pattern bg-cover bg-center py-5 md:py-10">
        <h3 className="wrapper h3-bold text-center sm:text-left">Register for Event</h3>
      </section>

      <div className="wrapper my-8">
        <RegisterForm event={event} />
      </div>
    </>
  )
}

export default RegisterPage