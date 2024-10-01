import React, { useEffect, useState } from 'react';
import { Bar, Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { format, parseISO, startOfMonth, endOfMonth, eachMonthOfInterval } from 'date-fns';

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend);

interface Attendee {
  name: string;
  phoneNumber: string;
  eventCount: number;
  lastEventDate: string;
  eventDate: string; // Add this
  eventTitle: string; // Add this
}

interface EventPopularity {
  eventTitle: string;
  attendeeCount: number;
}

const AnalyticsDashboard: React.FC = () => {
  const [attendanceTrend, setAttendanceTrend] = useState<number[]>([]);
  const [labels, setLabels] = useState<string[]>([]);
  const [frequentAttendees, setFrequentAttendees] = useState<Attendee[]>([]);
  const [popularEvents, setPopularEvents] = useState<EventPopularity[]>([]);

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    try {
      const response = await fetch('/api/analytics');
      const data = await response.json();
      processAttendanceTrend(data.attendees);
      processFrequentAttendees(data.attendees);
      processPopularEvents(data.attendees);
    } catch (error) {
      console.error('Error fetching analytics data:', error);
    }
  };

  const processAttendanceTrend = (attendees: Attendee[]) => {
    const sortedAttendees = attendees.sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime());
    const startDate = parseISO(sortedAttendees[0].eventDate);
    const endDate = parseISO(sortedAttendees[sortedAttendees.length - 1].eventDate);
    
    const months = eachMonthOfInterval({ start: startDate, end: endDate });
    const attendanceCounts = months.map(month => {
      return attendees.filter(attendee => {
        const attendeeDate = parseISO(attendee.eventDate);
        return attendeeDate >= startOfMonth(month) && attendeeDate <= endOfMonth(month);
      }).length;
    });

    setLabels(months.map(month => format(month, 'MMM yyyy')));
    setAttendanceTrend(attendanceCounts);
  };

  const processFrequentAttendees = (attendees: Attendee[]) => {
    const attendeeCounts = attendees.reduce((acc, attendee) => {
      acc[attendee.phoneNumber] = (acc[attendee.phoneNumber] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const sortedAttendees = Object.entries(attendeeCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([phoneNumber]) => {
        const attendeeEvents = attendees.filter(a => a.phoneNumber === phoneNumber);
        return {
          name: attendeeEvents[0].name,
          phoneNumber,
          eventCount: attendeeEvents.length,
          lastEventDate: format(parseISO(attendeeEvents[attendeeEvents.length - 1].eventDate), 'dd MMM yyyy')
        };
      });

    setFrequentAttendees(sortedAttendees.map(attendee => ({
      ...attendee,
      eventDate: attendee.lastEventDate, // Use lastEventDate or provide a default
      eventTitle: 'N/A' // Provide a default or fetch the actual title if available
    })));
  };

  const processPopularEvents = (attendees: Attendee[]) => {
    const eventCounts = attendees.reduce((acc, attendee) => {
      acc[attendee.eventTitle] = (acc[attendee.eventTitle] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const sortedEvents = Object.entries(eventCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([eventTitle, attendeeCount]) => ({ eventTitle, attendeeCount }));

    setPopularEvents(sortedEvents);
  };

  const attendanceTrendData = {
    labels,
    datasets: [
      {
        label: 'Attendance Trend',
        data: attendanceTrend,
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1
      }
    ]
  };

  const popularEventsData = {
    labels: popularEvents.map(event => event.eventTitle),
    datasets: [
      {
        label: 'Attendee Count',
        data: popularEvents.map(event => event.attendeeCount),
        backgroundColor: 'rgba(75, 192, 192, 0.6)'
      }
    ]
  };

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold mb-4">Analytics Dashboard</h2>
      
      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-2">Attendance Trend</h3>
        <Line data={attendanceTrendData} />
      </div>

      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-2">Popular Events</h3>
        <Bar data={popularEventsData} />
      </div>

      <div>
        <h3 className="text-xl font-semibold mb-2">Frequent Attendees</h3>
        <table className="min-w-full bg-white">
          <thead>
            <tr>
              <th className="py-2 px-4 border-b">Name</th>
              <th className="py-2 px-4 border-b">Phone Number</th>
              <th className="py-2 px-4 border-b">Event Count</th>
              <th className="py-2 px-4 border-b">Last Attended</th>
            </tr>
          </thead>
          <tbody>
            {frequentAttendees.map((attendee, index) => (
              <tr key={index}>
                <td className="py-2 px-4 border-b">{attendee.name}</td>
                <td className="py-2 px-4 border-b">{attendee.phoneNumber}</td>
                <td className="py-2 px-4 border-b">{attendee.eventCount}</td>
                <td className="py-2 px-4 border-b">{attendee.lastEventDate}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
