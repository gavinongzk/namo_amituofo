'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Loader2, Users, Calendar, ClipboardCheck, ChartBar } from 'lucide-react';
import { useUser } from '@clerk/nextjs';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
    <div className="space-y-6">
      {/* KPIs Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总活动数</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Total Events</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总注册数</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Total Registrations</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">出席率</CardTitle>
            <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0%</div>
            <p className="text-xs text-muted-foreground">Attendance Rate</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">月增长率</CardTitle>
            <ChartBar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0%</div>
            <p className="text-xs text-muted-foreground">Monthly Growth</p>
          </CardContent>
        </Card>
      </div>

      {/* Admin Actions Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>活动管理 / Event Management</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
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
              <Link href="/events/create" onClick={() => handleClick('/events/create')}>
                <Button className={`${buttonClass} bg-green-600 hover:bg-green-700 text-white`} disabled={loadingPath === '/events/create'}>
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
            )}
          </CardContent>
        </Card>

        {isSuperAdmin && (
          <Card>
            <CardHeader>
              <CardTitle>系统管理 / System Management</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
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
            </CardContent>
          </Card>
        )}

        {isSuperAdmin && (
          <Card>
            <CardHeader>
              <CardTitle>数据分析 / Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <Link href="/admin/analytics" onClick={() => handleClick('/admin/analytics')}>
                <Button className={`${buttonClass} bg-purple-600 hover:bg-purple-700 text-white`} disabled={loadingPath === '/admin/analytics'}>
                  {loadingPath === '/admin/analytics' ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      加载中... / Loading...
                    </>
                  ) : (
                    '查看分析 / View Analytics'
                  )}
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AdminActions;
