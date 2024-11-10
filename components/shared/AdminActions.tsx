import Link from 'next/link';
import { Button } from '@/components/ui/button';

const AdminActions = () => {
  return (
    <div className="flex flex-col gap-4 p-6 bg-gray-100 rounded-lg shadow-lg">
      <h4 className="text-2xl font-bold text-center text-gray-800">Admin Actions</h4>
      <Link href="/admin/select-event">
        <Button className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white transition duration-300 transform hover:scale-105 rounded-md">
          Take Attendance
        </Button>
      </Link>
      <Link href="/admin/upload_orders">
        <Button className="w-full h-12 bg-yellow-600 hover:bg-yellow-700 text-white transition duration-300 transform hover:scale-105 rounded-md">
          Upload Orders
        </Button>
      </Link>
      <Link href="/admin/users">
        <Button className="w-full h-12 bg-red-600 hover:bg-red-700 text-white transition duration-300 transform hover:scale-105 rounded-md">
          Manage Users
        </Button>
      </Link>
      <Link href="/admin/analytics">
        <Button className="w-full h-12 bg-purple-600 hover:bg-purple-700 text-white transition duration-300 transform hover:scale-105 rounded-md">
          Analytics
        </Button>
      </Link>
    </div>
  );
};

export default AdminActions;
