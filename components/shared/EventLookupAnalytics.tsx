import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { format } from 'date-fns';
import { Card } from '@/components/ui/card';
import { IRegistration } from '@/types';

interface EventLookupAnalyticsProps {
  registrations: IRegistration[];
}

const EventLookupAnalytics: React.FC<EventLookupAnalyticsProps> = ({ registrations }) => {
  // Sort events chronologically
  const sortedRegistrations = [...registrations].sort((a, b) => {
    const dateA = a.event.startDateTime ? new Date(String(a.event.startDateTime)).getTime() : 0;
    const dateB = b.event.startDateTime ? new Date(String(b.event.startDateTime)).getTime() : 0;
    return dateB - dateA;
  });

  // Process data for monthly attendance
  const monthlyAttendance = registrations.reduce((acc, reg) => {
    if (!reg.event.startDateTime) return acc;
    const month = format(new Date(String(reg.event.startDateTime)), 'MMM yyyy');
    acc[month] = (acc[month] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const attendanceData = Object.entries(monthlyAttendance)
    .map(([month, count]) => ({
      month,
      count,
    }))
    .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());

  // Calculate category distribution
  const categoryDistribution = registrations.reduce((acc, reg) => {
    if (!reg.event.startDateTime) return acc;
    const category = reg.event.category?.name || 'Uncategorized';
    acc[category] = (acc[category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

  return (
    <div className="space-y-8">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <h5 className="text-sm font-medium text-gray-500">总活动数量 Total Events</h5>
          <p className="mt-1 text-2xl font-semibold">{registrations.length}</p>
        </Card>
        <Card className="p-4">
          <h5 className="text-sm font-medium text-gray-500">首次参与 First Event</h5>
          <p className="mt-1 text-sm font-medium">
            {sortedRegistrations.length > 0 && sortedRegistrations[sortedRegistrations.length - 1].event.startDateTime
              ? format(new Date(String(sortedRegistrations[sortedRegistrations.length - 1].event.startDateTime)), 'MMM d, yyyy')
              : 'N/A'}
          </p>
        </Card>
        <Card className="p-4">
          <h5 className="text-sm font-medium text-gray-500">最近参与 Latest Event</h5>
          <p className="mt-1 text-sm font-medium">
            {sortedRegistrations.length > 0 && sortedRegistrations[0].event.startDateTime
              ? format(new Date(String(sortedRegistrations[0].event.startDateTime)), 'MMM d, yyyy')
              : 'N/A'}
          </p>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Monthly Attendance Chart */}
        <Card className="p-6">
          <h4 className="text-lg font-semibold mb-4">月度参与统计 Monthly Attendance</h4>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={attendanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Area 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#8884d8" 
                  fill="#8884d8" 
                  fillOpacity={0.3} 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Category Distribution Chart */}
        <Card className="p-6">
          <h4 className="text-lg font-semibold mb-4">类别分布 Category Distribution</h4>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={Object.entries(categoryDistribution).map(([name, value]) => ({ name, value }))}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {Object.entries(categoryDistribution).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default EventLookupAnalytics; 