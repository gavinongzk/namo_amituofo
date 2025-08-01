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
  BarChart,
  Bar,
  Legend
} from 'recharts';
import { format, parseISO, startOfYear, addMonths } from 'date-fns';
import { Card } from '@/components/ui/card';
import { getCategoryColor } from '@/lib/utils/colorUtils';

interface UserAnalyticsVisualsProps {
  attendee: {
    name: string;
    phoneNumber: string;
    eventCount: number;
    region: string;
    town: string;
    events: {
      eventDate: string;
      eventTitle: string;
      category: {
        name: string;
      };
    }[];
    lastEventDate: string;
  };
  allEvents: {
    eventDate: string;
    eventTitle: string;
    category: {
      name: string;
    };
  }[];
}

const UserAnalyticsVisuals: React.FC<UserAnalyticsVisualsProps> = ({ attendee, allEvents }) => {
  // Sort events chronologically
  const sortedEvents = [...attendee.events].sort((a, b) => 
    parseISO(a.eventDate).getTime() - parseISO(b.eventDate).getTime()
  );

  const firstEvent = sortedEvents[0];
  const lastEvent = sortedEvents[sortedEvents.length - 1];

  // Process data for visualizations
  const monthlyAttendance = attendee.events.reduce((acc, event) => {
    const month = format(parseISO(event.eventDate), 'MMM yyyy');
    acc[month] = (acc[month] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const attendanceData = Object.entries(monthlyAttendance).map(([month, count]) => ({
    month,
    count,
  }));

  // Updated category distribution calculation
  const eventCategoryData = attendee.events.reduce((acc, event) => {
    const category = event.category.name;
    acc[category] = (acc[category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Generate colors for categories dynamically
  const categoryColors = Object.keys(eventCategoryData).map(categoryName => {
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

  // Group events by category and sort by date
  const eventsByCategory = attendee.events.reduce((acc, event) => {
    const category = event.category.name;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(event);
    return acc;
  }, {} as Record<string, typeof attendee.events>);

  // Sort events within each category by date (newest first)
  Object.keys(eventsByCategory).forEach(category => {
    eventsByCategory[category].sort((a, b) => 
      new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime()
    );
  });

  // Sort categories by their most recent event date
  const sortedCategories = Object.entries(eventsByCategory).sort(([, eventsA], [, eventsB]) => {
    const latestA = new Date(eventsA[0].eventDate).getTime();
    const latestB = new Date(eventsB[0].eventDate).getTime();
    return latestB - latestA;
  });

  return (
    <div className="space-y-8">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="p-4">
          <h5 className="text-sm font-medium text-gray-500">Total Events</h5>
          <p className="mt-1 text-2xl font-semibold">{attendee.eventCount}</p>
        </Card>
        <Card className="p-4">
          <h5 className="text-sm font-medium text-gray-500">First Event</h5>
          <p className="mt-1 text-sm font-medium">
            {firstEvent ? format(parseISO(firstEvent.eventDate), 'MMM d, yyyy') : 'N/A'}
          </p>
        </Card>
        <Card className="p-4">
          <h5 className="text-sm font-medium text-gray-500">Last Event</h5>
          <p className="mt-1 text-sm font-medium">
            {lastEvent ? format(parseISO(lastEvent.eventDate), 'MMM d, yyyy') : 'N/A'}
          </p>
        </Card>
        <Card className="p-4">
          <h5 className="text-sm font-medium text-gray-500">Region</h5>
          <p className="mt-1 text-sm font-medium">
            {attendee.region === 'Unknown' ? 'Not specified' : attendee.region}
          </p>
        </Card>
        <Card className="p-4">
          <h5 className="text-sm font-medium text-gray-500">Town</h5>
          <p className="mt-1 text-sm font-medium">
            {attendee.town === 'Unknown' ? 'Not specified' : attendee.town}
          </p>
        </Card>
      </div>

      {/* Attendance Timeline */}
      <Card className="p-6">
        <h4 className="text-lg font-semibold mb-4">Attendance Timeline</h4>
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Event Category Distribution */}
        <Card className="p-6">
          <h4 className="text-lg font-semibold mb-4">Event Category Distribution</h4>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={Object.entries(eventCategoryData).map(([name, value]) => ({ name, value }))}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {Object.entries(eventCategoryData).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={categoryColors[index]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Updated Event History with sorting */}
        <Card className="p-6">
          <h4 className="text-lg font-semibold mb-4">Event History</h4>
          <div className="max-h-[300px] overflow-y-auto">
            {sortedCategories.map(([category, events]) => (
              <div key={category} className="mb-4">
                <h5 className="font-medium text-base mb-2">{category} ({events.length})</h5>
                <ul className="space-y-2 pl-4">
                  {events.map((event, idx) => (
                    <li key={idx} className="text-sm border-b pb-2">
                      <span className="font-medium">
                        {format(parseISO(event.eventDate), 'MMM dd, yyyy')}
                      </span>
                      {' - '}
                      <span className="text-gray-600">{event.eventTitle}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default UserAnalyticsVisuals; 