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
import { getCategoryColor } from '@/lib/utils/colorUtils';

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
    .sort((a, b) => {
      const [monthA, yearA] = a.month.split(' ');
      const [monthB, yearB] = b.month.split(' ');
      const dateA = new Date(`${monthA} 1, ${yearA}`);
      const dateB = new Date(`${monthB} 1, ${yearB}`);
      return dateA.getTime() - dateB.getTime();
    });

  // Calculate category distribution
  const categoryDistribution = registrations.reduce((acc, reg) => {
    if (!reg.event.startDateTime) return acc;
    const category = reg.event.category?.name || 'Uncategorized';
    acc[category] = (acc[category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Generate colors for categories dynamically
  const categoryColors = Object.keys(categoryDistribution).map(categoryName => {
    const fullColor = getCategoryColor(categoryName, undefined);
    // Extract hex color from Tailwind class (simplified approach)
    const colorMap: { [key: string]: string } = {
      'bg-blue-200': '#93c5fd',
      'bg-orange-200': '#fed7aa',
      'bg-green-200': '#bbf7d0',
      'bg-purple-200': '#c4b5fd',
      'bg-pink-200': '#fbcfe8',
      'bg-indigo-200': '#c7d2fe',
      'bg-teal-200': '#99f6e4',
      'bg-red-200': '#fecaca',
      'bg-yellow-200': '#fef3c7',
      'bg-cyan-200': '#a5f3fc',
      'bg-lime-200': '#d9f99d',
      'bg-emerald-200': '#a7f3d0',
      'bg-violet-200': '#ddd6fe',
      'bg-rose-200': '#fecdd3',
      'bg-amber-200': '#fde68a',
      'bg-sky-200': '#bae6fd',
      'bg-fuchsia-200': '#e9d5ff',
      'bg-slate-200': '#e2e8f0',
      'bg-gray-200': '#e5e7eb',
      'bg-zinc-200': '#e4e4e7',
    };
    
    // Extract background class and convert to hex
    const bgMatch = fullColor.match(/bg-(\w+)-200/);
    if (bgMatch && colorMap[fullColor]) {
      return colorMap[fullColor];
    }
    return '#93c5fd'; // Default blue
  });

  // Custom label renderer for pie chart
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, value, index }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor="middle" 
        dominantBaseline="central"
        className="text-xs md:text-sm font-medium"
      >
        {value}
      </text>
    );
  };

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
                  label={renderCustomizedLabel}
                  labelLine={false}
                >
                  {Object.entries(categoryDistribution).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={categoryColors[index]} />
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