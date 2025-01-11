import React from 'react';
import { Bar, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { format, parseISO } from 'date-fns';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

interface Event {
    _id: string;
    title: string;
    startDateTime?: string | Date;
    endDateTime?: string | Date;
    category?: {
        name: string;
    };
}

interface Registration {
    event: Event;
    registrations: Array<{
        queueNumber?: string;
        name?: string;
    }>;
}

interface UserAnalyticsVisualsProps {
    registrations: Registration[];
}

const UserAnalyticsVisuals: React.FC<UserAnalyticsVisualsProps> = ({ registrations }) => {
    // Process data for category distribution
    const categoryData = React.useMemo(() => {
        const categoryCount: { [key: string]: number } = {};
        registrations.forEach(reg => {
            const category = reg.event.category?.name || 'Uncategorized';
            categoryCount[category] = (categoryCount[category] || 0) + 1;
        });

        const labels = Object.keys(categoryCount);
        const data = Object.values(categoryCount);

        return {
            labels,
            datasets: [{
                label: 'Events by Category',
                data,
                backgroundColor: [
                    'rgba(255, 99, 132, 0.5)',
                    'rgba(54, 162, 235, 0.5)',
                    'rgba(255, 206, 86, 0.5)',
                    'rgba(75, 192, 192, 0.5)',
                    'rgba(153, 102, 255, 0.5)',
                ],
                borderColor: [
                    'rgba(255, 99, 132, 1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 206, 86, 1)',
                    'rgba(75, 192, 192, 1)',
                    'rgba(153, 102, 255, 1)',
                ],
                borderWidth: 1,
            }],
        };
    }, [registrations]);

    // Process data for monthly attendance
    const monthlyData = React.useMemo(() => {
        const monthlyCount: { [key: string]: number } = {};
        
        registrations.forEach(reg => {
            if (reg.event.startDateTime) {
                const date = new Date(reg.event.startDateTime);
                const monthYear = format(date, 'MMM yyyy');
                monthlyCount[monthYear] = (monthlyCount[monthYear] || 0) + 1;
            }
        });

        // Sort by date
        const sortedMonths = Object.keys(monthlyCount).sort((a, b) => {
            return parseISO(a).getTime() - parseISO(b).getTime();
        });

        return {
            labels: sortedMonths,
            datasets: [{
                label: 'Monthly Attendance',
                data: sortedMonths.map(month => monthlyCount[month]),
                backgroundColor: 'rgba(75, 192, 192, 0.5)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1,
            }],
        };
    }, [registrations]);

    const options = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top' as const,
            },
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    stepSize: 1,
                }
            }
        }
    };

    const doughnutOptions = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top' as const,
            },
        },
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <div className="bg-white p-4 rounded-lg shadow">
                <h4 className="text-lg font-semibold mb-4 text-primary-500 text-center">
                    活动类型分布 Event Category Distribution
                </h4>
                <Doughnut data={categoryData} options={doughnutOptions} />
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
                <h4 className="text-lg font-semibold mb-4 text-primary-500 text-center">
                    每月参与趋势 Monthly Attendance Trend
                </h4>
                <Bar data={monthlyData} options={options} />
            </div>
        </div>
    );
};

export default UserAnalyticsVisuals; 