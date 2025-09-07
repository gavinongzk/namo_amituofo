import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend, ChartOptions, ArcElement } from 'chart.js';
import { format, parseISO, subMonths, eachMonthOfInterval, differenceInDays, isSameMonth, isSameYear } from 'date-fns';
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
import { X } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import FloatingActionButtons from './FloatingActionButtons';

// Dynamically import heavy chart components
const Bar = dynamic(() => import('react-chartjs-2').then(mod => ({ default: mod.Bar })), {
  loading: () => <div className="h-64 bg-gray-100 animate-pulse rounded-lg" />,
  ssr: false
});

const Line = dynamic(() => import('react-chartjs-2').then(mod => ({ default: mod.Line })), {
  loading: () => <div className="h-64 bg-gray-100 animate-pulse rounded-lg" />,
  ssr: false
});

const Doughnut = dynamic(() => import('react-chartjs-2').then(mod => ({ default: mod.Doughnut })), {
  loading: () => <div className="h-64 bg-gray-100 animate-pulse rounded-lg" />,
  ssr: false
});

// Dynamically import UserAnalyticsVisuals
const UserAnalyticsVisuals = dynamic(() => import('@/components/shared/UserAnalyticsVisuals'), {
  loading: () => <div className="h-96 bg-gray-100 animate-pulse rounded-lg" />,
  ssr: false
});

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend, ArcElement);

interface Attendee {
    name: string;
    phoneNumber: string;
    postalCode: string;
    region: string;
    town: string;
    eventCount: number;
    events: {
        eventDate: string;
        eventTitle: string;
        category: {
            name: string;
        };
    }[];
    lastEventDate: string;
    eventDate: string;
    eventTitle: string;
}

interface AnalyticsDashboardProps {
    attendees: Attendee[];
}

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ attendees }) => {
    const [filteredAttendees, setFilteredAttendees] = useState<Attendee[]>(attendees);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedRegion, setSelectedRegion] = useState<string>('all');
    const [selectedAttendee, setSelectedAttendee] = useState<Attendee | null>(null);
    const [showUserAnalytics, setShowUserAnalytics] = useState(false);

    // Get unique regions
    const regions = ['all', ...Array.from(new Set(attendees.map(a => a.region).filter(Boolean)))];

    // Filter attendees based on search term and region
    useEffect(() => {
        let filtered = attendees;

        if (searchTerm) {
            filtered = filtered.filter(attendee =>
                attendee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                attendee.phoneNumber.includes(searchTerm)
            );
        }

        if (selectedRegion !== 'all') {
            filtered = filtered.filter(attendee => attendee.region === selectedRegion);
        }

        setFilteredAttendees(filtered);
    }, [attendees, searchTerm, selectedRegion]);

    // Handle empty data state
    if (!attendees || attendees.length === 0) {
        return (
            <div className="text-center py-12">
                <div className="mx-auto h-24 w-24 text-gray-400 mb-4">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Analytics Data Available</h3>
                <p className="text-gray-500 mb-4">
                    There are no attendee registrations to display analytics for yet.
                </p>
                <p className="text-sm text-gray-400">
                    Analytics will appear once events are created and people start registering.
                </p>
            </div>
        );
    }

    // Prepare data for charts
    const regionData = attendees.reduce((acc, attendee) => {
        const region = attendee.region || 'Unknown';
        acc[region] = (acc[region] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const eventCountData = attendees.reduce((acc, attendee) => {
        const count = attendee.eventCount;
        acc[count] = (acc[count] || 0) + 1;
        return acc;
    }, {} as Record<number, number>);

    // Monthly registration data
    const monthlyData = attendees.reduce((acc, attendee) => {
        attendee.events.forEach(event => {
            const month = format(parseISO(event.eventDate), 'yyyy-MM');
            acc[month] = (acc[month] || 0) + 1;
        });
        return acc;
    }, {} as Record<string, number>);

    const chartOptions = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top' as const,
            },
        },
    };

    const columns: ColumnDef<Attendee>[] = [
        {
            accessorKey: 'name',
            header: 'Name',
        },
        {
            accessorKey: 'phoneNumber',
            header: 'Phone Number',
        },
        {
            accessorKey: 'region',
            header: 'Region',
        },
        {
            accessorKey: 'eventCount',
            header: 'Events Attended',
        },
        {
            accessorKey: 'lastEventDate',
            header: 'Last Event',
            cell: ({ row }) => {
                const date = row.getValue('lastEventDate') as string;
                return date ? format(parseISO(date), 'MMM dd, yyyy') : 'N/A';
            },
        },
        {
            id: 'actions',
            header: 'Actions',
            cell: ({ row }) => (
                <Button
                    onClick={() => {
                        setSelectedAttendee(row.original);
                        setShowUserAnalytics(true);
                    }}
                    size="sm"
                >
                    View Details
                </Button>
            ),
        },
    ];

    const table = useReactTable({
        data: filteredAttendees,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
    });

    return (
        <div className="space-y-6">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                <Input
                    placeholder="Search by name or phone number..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="max-w-sm"
                />
                <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select region" />
                    </SelectTrigger>
                    <SelectContent>
                        {regions.map(region => (
                            <SelectItem key={region} value={region}>
                                {region === 'all' ? 'All Regions' : region}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Summary Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <Card className="p-4">
                    <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{attendees.length}</div>
                        <div className="text-sm text-gray-600">Total Attendees</div>
                    </div>
                </Card>
                <Card className="p-4">
                    <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                            {attendees.reduce((sum, attendee) => sum + attendee.eventCount, 0)}
                        </div>
                        <div className="text-sm text-gray-600">Total Registrations</div>
                    </div>
                </Card>
                <Card className="p-4">
                    <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">
                            {regions.length - 1}
                        </div>
                        <div className="text-sm text-gray-600">Regions</div>
                    </div>
                </Card>
                <Card className="p-4">
                    <div className="text-center">
                        <div className="text-2xl font-bold text-orange-600">
                            {Math.round(attendees.reduce((sum, attendee) => sum + attendee.eventCount, 0) / attendees.length * 10) / 10}
                        </div>
                        <div className="text-sm text-gray-600">Avg Events/Person</div>
                    </div>
                </Card>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Attendees by Region</h3>
                    <div className="h-64">
                        <Doughnut
                            data={{
                                labels: Object.keys(regionData),
                                datasets: [{
                                    data: Object.values(regionData),
                                    backgroundColor: [
                                        '#FF6384',
                                        '#36A2EB',
                                        '#FFCE56',
                                        '#4BC0C0',
                                        '#9966FF',
                                        '#FF9F40'
                                    ],
                                }],
                            }}
                            options={chartOptions}
                        />
                    </div>
                </Card>

                <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Event Count Distribution</h3>
                    <div className="h-64">
                        <Bar
                            data={{
                                labels: Object.keys(eventCountData).map(count => `${count} events`),
                                datasets: [{
                                    label: 'Number of Attendees',
                                    data: Object.values(eventCountData),
                                    backgroundColor: '#36A2EB',
                                }],
                            }}
                            options={chartOptions}
                        />
                    </div>
                </Card>

                <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Monthly Registrations</h3>
                    <div className="h-64">
                        <Line
                            data={{
                                labels: Object.keys(monthlyData).sort(),
                                datasets: [{
                                    label: 'Registrations',
                                    data: Object.keys(monthlyData).sort().map(month => monthlyData[month]),
                                    borderColor: '#4BC0C0',
                                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                                }],
                            }}
                            options={chartOptions}
                        />
                    </div>
                </Card>
            </div>

            {/* Table */}
            <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Attendee Details</h3>
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            {table.getHeaderGroups().map((headerGroup) => (
                                <TableRow key={headerGroup.id}>
                                    {headerGroup.headers.map((header) => (
                                        <TableHead key={header.id}>
                                            {header.isPlaceholder
                                                ? null
                                                : flexRender(
                                                    header.column.columnDef.header,
                                                    header.getContext()
                                                )}
                                        </TableHead>
                                    ))}
                                </TableRow>
                            ))}
                        </TableHeader>
                        <TableBody>
                            {table.getRowModel().rows?.length ? (
                                table.getRowModel().rows.map((row) => (
                                    <TableRow
                                        key={row.id}
                                        data-state={row.getIsSelected() && "selected"}
                                    >
                                        {row.getVisibleCells().map((cell) => (
                                            <TableCell key={cell.id}>
                                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={columns.length} className="h-24 text-center">
                                        No results.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
                <div className="flex items-center justify-end space-x-2 py-4">
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
            </Card>

            {/* User Analytics Modal */}
            {showUserAnalytics && selectedAttendee && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold">User Analytics: {selectedAttendee.name}</h2>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowUserAnalytics(false)}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                        <UserAnalyticsVisuals
                            attendee={selectedAttendee}
                            allEvents={attendees.flatMap(a => a.events)}
                        />
                    </div>
                </div>
            )}

            <FloatingActionButtons />
        </div>
    );
};

export default AnalyticsDashboard;