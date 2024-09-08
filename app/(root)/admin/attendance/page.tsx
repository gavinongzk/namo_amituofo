import { currentUser } from '@clerk/nextjs';
import AttendanceClient from './AttendanceClient';
import { useSearchParams } from 'next/navigation'; // Change this line

const AttendancePage = async () => {
  const user = await currentUser();
  const isAdmin = user?.publicMetadata?.role === 'admin' || user?.publicMetadata?.role === 'superadmin';

  if (!isAdmin) {
    return <div>You do not have access to this page.</div>;
  }

  const searchParams = useSearchParams();
  const eventId = searchParams.get('eventId'); // Update this line

  const response = await fetch('/api/events');
  const events = await response.json();

  console.log('Fetched Events:', events); // Add this line

  return (
    <div>
      <h2>Select Event for Attendance</h2>
      <AttendanceClient events={events} selectedEventId={eventId || ''} />
    </div>
  );
};

export default AttendancePage;