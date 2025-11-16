'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useUser } from '@clerk/nextjs';

const AdminActions = () => {
  const [loadingPath, setLoadingPath] = useState<string | null>(null);
  const pathname = usePathname();
  const { user } = useUser();
  const isSuperAdmin = user?.publicMetadata?.role === 'superadmin';

  useEffect(() => {
    setLoadingPath(null);
  }, [pathname]);

  const handleClick = (path: string) => {
    setLoadingPath(path);
  };

  const buttonClass = "w-full h-12 transition duration-300 transform hover:scale-105 rounded-md flex items-center justify-center gap-2";

  return (
    <div className="flex flex-col gap-4 p-6 bg-gray-100 rounded-lg shadow-lg">
      <h4 className="text-2xl font-bold text-center text-gray-800">管理员操作 / Admin Actions</h4>
      <Link href="/admin/select-event" onClick={() => handleClick('/admin/select-event')}>
        <Button className={`${buttonClass} bg-blue-600 hover:bg-blue-700 text-white`} disabled={loadingPath === '/admin/select-event'}>
          {loadingPath === '/admin/select-event' ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              加载中... / Loading...
            </>
          ) : (
            '记录出席 / Take Attendance'
          )}
        </Button>
      </Link>
      {isSuperAdmin && (
        <>
          <Link href="/profile" onClick={() => handleClick('/profile')}>
            <Button className={`${buttonClass} bg-green-600 hover:bg-green-700 text-white`} disabled={loadingPath === '/profile'}>
              {loadingPath === '/profile' ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  加载中... / Loading...
                </>
              ) : (
                '我的活动 / My Events'
              )}
            </Button>
          </Link>
          <Link href="/events/create" onClick={() => handleClick('/events/create')}>
            <Button className={`${buttonClass} bg-indigo-600 hover:bg-indigo-700 text-white`} disabled={loadingPath === '/events/create'}>
              {loadingPath === '/events/create' ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  加载中... / Loading...
                </>
              ) : (
                '创建活动 / Create Event'
              )}
            </Button>
          </Link>
          <Link href="/admin/upload_orders" onClick={() => handleClick('/admin/upload_orders')}>
            <Button className={`${buttonClass} bg-yellow-600 hover:bg-yellow-700 text-white`} disabled={loadingPath === '/admin/upload_orders'}>
              {loadingPath === '/admin/upload_orders' ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  加载中... / Loading...
                </>
              ) : (
                '上传订单 / Upload Orders'
              )}
            </Button>
          </Link>
          <Link href="/admin/users" onClick={() => handleClick('/admin/users')}>
            <Button className={`${buttonClass} bg-red-600 hover:bg-red-700 text-white`} disabled={loadingPath === '/admin/users'}>
              {loadingPath === '/admin/users' ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  加载中... / Loading...
                </>
              ) : (
                '管理用户 / Manage Users'
              )}
            </Button>
          </Link>
          <Link href="/admin/analytics" onClick={() => handleClick('/admin/analytics')}>
            <Button className={`${buttonClass} bg-purple-600 hover:bg-purple-700 text-white`} disabled={loadingPath === '/admin/analytics'}>
              {loadingPath === '/admin/analytics' ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  加载中... / Loading...
                </>
              ) : (
                '数据分析 / Analytics'
              )}
            </Button>
          </Link>
          <Link href="/admin/volunteers" onClick={() => handleClick('/admin/volunteers')}>
            <Button className={`${buttonClass} bg-pink-600 hover:bg-pink-700 text-white`} disabled={loadingPath === '/admin/volunteers'}>
              {loadingPath === '/admin/volunteers' ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  加载中... / Loading...
                </>
              ) : (
                '净土儿童佛学班义工义工管理 / Pure Land Children Buddhist Class Volunteer Management'
              )}
            </Button>
          </Link>
          <Link href="/admin/clapping-exercise-volunteers" onClick={() => handleClick('/admin/clapping-exercise-volunteers')}>
            <Button className={`${buttonClass} bg-orange-600 hover:bg-orange-700 text-white`} disabled={loadingPath === '/admin/clapping-exercise-volunteers'}>
              {loadingPath === '/admin/clapping-exercise-volunteers' ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  加载中... / Loading...
                </>
              ) : (
                '拍手念佛健身操义工管理 / Clapping Exercise Volunteer Management'
              )}
            </Button>
          </Link>
          <Link href="/admin/refuge-registrations" onClick={() => handleClick('/admin/refuge-registrations')}>
            <Button className={`${buttonClass} bg-amber-600 hover:bg-amber-700 text-white`} disabled={loadingPath === '/admin/refuge-registrations'}>
              {loadingPath === '/admin/refuge-registrations' ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  加载中... / Loading...
                </>
              ) : (
                '净土宗皈依报名管理 / Pure Land Taking Refuge Registration Management'
              )}
            </Button>
          </Link>
        </>
      )}
    </div>
  );
};

export default AdminActions;
