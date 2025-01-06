import React, { useEffect, useState } from 'react';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend, ChartOptions, ArcElement } from 'chart.js';
import { format, parseISO, subMonths, eachMonthOfInterval, differenceInDays, isSameMonth, isSameYear, startOfMonth, endOfMonth, addMonths } from 'date-fns';
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

interface CohortData {
    cohortMonth: string;
    originalSize: number;
    retentionData: {
        month: string;
        count: number;
        percentage: number;
    }[];
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
    const [searchFilter, setSearchFilter] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const [selectedAttendee, setSelectedAttendee] = useState<Attendee | null>(null);
    const [categories, setCategories] = useState<Record<string, string>>({});
    const [selectedRegion, setSelectedRegion] = useState<string>('all');
    const [selectedTown, setSelectedTown] = useState<string>('all');
    const [locationFilteredAttendees, setLocationFilteredAttendees] = useState<Attendee[]>([]);
    const [dateRange, setDateRange] = useState<{ start: Date; end: Date }>({
        start: subMonths(new Date(), 6),
        end: new Date()
    });
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [predictedAttendance, setPredictedAttendance] = useState<number[]>([]);
    const [cohortAnalytics, setCohortAnalytics] = useState<CohortData[]>([]);

    const columns: ColumnDef<FrequentAttendee>[] = [
        {
            accessorKey: 'name',
            header: '姓名 Name',
            filterFn: (row, id, value) => {
                const name = row.getValue(id) as string;
                const phone = row.getValue('phoneNumber') as string;
                const searchTerm = value.toLowerCase();
                return name.toLowerCase().includes(searchTerm) || 
                       phone.toLowerCase().includes(searchTerm);
            },
        },
        {
            accessorKey: 'phoneNumber',
            header: '电话 Phone Number',
            filterFn: (row, id, value) => {
                return (row.getValue(id) as string).toLowerCase().includes(value.toLowerCase())
            },
        },
        {
            accessorKey: 'eventCount',
            header: '参与次数 Event Count',
        },
        {
            accessorKey: 'lastEventDate',
            header: '最近参与 Last Attended',
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
        const attendeeCounts: Record<string, { count: number; lastDate: string; phoneNumber: string }> = {};
        
        attendees.forEach((a: Attendee) => {
            const key = `${a.name}-${a.phoneNumber}`;
            if (!attendeeCounts[key]) {
                attendeeCounts[key] = {
                    count: 0,
                    lastDate: '',
                    phoneNumber: a.phoneNumber
                };
            }
            attendeeCounts[key].count += 1;
            if (!attendeeCounts[key].lastDate || new Date(a.eventDate) > new Date(attendeeCounts[key].lastDate)) {
                attendeeCounts[key].lastDate = a.eventDate;
            }
        });

        const frequentAttendeesList: FrequentAttendee[] = Object.entries(attendeeCounts)
            .map(([key, value]) => ({
                name: key.split('-')[0],
                phoneNumber: value.phoneNumber,
                eventCount: value.count,
                lastEventDate: value.lastDate
            }))
            .sort((a, b) => b.eventCount - a.eventCount)
            .slice(0, 10);

        setFrequentAttendees(frequentAttendeesList);
    };

    const processPopularEvents = (attendees: Attendee[]) => {
        const categoryCount: Record<string, number> = {};
        
        attendees.forEach((attendee: Attendee) => {
            attendee.events.forEach(event => {
                const cat = event.category.name;
                categoryCount[cat] = (categoryCount[cat] || 0) + 1;
            });
        });

        const sortedCategories: CategoryDistribution[] = Object.entries(categoryCount)
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
        
        attendees.forEach((attendee: Attendee) => {
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
        attendee.name.toLowerCase().includes(searchFilter.toLowerCase())
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
        labels: [
            ...eachMonthOfInterval({
                start: subMonths(new Date(), 5),
                end: new Date()
            }).map(date => format(date, 'MMM yyyy')),
            ...Array(3).fill(0).map((_, i) => 
                format(addMonths(new Date(), i + 1), 'MMM yyyy')
            )
        ],
        datasets: [
            {
                label: 'Actual Attendance',
                data: [...attendanceTrend, ...new Array(3).fill(null)],
                borderColor: 'rgb(53, 162, 235)',
                backgroundColor: 'rgba(53, 162, 235, 0.5)',
                tension: 0.3,
                fill: true,
            },
            {
                label: 'Predicted Attendance',
                data: [...new Array(6).fill(null), ...predictedAttendance],
                borderColor: 'rgb(255, 99, 132)',
                backgroundColor: 'rgba(255, 99, 132, 0.5)',
                borderDash: [5, 5],
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
                text: '前五大热门活动 Top 5 Popular Events',
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
                    text: '参与人数 Number of Attendees',
                }
            },
            x: {
                title: {
                    display: true,
                    text: '活动类别 Category Name',
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
                text: '地区分布 Attendee Distribution by Region',
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
                text: '前十大城镇分布 Top 10 Towns by Attendee Count',
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
                    text: '参与人数 Number of Attendees'
                }
            },
            y: {
                title: {
                    display: true,
                    text: '城镇 Town'
                }
            }
        }
    };

    const calculateKPIs = (attendees: Attendee[]) => {
        const totalUniqueAttendees = attendees.length;
        const allEvents = attendees.flatMap(a => a.events);
        const totalEvents = new Set(allEvents.map(e => e.eventDate + e.eventTitle)).size;
        const avgAttendancePerEvent = totalEvents > 0 ? (allEvents.length / totalEvents).toFixed(1) : '0';
        
        // Calculate MoM Growth
        const thisMonth = allEvents.filter(e => {
            const date = parseISO(e.eventDate);
            return date.getMonth() === new Date().getMonth();
        }).length;
        
        const lastMonth = allEvents.filter(e => {
            const date = parseISO(e.eventDate);
            return date.getMonth() === subMonths(new Date(), 1).getMonth();
        }).length;

        const momGrowth = lastMonth > 0 ? 
            (((thisMonth - lastMonth) / lastMonth) * 100).toFixed(1) : '0';

        return {
            totalUniqueAttendees,
            totalEvents,
            avgAttendancePerEvent,
            momGrowth
        };
    };

    const calculateEngagementMetrics = (attendees: Attendee[]) => {
        // Calculate average time between events
        const avgTimeBetweenEvents = attendees.map(attendee => {
            const sortedEvents = [...attendee.events].sort((a, b) => {
                if (!a || !b) return 0;
                return parseISO(a.eventDate).getTime() - parseISO(b.eventDate).getTime();
            });
            
            if (sortedEvents.length < 2) return null;
            
            let totalDays = 0;
            for (let i = 1; i < sortedEvents.length; i++) {
                totalDays += differenceInDays(
                    parseISO(sortedEvents[i].eventDate),
                    parseISO(sortedEvents[i-1].eventDate)
                );
            }
            return totalDays / (sortedEvents.length - 1);
        }).filter((days): days is number => days !== null);

        const averageDaysBetweenEvents = avgTimeBetweenEvents.length > 0 
            ? Math.round(avgTimeBetweenEvents.reduce((a, b) => a + (b as number), 0) / avgTimeBetweenEvents.length)
            : 0;

        // Calculate retention rate
        const thisMonth = new Date();
        const lastMonth = subMonths(thisMonth, 1);
        
        const activeLastMonth = attendees.filter(attendee => 
            attendee.events.some(event => {
                const eventDate = parseISO(event.eventDate);
                return isSameMonth(eventDate, lastMonth) && isSameYear(eventDate, lastMonth);
            })
        ).length;

        const activeThisMonth = attendees.filter(attendee => 
            attendee.events.some(event => {
                const eventDate = parseISO(event.eventDate);
                return isSameMonth(eventDate, thisMonth) && isSameYear(eventDate, thisMonth);
            })
        ).length;

        const retentionRate = activeLastMonth > 0 
            ? ((activeThisMonth / activeLastMonth) * 100).toFixed(1)
            : '0';

        // Calculate churn risk
        const thirtyDaysAgo = subMonths(new Date(), 1);
        const attendeesAtRisk = attendees.filter(attendee => {
            const lastEventDate = parseISO(attendee.lastEventDate);
            return differenceInDays(new Date(), lastEventDate) > 30;
        }).length;

        return {
            averageDaysBetweenEvents,
            retentionRate,
            attendeesAtRisk
        };
    };

    // Add predictive analytics calculation
    const calculatePredictedAttendance = (attendees: Attendee[]) => {
        const now = new Date();
        const monthlyAttendance = new Array(6).fill(0);
        
        // Calculate past 6 months attendance
        for (let i = 5; i >= 0; i--) {
            const monthStart = startOfMonth(subMonths(now, i));
            const monthEnd = endOfMonth(subMonths(now, i));
            
            const count = attendees.reduce((acc, attendee) => {
                return acc + attendee.events.filter(event => {
                    const eventDate = parseISO(event.eventDate);
                    return eventDate >= monthStart && eventDate <= monthEnd;
                }).length;
            }, 0);
            
            monthlyAttendance[5-i] = count;
        }

        // Simple moving average prediction for next 3 months
        const predictions = [];
        const windowSize = 3;
        
        for (let i = 0; i < 3; i++) {
            const recentMonths = monthlyAttendance.slice(-windowSize);
            const prediction = Math.round(recentMonths.reduce((a, b) => a + b, 0) / windowSize);
            predictions.push(prediction);
            monthlyAttendance.push(prediction);
        }

        setPredictedAttendance(predictions);
    };

    // Add cohort analysis calculation
    const calculateCohortAnalytics = (attendees: Attendee[]) => {
        const cohorts: Map<string, Attendee[]> = new Map();
        
        // Group attendees by their first event month
        attendees.forEach(attendee => {
            if (attendee.events.length === 0) return;
            
            const firstEventDate = parseISO(attendee.events[0].eventDate);
            const cohortMonth = format(firstEventDate, 'yyyy-MM');
            
            if (!cohorts.has(cohortMonth)) {
                cohorts.set(cohortMonth, []);
            }
            cohorts.get(cohortMonth)!.push(attendee);
        });

        const cohortData: CohortData[] = [];
        const months = Array.from(cohorts.keys()).sort();

        months.forEach(cohortMonth => {
            const cohortAttendees = cohorts.get(cohortMonth)!;
            const originalSize = cohortAttendees.length;
            const retentionData = [];

            // Calculate retention for each month after cohort month
            for (let i = 0; i <= months.indexOf(cohortMonth); i++) {
                const targetMonth = format(addMonths(parseISO(cohortMonth + '-01'), i), 'yyyy-MM');
                const activeInMonth = cohortAttendees.filter(attendee =>
                    attendee.events.some(event => 
                        format(parseISO(event.eventDate), 'yyyy-MM') === targetMonth
                    )
                ).length;

                retentionData.push({
                    month: targetMonth,
                    count: activeInMonth,
                    percentage: Math.round((activeInMonth / originalSize) * 100)
                });
            }

            cohortData.push({
                cohortMonth,
                originalSize,
                retentionData
            });
        });

        setCohortAnalytics(cohortData);
    };

    useEffect(() => {
        if (attendees.length > 0) {
            calculatePredictedAttendance(attendees);
            calculateCohortAnalytics(attendees);
        }
    }, [attendees]);

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
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold">数据分析 Analytics Dashboard</h2>
                <div className="flex gap-4">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                            // TODO: Implement export functionality
                            console.log('Export data');
                        }}
                    >
                        导出数据 Export Data
                    </Button>
                </div>
            </div>

            {/* KPI Section */}
            {attendees.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {Object.entries(calculateKPIs(attendees)).map(([key, value]) => (
                        <Card key={key} className="p-4">
                            <h5 className="text-sm font-medium text-gray-500">
                                {key.split(/(?=[A-Z])/).join(' ').toUpperCase()}
                            </h5>
                            <div className="mt-2 flex items-baseline">
                                <p className="text-2xl font-semibold">
                                    {key === 'momGrowth' ? `${value}%` : value}
                                </p>
                                {key === 'momGrowth' && (
                                    <span className={`ml-2 text-sm ${
                                        parseFloat(value.toString()) > 0 ? 'text-green-600' : 
                                        parseFloat(value.toString()) < 0 ? 'text-red-600' : 'text-gray-600'
                                    }`}>
                                        {parseFloat(value.toString()) > 0 ? '↑' : parseFloat(value.toString()) < 0 ? '↓' : '→'}
                                    </span>
                                )}
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {/* Engagement Metrics Section */}
            {attendees.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {Object.entries(calculateEngagementMetrics(attendees)).map(([key, value]) => (
                        <Card key={key} className="p-4 bg-gray-50">
                            <h5 className="text-sm font-medium text-gray-500">
                                {key.split(/(?=[A-Z])/).join(' ').toUpperCase()}
                            </h5>
                            <div className="mt-2 flex items-baseline">
                                <p className="text-2xl font-semibold">
                                    {key === 'retentionRate' ? `${value}%` : 
                                     key === 'averageDaysBetweenEvents' ? `${value} days` : 
                                     value}
                                </p>
                                {key === 'attendeesAtRisk' && Number(value) > 0 && (
                                    <span className="ml-2 text-sm text-amber-600">
                                        Needs attention
                                    </span>
                                )}
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {/* Enhanced Filtering Section */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white p-6 rounded-lg shadow-md">
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

                <div className="space-y-2">
                    <label className="text-sm font-medium">Filter by Category</label>
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select Category" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Categories</SelectItem>
                            {Object.keys(categories).map((category) => (
                                <SelectItem key={category} value={category}>{category}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium">Date Range</label>
                    <div className="flex gap-2">
                        <Input
                            type="date"
                            value={format(dateRange.start, 'yyyy-MM-dd')}
                            onChange={(e) => setDateRange(prev => ({
                                ...prev,
                                start: parseISO(e.target.value)
                            }))}
                        />
                        <Input
                            type="date"
                            value={format(dateRange.end, 'yyyy-MM-dd')}
                            onChange={(e) => setDateRange(prev => ({
                                ...prev,
                                end: parseISO(e.target.value)
                            }))}
                        />
                    </div>
                </div>
            </div>

            {/* Filtered Attendees Table */}
            <div className="bg-white p-6 rounded-lg shadow-md">
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

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-semibold">出席趋势 Attendance Trend</h3>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    // Toggle between monthly and yearly view
                                    // TODO: Implement view toggle
                                }}
                            >
                                按月 Monthly
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    // Toggle between monthly and yearly view
                                    // TODO: Implement view toggle
                                }}
                            >
                                按年 Yearly
                            </Button>
                        </div>
                    </div>
                    <Line data={attendanceTrendData} options={attendanceTrendOptions} />
                </div>

                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h3 className="text-xl font-semibold mb-4">热门活动 Popular Events</h3>
                    <Bar data={categoryDistributionData} options={popularEventsOptions} />
                </div>

                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h3 className="text-xl font-semibold mb-4">地区分布 Region Distribution</h3>
                    <Doughnut data={regionDistributionData} options={regionDistributionOptions} />
                </div>

                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h3 className="text-xl font-semibold mb-4">城镇分布 Town Distribution</h3>
                    <Bar data={townDistributionData} options={townDistributionOptions} />
                </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-semibold mb-4">常客分析 Frequent Attendees</h3>
                <div className="mb-4">
                    <Input
                        type="text"
                        placeholder="按名字或电话号码筛选 Filter by name or phone number"
                        value={searchFilter}
                        onChange={(e) => {
                            setSearchFilter(e.target.value);
                            table.getColumn('name')?.setFilterValue(e.target.value);
                        }}
                        className="max-w-md"
                    />
                </div>
                
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

            {/* Predictive Analytics Section */}
            <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-semibold mb-4">出席预测 Attendance Forecast</h3>
                <div className="h-[400px]">
                    <Line data={attendanceTrendData} options={attendanceTrendOptions} />
                </div>
                <div className="mt-4 grid grid-cols-3 gap-4">
                    {predictedAttendance.map((prediction, index) => (
                        <Card key={index} className="p-4">
                            <h5 className="text-sm font-medium text-gray-500">
                                {format(addMonths(new Date(), index + 1), 'MMMM yyyy')}
                            </h5>
                            <p className="mt-2 text-2xl font-semibold">
                                {prediction}
                                <span className="text-sm text-gray-500 ml-2">attendees</span>
                            </p>
                        </Card>
                    ))}
                </div>
            </div>

            {/* Cohort Analysis Section */}
            <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-semibold mb-4">群组分析 Cohort Analysis</h3>
                <div className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead>
                            <tr className="bg-gray-50">
                                <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">群组 Cohort</th>
                                <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">人数 Size</th>
                                {Array.from({ length: 6 }, (_, i: number) => (
                                    <th key={i} className="px-4 py-2 text-left text-sm font-medium text-gray-500">
                                        第{i + 1}月 Month {i + 1}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {cohortAnalytics.map((cohort: CohortData) => (
                                <tr key={cohort.cohortMonth} className="border-t border-gray-200">
                                    <td className="px-4 py-2">{format(parseISO(cohort.cohortMonth + '-01'), 'MMM yyyy')}</td>
                                    <td className="px-4 py-2">{cohort.originalSize}</td>
                                    {cohort.retentionData.map((data, i: number) => (
                                        <td key={i} className="px-4 py-2">
                                            <div className="flex items-center">
                                                <div 
                                                    className="h-8 bg-blue-100 rounded"
                                                    style={{ width: `${data.percentage}%` }}
                                                >
                                                    <div className="px-2 py-1 text-xs">
                                                        {data.percentage}%
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AnalyticsDashboard;