import EventForm from "@/components/shared/EventForm"
import { getEventById } from "@/lib/actions/event.actions"
import { auth, currentUser } from "@clerk/nextjs";
import { redirect } from "next/navigation";

type UpdateEventProps = {
  params: {
    id: string
  }
}

const UpdateEvent = async ({ params: { id } }: UpdateEventProps) => {
  const user = await currentUser();
  const userId = user?.publicMetadata.userId as string;

  try {
    const event = await getEventById(id);

    if (!event) {
      // Redirect to events page if event not found
      redirect('/events');
    }

    return (
      <>
        <section className="bg-primary-50 bg-dotted-pattern bg-cover bg-center py-5 md:py-10">
          <h3 className="wrapper h3-bold text-center sm:text-left">Update Event</h3>
        </section>

        <div className="wrapper my-8">
          <EventForm 
            type="Update" 
            event={event} 
            eventId={event._id} 
            userId={userId} 
          />
        </div>
      </>
    )
  } catch (error) {
    // Redirect to events page in case of any error
    redirect('/events');
  }
}

export default UpdateEvent