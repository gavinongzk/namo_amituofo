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
  // Prepare data for charts
  const monthlyData = attendee.events.reduce((acc, event) => {
    const month = format(parseISO(event.eventDate), 'MMM yyyy');
    acc[month] = (acc[month] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const categoryData = attendee.events.reduce((acc, event) => {
    const category = event.category.name;
    acc[category] = (acc[category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const yearlyComparison = (() => {
    const currentYear = new Date().getFullYear();
    const lastYear = currentYear - 1;
    
    const currentYearEvents = attendee.events.filter(event => 
      new Date(event.eventDate).getFullYear() === currentYear
    ).length;
    
    const lastYearEvents = attendee.events.filter(event => 
      new Date(event.eventDate).getFullYear() === lastYear
    ).length;

    return [
      { year: lastYear.toString(), events: lastYearEvents },
      { year: currentYear.toString(), events: currentYearEvents }
    ];
  })();

  const monthlyChartData = Object.entries(monthlyData).map(([month, count]) => ({
    month,
    events: count
  }));

  const categoryChartData = Object.entries(categoryData).map(([category, count]) => ({
    name: category,
    value: count,
    fill: getCategoryColor(category)
  }));

  return (
    <div className="space-y-6">
      {/* User Info */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">User Information</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-600">Name</p>
            <p className="font-medium">{attendee.name}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Phone</p>
            <p className="font-medium">{attendee.phoneNumber}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Region</p>
            <p className="font-medium">{attendee.region || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Total Events</p>
            <p className="font-medium">{attendee.eventCount}</p>
          </div>
        </div>
      </Card>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Activity */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Monthly Activity</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="events" stroke="#8884d8" fill="#8884d8" fillOpacity={0.3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Category Distribution */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Event Categories</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Yearly Comparison */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Yearly Comparison</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={yearlyComparison}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="events" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Recent Events */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Recent Events</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {attendee.events
              .sort((a, b) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime())
              .slice(0, 10)
              .map((event, index) => (
                <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <div>
                    <p className="font-medium text-sm">{event.eventTitle}</p>
                    <p className="text-xs text-gray-600">{format(parseISO(event.eventDate), 'MMM dd, yyyy')}</p>
                  </div>
                  <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">
                    {event.category.name}
                  </span>
                </div>
              ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default UserAnalyticsVisuals; 