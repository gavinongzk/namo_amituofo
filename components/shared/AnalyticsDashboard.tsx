import React, { useEffect, useState } from 'react';
import { Bar, Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend, ChartOptions } from 'chart.js';
import { format, parseISO, subMonths, eachMonthOfInterval } from 'date-fns';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  ColumnDef,
  flexRender,
} from '@tanstack/react-table'
import { Card } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import UserAnalyticsVisuals from '@/components/shared/UserAnalyticsVisuals'

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

const userAttendanceOptions: ChartOptions<'line'> = {
  responsive: true,
  plugins: {
    legend: {
      position: 'top',
    },
    title: {
      display: true,
      text: 'Individual Attendance History',
    },
  },
  scales: {
    y: {
      beginAtZero: true,
    }
  },
};

const AnalyticsDashboard: React.FC = () => {
    const [attendees, setAttendees] = useState<Attendee[]>([]);
    const [frequentAttendees, setFrequentAttendees] = useState<FrequentAttendee[]>([]);
    const [popularEvents, setPopularEvents] = useState<PopularEvent[]>([]);
    const [attendanceTrend, setAttendanceTrend] = useState<number[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [nameFilter, setNameFilter] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const [selectedAttendee, setSelectedAttendee] = useState<Attendee | null>(null);

    const columns: ColumnDef<FrequentAttendee>[] = [
        {
            accessorKey: 'name',
            header: 'Name',
        },
        {
            accessorKey: 'phoneNumber',
            header: 'Phone Number',
        },
        {
            accessorKey: 'eventCount',
            header: 'Event Count',
        },
        {
            accessorKey: 'lastEventDate',
            header: 'Last Attended',
        },
        {
            id: 'actions',
            cell: ({ row }) => (
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                        const fullAttendee = attendees.find(a => 
                            a.name === row.original.name && 
                            a.phoneNumber === row.original.phoneNumber
                        );
                        setSelectedAttendee(fullAttendee || null);
                    }}
                >
                    View Details
                </Button>
            ),
        },
    ];

    const table = useReactTable({
        data: frequentAttendees,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        initialState: {
            pagination: {
                pageSize: itemsPerPage,
            },
        },
    });

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

    const filteredAttendees = frequentAttendees.filter(attendee =>
        attendee.name.toLowerCase().includes(nameFilter.toLowerCase())
    );

    const pageCount = Math.ceil(filteredAttendees.length / itemsPerPage);
    const paginatedAttendees = filteredAttendees.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const handlePageChange = (newPage: number) => {
        setCurrentPage(newPage);
    };

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
                borderColor: 'rgb(53, 162, 235)',
                backgroundColor: 'rgba(53, 162, 235, 0.5)',
                tension: 0.3,
                fill: true,
            }
        ]
    };

    const attendanceTrendOptions: ChartOptions<'line'> = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top',
            },
            title: {
                display: true,
                text: 'Monthly Attendance Trend',
                font: {
                    size: 16,
                    weight: 'bold',
                }
            },
        },
        scales: {
            y: {
                beginAtZero: true,
                title: {
                    display: true,
                    text: 'Number of Attendees',
                }
            },
            x: {
                title: {
                    display: true,
                    text: 'Month',
                }
            }
        },
    };

    const popularEventsData = {
        labels: popularEvents.map(event => event.eventTitle),
        datasets: [
            {
                label: 'Attendee Count',
                data: popularEvents.map(event => event.attendeeCount),
                backgroundColor: [
                    'rgba(255, 99, 132, 0.7)',
                    'rgba(54, 162, 235, 0.7)',
                    'rgba(255, 206, 86, 0.7)',
                    'rgba(75, 192, 192, 0.7)',
                    'rgba(153, 102, 255, 0.7)',
                ],
                borderColor: [
                    'rgba(255, 99, 132, 1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 206, 86, 1)',
                    'rgba(75, 192, 192, 1)',
                    'rgba(153, 102, 255, 1)',
                ],
                borderWidth: 1,
            }
        ]
    };

    const popularEventsOptions: ChartOptions<'bar'> = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top',
            },
            title: {
                display: true,
                text: 'Top 5 Popular Events',
                font: {
                    size: 16,
                    weight: 'bold',
                }
            },
        },
        scales: {
            y: {
                beginAtZero: true,
                title: {
                    display: true,
                    text: 'Number of Attendees',
                }
            },
            x: {
                title: {
                    display: true,
                    text: 'Event Title',
                }
            }
        },
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
        <div className="p-6 space-y-8">
            <h2 className="text-3xl font-bold mb-6">Analytics Dashboard</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h3 className="text-xl font-semibold mb-4">Attendance Trend</h3>
                    <Line data={attendanceTrendData} options={attendanceTrendOptions} />
                </div>

                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h3 className="text-xl font-semibold mb-4">Popular Events</h3>
                    <Bar data={popularEventsData} options={popularEventsOptions} />
                </div>
            </div>

            {selectedAttendee && (
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-semibold">User Analytics for {selectedAttendee.name}</h3>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedAttendee(null)}
                        >
                            Close
                        </Button>
                    </div>
                    <UserAnalyticsVisuals 
                        attendee={selectedAttendee} 
                        allEvents={attendees.flatMap(a => a.events)} 
                    />
                </div>
            )}

            <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-semibold mb-4">Frequent Attendees</h3>
                <div className="mb-4">
                    <Input
                        type="text"
                        placeholder="Filter by name"
                        value={nameFilter}
                        onChange={(e) => {
                            setNameFilter(e.target.value);
                            table.getColumn('name')?.setFilterValue(e.target.value);
                        }}
                        className="max-w-xs"
                    />
                </div>
                
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => (
                                    <TableHead key={header.id}>
                                        {flexRender(
                                            header.column.columnDef.header,
                                            header.getContext()
                                        )}
                                    </TableHead>
                                ))}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows.map((row) => (
                            <TableRow key={row.id}>
                                {row.getVisibleCells().map((cell) => (
                                    <TableCell key={cell.id}>
                                        {flexRender(
                                            cell.column.columnDef.cell,
                                            cell.getContext()
                                        )}
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>

                <div className="mt-4 flex items-center justify-between">
                    <div className="flex-1 text-sm text-muted-foreground">
                        {table.getFilteredRowModel().rows.length} attendee(s)
                    </div>
                    <div className="flex items-center space-x-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => table.previousPage()}
                            disabled={!table.getCanPreviousPage()}
                        >
                            Previous
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => table.nextPage()}
                            disabled={!table.getCanNextPage()}
                        >
                            Next
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AnalyticsDashboard;