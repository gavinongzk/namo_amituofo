import EventForm from "@/components/shared/EventForm"
import { auth, currentUser } from "@clerk/nextjs";
import { redirect } from 'next/navigation';
import { connectToDatabase } from '@/lib/database';
import Event from '@/lib/database/models/event.model';
import User from '@/lib/database/models/user.model';
import Category from '@/lib/database/models/category.model';

type UpdateEventProps = {
  params: {
    slug: string
  }
}

const UpdateEvent = async ({ params: { slug } }: UpdateEventProps) => {
  const user = await currentUser();
  if (!user) {
    redirect('/sign-in');
  }
  
  const userId = user.publicMetadata.userId as string;
  
  if (!userId) {
    redirect('/');
  }

  // Find event by slug
  await connectToDatabase();
  const event = await Event.findOne({ slug, isDeleted: { $ne: true } })
    .populate({ path: 'organizer', model: User, select: '_id' })
    .populate({ path: 'category', model: Category, select: '_id name' })
    .lean();

  if (!event) {
    redirect('/events');
  }

  // Ensure event is properly typed
  const typedEvent = event as any;

  // Check if user is the organizer
  if (typedEvent.organizer._id.toString() !== userId) {
    redirect('/');
  }

  return (
    <>
      <section className="bg-primary-50 bg-dotted-pattern bg-cover bg-center py-5 md:py-10">
        <h3 className="wrapper h3-bold text-center sm:text-left">Update Event</h3>
      </section>

      <div className="wrapper my-8">
        <EventForm 
          type="Update" 
          event={typedEvent} 
          eventId={typedEvent._id} 
          userId={userId} 
        />
      </div>
    </>
  )
}

export default UpdateEvent 