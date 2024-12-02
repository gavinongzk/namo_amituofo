import React, { useEffect, useState } from 'react';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend, ChartOptions, ArcElement } from 'chart.js';
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
import { X } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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

interface FrequentAttendee {
    name: string;
    phoneNumber: string;
    eventCount: number;
    lastEventDate: string;
}

interface CategoryDistribution {
    categoryName: string;
    attendeeCount: number;
}

interface CategoryData {
    name: string;
}

interface RegionDistribution {
    region: string;
    attendeeCount: number;
}

interface TownDistribution {
    town: string;
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
    const [popularEvents, setPopularEvents] = useState<CategoryDistribution[]>([]);
    const [regionDistribution, setRegionDistribution] = useState<RegionDistribution[]>([]);
    const [townDistribution, setTownDistribution] = useState<TownDistribution[]>([]);
    const [attendanceTrend, setAttendanceTrend] = useState<number[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [nameFilter, setNameFilter] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const [selectedAttendee, setSelectedAttendee] = useState<Attendee | null>(null);
    const [categories, setCategories] = useState<Record<string, string>>({});
    const [selectedRegion, setSelectedRegion] = useState<string>('all');
    const [selectedTown, setSelectedTown] = useState<string>('all');
    const [locationFilteredAttendees, setLocationFilteredAttendees] = useState<Attendee[]>([]);

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
                        setTimeout(() => {
                            document.getElementById('attendee-details')?.scrollIntoView({ 
                                behavior: 'smooth',
                                block: 'start'
                            });
                        }, 100);
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

    const processFrequentAttendees = (attendees: Attendee[]) => {
        const sortedAttendees: FrequentAttendee[] = attendees
            .filter(attendee => attendee && attendee.name && attendee.phoneNumber && attendee.eventCount && attendee.lastEventDate)
            .sort((a, b) => b.eventCount - a.eventCount)
            .map(attendee => ({
                name: attendee.name,
                phoneNumber: attendee.phoneNumber,
                eventCount: attendee.eventCount,
                lastEventDate: attendee.lastEventDate ? format(parseISO(attendee.lastEventDate), 'dd MMM yyyy') : 'Unknown'
            }));

        setFrequentAttendees(sortedAttendees);
    };

    const processPopularEvents = (attendees: Attendee[]) => {
        const categoryCounts: Record<string, number> = {};

        attendees.forEach(attendee => {
            if (attendee.events && Array.isArray(attendee.events)) {
                const uniqueCategories = new Set(
                    attendee.events.map(event => event.category?.name || 'Uncategorized')
                );
                uniqueCategories.forEach(categoryName => {
                    categoryCounts[categoryName] = (categoryCounts[categoryName] || 0) + 1;
                });
            }
        });

        const sortedCategories: CategoryDistribution[] = Object.entries(categoryCounts)
            .map(([categoryName, attendeeCount]) => ({
                categoryName,
                attendeeCount
            }))
            .sort((a, b) => b.attendeeCount - a.attendeeCount)
            .slice(0, 5);

        setPopularEvents(sortedCategories);
    };

    const processRegionAndTownDistribution = (attendees: Attendee[]) => {
        const regionCounts: Record<string, number> = {};
        const townCounts: Record<string, number> = {};
        
        attendees.forEach(attendee => {
            const region = attendee.region === 'Unknown' ? '' : attendee.region;
            const town = attendee.town === 'Unknown' ? '' : attendee.town;
            
            if (region) {
                regionCounts[region] = (regionCounts[region] || 0) + 1;
            }
            if (town) {
                townCounts[town] = (townCounts[town] || 0) + 1;
            }
        });

        const sortedRegions: RegionDistribution[] = Object.entries(regionCounts)
            .map(([region, attendeeCount]) => ({
                region,
                attendeeCount
            }))
            .sort((a, b) => b.attendeeCount - a.attendeeCount);

        const sortedTowns: TownDistribution[] = Object.entries(townCounts)
            .map(([town, attendeeCount]) => ({
                town,
                attendeeCount
            }))
            .sort((a, b) => b.attendeeCount - a.attendeeCount)
            .slice(0, 10);

        setRegionDistribution(sortedRegions);
        setTownDistribution(sortedTowns);
    };

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
                processRegionAndTownDistribution(data.attendees);
            } catch (error) {
                console.error('Error fetching analytics data:', error);
                setError(error instanceof Error ? error.message : 'An unknown error occurred');
            } finally {
                setIsLoading(false);
            }
        };

        fetchAnalytics();
    }, []);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await fetch('/api/categories');
                const data = await response.json();
                const categoryMap = data.reduce((acc: Record<string, string>, cat: CategoryData) => {
                    acc[cat.name] = cat.name;
                    return acc;
                }, {});
                setCategories(categoryMap);
            } catch (error) {
                console.error('Error fetching categories:', error);
            }
        };

        fetchCategories();
    }, []);

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

    useEffect(() => {
        const filtered = attendees.filter(attendee => {
            const matchesRegion = selectedRegion === 'all' || attendee.region === selectedRegion;
            const matchesTown = selectedTown === 'all' || attendee.town === selectedTown;
            return matchesRegion && matchesTown;
        });
        setLocationFilteredAttendees(filtered);
    }, [attendees, selectedRegion, selectedTown]);

    const nameFilteredAttendees = frequentAttendees.filter(attendee =>
        attendee.name.toLowerCase().includes(nameFilter.toLowerCase())
    );

    const pageCount = Math.ceil(nameFilteredAttendees.length / itemsPerPage);
    const paginatedAttendees = nameFilteredAttendees.slice(
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

    const categoryDistributionData = {
        labels: popularEvents.map(cat => cat.categoryName),
        datasets: [
            {
                label: 'Attendee Count by Category',
                data: popularEvents.map(cat => cat.attendeeCount),
                backgroundColor: [
                    'rgba(54, 162, 235, 0.7)',  // Blue
                    'rgba(75, 192, 192, 0.7)',  // Teal
                    'rgba(255, 206, 86, 0.7)',  // Yellow
                ],
                borderColor: [
                    'rgba(54, 162, 235, 1)',
                    'rgba(75, 192, 192, 1)',
                    'rgba(255, 206, 86, 1)',
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
                    text: 'Category Name',
                }
            }
        },
    };

    const regionDistributionData = {
        labels: regionDistribution.map(region => region.region),
        datasets: [
            {
                label: 'Attendee Count by Region',
                data: regionDistribution.map(region => region.attendeeCount),
                backgroundColor: [
                    'rgba(255, 99, 132, 0.7)',   // Red
                    'rgba(54, 162, 235, 0.7)',   // Blue
                    'rgba(255, 206, 86, 0.7)',   // Yellow
                    'rgba(75, 192, 192, 0.7)',   // Teal
                    'rgba(153, 102, 255, 0.7)',  // Purple
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

    const townDistributionData = {
        labels: townDistribution.map(town => town.town),
        datasets: [
            {
                label: 'Attendee Count by Town',
                data: townDistribution.map(town => town.attendeeCount),
                backgroundColor: 'rgba(75, 192, 192, 0.7)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1,
            }
        ]
    };

    const regionDistributionOptions: ChartOptions<'doughnut'> = {
        responsive: true,
        plugins: {
            legend: {
                position: 'right',
            },
            title: {
                display: true,
                text: 'Attendee Distribution by Region',
                font: {
                    size: 16,
                    weight: 'bold',
                }
            },
        },
    };

    const townDistributionOptions: ChartOptions<'bar'> = {
        responsive: true,
        indexAxis: 'y' as const,
        plugins: {
            legend: {
                display: false,
            },
            title: {
                display: true,
                text: 'Top 10 Towns by Attendee Count',
                font: {
                    size: 16,
                    weight: 'bold',
                }
            },
        },
        scales: {
            x: {
                beginAtZero: true,
                title: {
                    display: true,
                    text: 'Number of Attendees'
                }
            },
            y: {
                title: {
                    display: true,
                    text: 'Town'
                }
            }
        }
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
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white p-6 rounded-lg shadow-md">
                <div className="space-y-2">
                    <label className="text-sm font-medium">Filter by Region</label>
                    <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select Region" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Regions</SelectItem>
                            {regionDistribution.map(({ region }) => (
                                <SelectItem key={region} value={region}>{region}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                
                <div className="space-y-2">
                    <label className="text-sm font-medium">Filter by Town</label>
                    <Select value={selectedTown} onValueChange={setSelectedTown}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select Town" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Towns</SelectItem>
                            {townDistribution.map(({ town }) => (
                                <SelectItem key={town} value={town}>{town}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="col-span-full mt-4">
                    <h3 className="text-lg font-semibold mb-2">
                        Filtered Attendees ({locationFilteredAttendees.length} total)
                    </h3>
                    <div className="bg-gray-50 p-4 rounded-md max-h-60 overflow-y-auto">
                        <table className="w-full">
                            <thead className="text-sm text-gray-600">
                                <tr>
                                    <th className="text-left py-2">Name</th>
                                    <th className="text-left py-2">Region</th>
                                    <th className="text-left py-2">Town</th>
                                    <th className="text-left py-2">Event Count</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {locationFilteredAttendees.map((attendee, index) => (
                                    <tr key={`${attendee.name}-${attendee.phoneNumber}-${index}`} 
                                        className="border-t border-gray-200">
                                        <td className="py-2">{attendee.name}</td>
                                        <td className="py-2">{attendee.region === 'Unknown' ? '' : attendee.region}</td>
                                        <td className="py-2">{attendee.town === 'Unknown' ? '' : attendee.town}</td>
                                        <td className="py-2">{attendee.eventCount}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h3 className="text-xl font-semibold mb-4">Attendance Trend</h3>
                    <Line data={attendanceTrendData} options={attendanceTrendOptions} />
                </div>

                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h3 className="text-xl font-semibold mb-4">Popular Events</h3>
                    <Bar data={categoryDistributionData} options={popularEventsOptions} />
                </div>

                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h3 className="text-xl font-semibold mb-4">Region Distribution</h3>
                    <Doughnut data={regionDistributionData} options={regionDistributionOptions} />
                </div>

                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h3 className="text-xl font-semibold mb-4">Town Distribution</h3>
                    <Bar data={townDistributionData} options={townDistributionOptions} />
                </div>
            </div>

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

            {selectedAttendee && (
                <div id="attendee-details" className="bg-white p-6 rounded-lg shadow-md">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-semibold">
                            Individual Analytics: {selectedAttendee.name}
                        </h3>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedAttendee(null)}
                            className="h-8 px-2 rounded-full"
                        >
                            <X className="h-4 w-4 mr-1" />
                            Close
                        </Button>
                    </div>
                    
                    <UserAnalyticsVisuals 
                        attendee={selectedAttendee} 
                        allEvents={attendees.flatMap(a => a.events)} 
                    />
                </div>
            )}
        </div>
    );
};

export default AnalyticsDashboard;