'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import RegistrationCollection from '@/components/shared/RegistrationCollection';
import { getOrdersByPhoneNumber, getAllOrdersByPhoneNumber } from '@/lib/actions/order.actions';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import { IRegistration } from '@/types';
import { IOrderItem } from '@/lib/database/models/order.model';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

const EventLookupPage = () => {
    const [phoneNumber, setPhoneNumber] = useState('');
    const [useManualInput, setUseManualInput] = useState(false);
    const [registrations, setRegistrations] = useState<IRegistration[]>([]);
    const [allRegistrations, setAllRegistrations] = useState<IRegistration[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [hasSearched, setHasSearched] = useState(false);
    const [categoryStats, setCategoryStats] = useState<{ [key: string]: number }>({});

    const handleLookup = async () => {
        console.log('handleLookup called with phone number:', phoneNumber);
        setIsLoading(true);
        setError('');
        setHasSearched(true);
        try {
            // Get recent registrations
            console.log('Calling getOrdersByPhoneNumber for recent registrations...');
            const recentOrders = await getOrdersByPhoneNumber(phoneNumber);
            console.log('Recent orders received:', recentOrders);

            // Get all registrations for statistics
            console.log('Calling getAllOrdersByPhoneNumber for statistics...');
            const allOrders = await getAllOrdersByPhoneNumber(phoneNumber);
            console.log('All orders received:', allOrders);

            // Calculate category statistics
            const categoryCount: { [key: string]: number } = {};
            allOrders.forEach((order: any) => {
                const category = order.event.category?.name || 'Uncategorized';
                categoryCount[category] = (categoryCount[category] || 0) + 1;
            });
            setCategoryStats(categoryCount);

            // Transform recent orders for display
            const transformedRegistrations: IRegistration[] = recentOrders
                .sort((a: any, b: any) => new Date(b.event.startDateTime).getTime() - new Date(a.event.startDateTime).getTime())
                .map((order: any) => ({
                    event: {
                        _id: order.event._id,
                        title: order.event.title,
                        imageUrl: order.event.imageUrl,
                        startDateTime: order.event.startDateTime,
                        endDateTime: order.event.endDateTime,
                        orderId: order._id.toString(),
                        organizer: { _id: order.event.organizer?.toString() || '' },
                        customFieldValues: order.customFieldValues,
                    },
                    registrations: order.customFieldValues.map((group: any) => ({
                        queueNumber: group.queueNumber || '',
                        name: group.fields?.find((field: any) => 
                            field.label.toLowerCase().includes('name'))?.value || 'Unknown',
                    })),
                }));

            setRegistrations(transformedRegistrations);
            setAllRegistrations(transformedRegistrations);
        } catch (err) {
            console.error('Error fetching registrations:', err);
            setError('Failed to fetch registrations. Please try again.');
            setRegistrations([]);
            setAllRegistrations([]);
        }
        setIsLoading(false);
    };

    return (
        <div className="wrapper my-8 flex flex-col gap-8">
            <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-2xl font-bold mb-4 text-center text-primary-500">
                    活动查询 Event Lookup
                </h2>
                <p className="text-gray-600 mb-6 text-center">
                    输入您注册时使用的电话号码，查找您的活动详情和排队号码。
                    Enter your registration phone number to find your event details and queue number.
                </p>
                <div className="flex flex-col gap-4">
                    {useManualInput ? (
                        <Input
                            type="tel"
                            placeholder="输入电话号码 Enter phone number"
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                            className="p-regular-16 border-2"
                        />
                    ) : (
                        <PhoneInput
                            placeholder="输入电话号码 Enter phone number"
                            value={phoneNumber}
                            onChange={(value) => setPhoneNumber(value || '')}
                            defaultCountry="SG"
                            countries={["SG", "MY"]}
                            international
                            countryCallingCodeEditable={false}
                            className="p-regular-16 border-2 border-gray-300 rounded-md"
                        />
                    )}
                    
                    <div className="text-xs text-gray-500 text-right">
                        <button
                            type="button"
                            onClick={() => {
                                setUseManualInput(!useManualInput);
                                setPhoneNumber('');
                            }}
                            className="text-primary-500 hover:text-primary-600 hover:underline"
                        >
                            {useManualInput ? (
                                "切换回新马电话格式 Switch back to SG/MY phone number format"
                            ) : (
                                "使用其他国家的电话号码？点击这里 Using a phone number from another country? Click here"
                            )}
                        </button>
                    </div>

                    <Button onClick={handleLookup} disabled={isLoading} className="w-full">
                        {isLoading ? '查询中... Looking up...' : '查询 Lookup'}
                    </Button>
                </div>
            </div>

            {error && (
                <p className="text-red-500 text-center">
                    获取注册信息失败。请重试。 
                    Failed to fetch registrations. Please try again.
                </p>
            )}

            {isLoading ? (
                <p className="text-center">加载中... Loading...</p>
            ) : hasSearched ? (
                <>
                    {/* Category Distribution Chart */}
                    {Object.keys(categoryStats).length > 0 && (
                        <div className="bg-white p-6 rounded-lg shadow-md">
                            <h3 className="text-xl font-semibold mb-4 text-center text-primary-500">
                                活动类别分布 Event Category Distribution
                            </h3>
                            <div className="h-[300px] flex justify-center items-center">
                                <div className="w-[300px]">
                                    <Doughnut
                                        data={{
                                            labels: Object.keys(categoryStats),
                                            datasets: [
                                                {
                                                    data: Object.values(categoryStats),
                                                    backgroundColor: [
                                                        'rgba(54, 162, 235, 0.7)',  // Blue
                                                        'rgba(75, 192, 192, 0.7)',  // Teal
                                                        'rgba(255, 206, 86, 0.7)',  // Yellow
                                                        'rgba(255, 99, 132, 0.7)',  // Red
                                                        'rgba(153, 102, 255, 0.7)', // Purple
                                                    ],
                                                    borderColor: [
                                                        'rgba(54, 162, 235, 1)',
                                                        'rgba(75, 192, 192, 1)',
                                                        'rgba(255, 206, 86, 1)',
                                                        'rgba(255, 99, 132, 1)',
                                                        'rgba(153, 102, 255, 1)',
                                                    ],
                                                    borderWidth: 1,
                                                },
                                            ],
                                        }}
                                        options={{
                                            responsive: true,
                                            plugins: {
                                                legend: {
                                                    position: 'right',
                                                },
                                                title: {
                                                    display: true,
                                                    text: '您参与的活动类别 Your Event Categories',
                                                    font: {
                                                        size: 16,
                                                        weight: 'bold',
                                                    }
                                                },
                                            },
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    <RegistrationCollection
                        data={registrations}
                        emptyTitle="未找到注册信息 No registrations found"
                        emptyStateSubtext="未找到与此电话号码相关的注册信息。请检查后重试。 No registrations were found for this phone number. Please check and try again."
                        collectionType="All_Registrations"
                        limit={6}
                        page={1}
                        totalPages={1}
                    />
                </>
            ) : (
                <div className="flex-center wrapper min-h-[200px] w-full flex-col gap-3 rounded-[14px] bg-primary-50 py-28 text-center">
                    <h3 className="p-bold-20 md:h5-bold text-primary-500">
                        注册信息将显示在这里 Registrations will appear here
                    </h3>
                    <p className="p-regular-14 text-gray-600">
                        使用上方的表单搜索您的注册信息和排队号码。
                        Use the form above to search for your registrations and queue numbers.
                    </p>
                </div>
            )}
        </div>
    );
};

export default EventLookupPage;
