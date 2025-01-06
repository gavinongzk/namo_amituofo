import Link from 'next/link';
import { Button } from '@/components/ui/button';

const AdminActions = () => {
  return (
    <div className="flex flex-col gap-4 p-6 bg-gray-100 rounded-lg shadow-lg">
      <h4 className="text-2xl font-bold text-center text-gray-800">
        <span className="block">管理员操作</span>
        <span className="block">Admin Actions</span>
      </h4>
      <Link href="/admin/select-event">
        <Button className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white transition duration-300 transform hover:scale-105 rounded-md">
          <span className="block">记录出席</span>
          <span className="block">Take Attendance</span>
        </Button>
      </Link>
      <Link href="/admin/upload_orders">
        <Button className="w-full h-12 bg-yellow-600 hover:bg-yellow-700 text-white transition duration-300 transform hover:scale-105 rounded-md">
          <span className="block">上传订单</span>
          <span className="block">Upload Orders</span>
        </Button>
      </Link>
      <Link href="/admin/users">
        <Button className="w-full h-12 bg-red-600 hover:bg-red-700 text-white transition duration-300 transform hover:scale-105 rounded-md">
          <span className="block">管理用户</span>
          <span className="block">Manage Users</span>
        </Button>
      </Link>
      <Link href="/admin/analytics">
        <Button className="w-full h-12 bg-purple-600 hover:bg-purple-700 text-white transition duration-300 transform hover:scale-105 rounded-md">
          <span className="block">数据分析</span>
          <span className="block">Analytics</span>
        </Button>
      </Link>
    </div>
  );
};

export default AdminActions;
