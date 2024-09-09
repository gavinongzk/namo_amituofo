import { currentUser } from '@clerk/nextjs';
import AttendanceClient from './AttendanceClient';
import { getEventById } from '@/lib/actions/event.actions';
import { redirect } from 'next/navigation';

const AttendancePage = async ({ searchParams }: { searchParams: { eventId: string } }) => {
  const user = await currentUser();
  const isAdmin = user?.publicMetadata?.role === 'admin' || user?.publicMetadata?.role === 'superadmin';

  if (!isAdmin) {
    return redirect('/');
  }

  const eventId = searchParams.eventId;
  if (!eventId) {
    return redirect('/admin/select-event');
  }

  const event = await getEventById(eventId);

  if (!event) {
    return <div>Event not found</div>;
  }

  return (
    <div>
      <h2>Attendance for {event.title}</h2>
      <AttendanceClient event={event} />
    </div>
  );
};

export default AttendancePage;