import React, { useEffect, useState } from 'react';
import { Bar, Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { format, parseISO, subMonths, eachMonthOfInterval } from 'date-fns';

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend);

interface AttendeeEvent {
    eventDate: string;
    eventTitle: string;
}

interface AttendeeData {
    name: string;
    phoneNumber: string;
    eventCount: number;
    events: AttendeeEvent[];
}

interface Attendee extends AttendeeData {
    lastEventDate: string;
}

interface FrequentAttendee {
    name: string;
    phoneNumber: string;
    eventCount: number;
    lastEventDate: string;
}

interface PopularEvent {
    eventTitle: string;
    attendeeCount: number;
}

const AnalyticsDashboard: React.FC = () => {
    const [attendees, setAttendees] = useState<Attendee[]>([]);
    const [frequentAttendees, setFrequentAttendees] = useState<FrequentAttendee[]>([]);
    const [popularEvents, setPopularEvents] = useState<PopularEvent[]>([]);
    const [attendanceTrend, setAttendanceTrend] = useState<number[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                setIsLoading(true);
                setError(null);
                console.log('Fetching analytics data...');
                const response = await fetch('/api/analytics');
                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`Failed to fetch analytics data: ${response.status} ${response.statusText}. ${errorText}`);
                }
                const data = await response.json();
                console.log('Received analytics data:', JSON.stringify(data, null, 2));
                if (!data.attendees || !Array.isArray(data.attendees)) {
                    throw new Error('Invalid data structure received from API');
                }
                setAttendees(data.attendees);
                processFrequentAttendees(data.attendees);
                processPopularEvents(data.attendees);
            } catch (error) {
                console.error('Error fetching analytics data:', error);
                setError(error instanceof Error ? error.message : 'An unknown error occurred');
            } finally {
                setIsLoading(false);
            }
        };

        fetchAnalytics();
    }, []);

    const processFrequentAttendees = (attendees: Attendee[]) => {
        const sortedAttendees: FrequentAttendee[] = attendees
            .filter(attendee => attendee && attendee.name && attendee.phoneNumber && attendee.eventCount && attendee.lastEventDate)
            .sort((a, b) => b.eventCount - a.eventCount)
            .slice(0, 10)
            .map(attendee => ({
                name: attendee.name,
                phoneNumber: attendee.phoneNumber,
                eventCount: attendee.eventCount,
                lastEventDate: attendee.lastEventDate ? format(parseISO(attendee.lastEventDate), 'dd MMM yyyy') : 'Unknown'
            }));

        setFrequentAttendees(sortedAttendees);
    };

    const processPopularEvents = (attendees: Attendee[]) => {
        const eventCounts: Record<string, number> = attendees.reduce((acc, attendee) => {
            if (attendee.events && Array.isArray(attendee.events)) {
                attendee.events.forEach(event => {
                    if (event.eventTitle) {
                        acc[event.eventTitle] = (acc[event.eventTitle] || 0) + 1;
                    }
                });
            }
            return acc;
        }, {} as Record<string, number>);

        const sortedEvents: PopularEvent[] = Object.entries(eventCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([eventTitle, attendeeCount]) => ({ eventTitle, attendeeCount }));

        setPopularEvents(sortedEvents);
    };

    const calculateAttendanceTrend = (attendees: Attendee[]) => {
        const now = new Date();
        const sixMonthsAgo = subMonths(now, 5);
        const months = eachMonthOfInterval({ start: sixMonthsAgo, end: now });

        const trend = months.map(month => {
            return attendees.reduce((count, attendee) => {
                return count + attendee.events.filter(event => 
                    parseISO(event.eventDate).getMonth() === month.getMonth() &&
                    parseISO(event.eventDate).getFullYear() === month.getFullYear()
                ).length;
            }, 0);
        });

        setAttendanceTrend(trend);
    };

    useEffect(() => {
        if (attendees.length > 0) {
            calculateAttendanceTrend(attendees);
        }
    }, [attendees]);

    const labels = eachMonthOfInterval({
        start: subMonths(new Date(), 5),
        end: new Date()
    }).map(date => format(date, 'MMM yyyy'));

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

    if (isLoading) {
        return <div className="p-6">Loading analytics data...</div>;
    }

    if (error) {
        return (
            <div className="p-6">
                <h2 className="text-2xl font-bold mb-4">Error Loading Analytics</h2>
                <p className="text-red-500">{error}</p>
                <p>Please try refreshing the page or contact support if the problem persists.</p>
            </div>
        );
    }

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
