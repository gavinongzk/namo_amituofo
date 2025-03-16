'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import dynamic from 'next/dynamic';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import { IRegistration } from '@/types';
import { IOrderItem } from '@/lib/database/models/order.model';
import { formatBilingualDateTime } from '@/lib/utils';
import { getOrdersByPhoneNumber, getAllOrdersByPhoneNumber } from '@/lib/actions/order.actions';
import { useSearchParams } from 'next/navigation';

// Dynamic imports for heavy components
const RegistrationCollection = dynamic(() => import('@/components/shared/RegistrationCollection'), {
    loading: () => <div className="flex-center min-h-[200px]"><Loader2 className="h-8 w-8 animate-spin text-primary-500" /></div>
});

const EventLookupAnalytics = dynamic(() => import('@/components/shared/EventLookupAnalytics'), {
    loading: () => <div className="flex-center min-h-[200px]"><Loader2 className="h-8 w-8 animate-spin text-primary-500" /></div>,
    ssr: false
});

const EventLookupPage = () => {
    const searchParams = useSearchParams();
    const [phoneNumber, setPhoneNumber] = useState('');
    const [useManualInput, setUseManualInput] = useState(false);
    const [registrations, setRegistrations] = useState<IRegistration[]>([]);
    const [allRegistrations, setAllRegistrations] = useState<IRegistration[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingStats, setIsLoadingStats] = useState(false);
    const [error, setError] = useState('');
    const [hasSearched, setHasSearched] = useState(false);
    const [isReady, setIsReady] = useState(false);
    const [showAnalytics, setShowAnalytics] = useState(false);

    // Define handleLookup as a useCallback to prevent unnecessary re-renders
    const handleLookup = useCallback(async () => {
        setIsLoading(true);
        setIsLoadingStats(true);
        setError('');
        setHasSearched(true);
        setShowAnalytics(false);
        
        const maxRetries = 2;
        let retryCount = 0;
        
        while (retryCount <= maxRetries) {
            try {
                // Add minimum delay between retries
                if (retryCount > 0) {
                    await new Promise(resolve => setTimeout(resolve, Math.max(1000, Math.pow(2, retryCount) * 1000)));
                }

                // Get recent registrations first with cache-busting query param
                const recentOrders = await getOrdersByPhoneNumber(phoneNumber + `?t=${Date.now()}`);
                
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
                            category: order.event.category,
                        },
                        registrations: order.customFieldValues.map((group: any) => ({
                            queueNumber: group.queueNumber,
                            name: group.fields?.find((field: any) => 
                                field.label.toLowerCase().includes('name'))?.value || 'Unknown',
                        })),
                    }));

                setRegistrations(transformedRegistrations);
                setIsLoading(false);

                // Only fetch all registrations if there are recent ones
                if (transformedRegistrations.length > 0) {
                    // Add delay between requests to prevent race conditions
                    await new Promise(resolve => setTimeout(resolve, 500));

                    // Then get all registrations for statistics with cache-busting query param
                    const allOrders = await getAllOrdersByPhoneNumber(phoneNumber + `?t=${Date.now()}`);
                    
                    // Transform all orders for statistics
                    const transformedAllRegistrations: IRegistration[] = allOrders
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
                                category: order.event.category,
                            },
                            registrations: order.customFieldValues.map((group: any) => ({
                                queueNumber: group.queueNumber,
                                name: group.fields?.find((field: any) => 
                                    field.label.toLowerCase().includes('name'))?.value || 'Unknown',
                            })),
                        }));

                    setAllRegistrations(transformedAllRegistrations);
                    setShowAnalytics(true);
                }
                setIsLoadingStats(false);
                break; // Exit the retry loop if successful
            } catch (err) {
                console.error(`Attempt ${retryCount + 1} failed:`, err);
                retryCount++;
                
                if (retryCount === maxRetries) {
                    setError('Failed to fetch registrations. Please try again.');
                    setRegistrations([]);
                    setAllRegistrations([]);
                    setIsLoading(false);
                    setIsLoadingStats(false);
                }
            }
        }
    }, [phoneNumber]);

    useEffect(() => {
        setIsReady(true);
        
        // Check if there's a phone number in the URL query parameters
        const phoneParam = searchParams.get('phone');
        if (phoneParam) {
            setPhoneNumber(phoneParam);
            // Auto-trigger the lookup after a short delay to ensure the component is fully mounted
            setTimeout(() => {
                handleLookup();
            }, 500);
        }
        
        // Clean up function to reset states
        return () => {
            setRegistrations([]);
            setAllRegistrations([]);
            setError('');
            setHasSearched(false);
            setShowAnalytics(false);
        };
    }, [searchParams, handleLookup]);

    return (
        <div className="wrapper my-8 flex flex-col gap-8 max-w-6xl mx-auto">
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white p-8 rounded-xl shadow-lg border border-gray-100"
            >
                <h2 className="text-3xl font-bold mb-4 text-center text-primary-500">
                    活动查询 Event Lookup
                </h2>
                <p className="text-gray-600 mb-8 text-center max-w-2xl mx-auto">
                    输入您注册时使用的电话号码，查找您的活动详情和排队号码。
                    <br />
                    Enter your registration phone number to find your event details and queue number.
                </p>
                <div className="flex flex-col gap-4 max-w-md mx-auto">
                    <div className="relative">
                        {useManualInput ? (
                            <Input
                                type="tel"
                                placeholder="输入电话号码 Enter phone number"
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value)}
                                className="p-regular-16 border-2 h-12 transition-all duration-200 focus:ring-2 focus:ring-primary-500"
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
                                className="p-regular-16 border-2 border-gray-300 rounded-md h-12 transition-all duration-200 focus-within:ring-2 focus-within:ring-primary-500"
                            />
                        )}
                    </div>
                    
                    <div className="text-xs text-gray-500 text-right">
                        <button
                            type="button"
                            onClick={() => {
                                setUseManualInput(!useManualInput);
                                setPhoneNumber('');
                            }}
                            className="text-primary-500 hover:text-primary-600 transition-colors duration-200 hover:underline"
                        >
                            {useManualInput ? (
                                "切换回新马电话格式 Switch back to SG/MY phone number format"
                            ) : (
                                "使用其他国家的电话号码？点击这里 Using a phone number from another country? Click here"
                            )}
                        </button>
                    </div>

                    <Button 
                        onClick={handleLookup} 
                        disabled={isLoading || !isReady || !phoneNumber} 
                        className="w-full h-12 text-lg font-semibold transition-all duration-200 hover:scale-[1.02]"
                    >
                        {!isReady ? (
                            <div className="flex items-center gap-2">
                                <Loader2 className="h-5 w-5 animate-spin" />
                                <span>页面加载中... Loading page...</span>
                            </div>
                        ) : isLoading ? (
                            <div className="flex items-center gap-2">
                                <Loader2 className="h-5 w-5 animate-spin" />
                                <span>查询中... Looking up...</span>
                            </div>
                        ) : (
                            '查询 Lookup'
                        )}
                    </Button>
                </div>
            </motion.div>

            {error && (
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-lg text-center"
                >
                    获取注册信息失败。请重试。 
                    <br />
                    Failed to fetch registrations. Please try again.
                </motion.div>
            )}

            {isLoading ? (
                <div className="flex-center min-h-[200px]">
                    <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
                </div>
            ) : hasSearched ? (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <RegistrationCollection
                        data={registrations}
                        emptyTitle="未找到注册信息 No registrations found"
                        emptyStateSubtext="未找到与此电话号码相关的注册信息。请检查后重试。 No registrations were found for this phone number. Please check and try again."
                        collectionType="All_Registrations"
                        limit={6}
                        page={1}
                        totalPages={1}
                    />
                </motion.div>
            ) : (
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex-center wrapper min-h-[200px] w-full flex-col gap-3 rounded-xl bg-primary-50/50 py-28 text-center border border-primary-100"
                >
                    <h3 className="p-bold-20 md:h5-bold text-primary-500">
                        注册信息将显示在这里 Registrations will appear here
                    </h3>
                    <p className="p-regular-14 text-gray-600">
                        使用上方的表单搜索您的注册信息和排队号码。
                        <br />
                        Use the form above to search for your registrations and queue numbers.
                    </p>
                </motion.div>
            )}

        </div>
    );
};

export default EventLookupPage;
