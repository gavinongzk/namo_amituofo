import { currentUser } from '@clerk/nextjs';
import AttendanceClient from './AttendanceClient';

const AttendancePage = async ({ params }: { params: { eventId: string } }) => {
  const user = await currentUser();
  const isAdmin = user?.publicMetadata?.role === 'admin' || user?.publicMetadata?.role === 'superadmin';

  if (!isAdmin) {
    return <div>You do not have access to this page.</div>;
  }

  const { eventId } = params; // Assuming eventId is part of the route parameters

  return <AttendanceClient eventId={eventId} />;
};

export default AttendancePage;