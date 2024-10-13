import Link from 'next/link';
import { Button } from '@/components/ui/button';

const AdminActions = () => {
  return (
    <div className="flex flex-col gap-4 p-6 bg-white rounded-lg shadow-md">
      <h4 className="text-lg font-semibold text-center">Admin Actions</h4>
      <Link href="/admin/select-event">
        <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white transition duration-200">
          Take Attendance
        </Button>
      </Link>
      <Link href="/admin/events_archive">
        <Button className="w-full bg-yellow-600 hover:bg-yellow-700 text-white transition duration-200">
          Event Archive
        </Button>
      </Link>
      <Link href="/admin/users">
        <Button className="w-full bg-green-600 hover:bg-green-700 text-white transition duration-200">
          Manage Users
        </Button>
      </Link>
      <Link href="/admin/analytics">
        <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white transition duration-200">
          Analytics
        </Button>
      </Link>
    </div>
  );
};

export default AdminActions;