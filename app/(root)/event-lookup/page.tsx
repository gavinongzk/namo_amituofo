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
    const [initialSearchComplete, setInitialSearchComplete] = useState(false);
    const [isRestoringFromSession, setIsRestoringFromSession] = useState(false);

    // Define handleLookup as a useCallback to prevent unnecessary re-renders
    const handleLookup = useCallback(async () => {
        // Validate phone number before proceeding
        if (!phoneNumber || phoneNumber.trim() === '') {
            setError('请输入电话号码 / Please enter a phone number');
            setIsLoading(false);
            setIsLoadingStats(false);
            return;
        }

        // Don't perform lookup if we're restoring from session
        if (isRestoringFromSession) {
            setIsRestoringFromSession(false);
            return;
        }

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

                // Get recent registrations with cache-busting query param
                const response = await fetch(`/api/reg?phoneNumber=${encodeURIComponent(phoneNumber)}&t=${Date.now()}`);
                
                if (!response.ok) {
                    throw new Error(`API responded with status: ${response.status}`);
                }
                
                const data = await response.json();
                
                // Sort registrations by event start date in ascending order
                const sortedData = data.sort((a: IRegistration, b: IRegistration) => {
                    const dateA = new Date(a.event.startDateTime || 0);
                    const dateB = new Date(b.event.startDateTime || 0);
                    return dateA.getTime() - dateB.getTime();
                });
                
                setRegistrations(sortedData);
                
                // Save to session storage for back navigation
                if (typeof window !== 'undefined') {
                    sessionStorage.setItem('eventLookupRegistrations', JSON.stringify(sortedData));
                    sessionStorage.setItem('eventLookupPhoneNumber', phoneNumber);
                    sessionStorage.setItem('eventLookupHasSearched', 'true');
                }
                
                setIsLoading(false);

                // Only fetch all registrations if there are recent ones
                if (data.length > 0) {
                    // Add delay between requests to prevent race conditions
                    await new Promise(resolve => setTimeout(resolve, 500));

                    // Then get all registrations for statistics with cache-busting query param
                    const allOrdersResponse = await fetch(`/api/all-registrations?phoneNumber=${encodeURIComponent(phoneNumber)}&t=${Date.now()}`);
                    
                    if (allOrdersResponse.ok) {
                        const allData = await allOrdersResponse.json();
                        setAllRegistrations(allData);
                        
                        // Save all registrations to session storage
                        if (typeof window !== 'undefined') {
                            sessionStorage.setItem('eventLookupAllRegistrations', JSON.stringify(allData));
                        }
                        
                        setShowAnalytics(true);
                    }
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
    }, [phoneNumber, isRestoringFromSession]);

    useEffect(() => {
        setIsReady(true);
        
        // Try to restore from session storage first (for back navigation)
        if (typeof window !== 'undefined') {
            const savedRegistrations = sessionStorage.getItem('eventLookupRegistrations');
            const savedPhoneNumber = sessionStorage.getItem('eventLookupPhoneNumber');
            const savedHasSearched = sessionStorage.getItem('eventLookupHasSearched');
            const savedAllRegistrations = sessionStorage.getItem('eventLookupAllRegistrations');
            
            // Check if user is coming back from an order details page
            const referrer = document.referrer;
            const isBackFromOrderDetails = referrer && referrer.includes('/reg/');
            
            if (isBackFromOrderDetails && savedRegistrations && savedPhoneNumber && savedHasSearched) {
                setIsRestoringFromSession(true);
                setPhoneNumber(savedPhoneNumber);
                
                // Sort restored registrations by event start date in ascending order
                const restoredRegistrations = JSON.parse(savedRegistrations);
                const sortedRestoredRegistrations = restoredRegistrations.sort((a: IRegistration, b: IRegistration) => {
                    const dateA = new Date(a.event.startDateTime || 0);
                    const dateB = new Date(b.event.startDateTime || 0);
                    return dateA.getTime() - dateB.getTime();
                });
                
                setRegistrations(sortedRestoredRegistrations);
                setHasSearched(savedHasSearched === 'true');
                
                if (savedAllRegistrations) {
                    setAllRegistrations(JSON.parse(savedAllRegistrations));
                    setShowAnalytics(true);
                }
                
                setInitialSearchComplete(true);
                
                // Only trigger a refresh if we have a valid phone number
                if (savedPhoneNumber && savedPhoneNumber.trim() !== '') {
                    setTimeout(() => {
                        handleLookup();
                    }, 300);
                }
                
                return;
            } else if (!isBackFromOrderDetails && (savedRegistrations || savedPhoneNumber || savedHasSearched || savedAllRegistrations)) {
                // Clear session storage if user is not coming back from order details but has session data
                sessionStorage.removeItem('eventLookupRegistrations');
                sessionStorage.removeItem('eventLookupPhoneNumber');
                sessionStorage.removeItem('eventLookupHasSearched');
                sessionStorage.removeItem('eventLookupAllRegistrations');
            }
        }
        
        // If no session data, check URL params
        const phoneParam = searchParams.get('phone');
        if (phoneParam && !initialSearchComplete) {
            setPhoneNumber(phoneParam);
            // Auto-trigger the lookup after a short delay to ensure the component is fully mounted
            setTimeout(() => {
                handleLookup();
                setInitialSearchComplete(true);
            }, 500);
        }
        
        // Clean up function to reset states
        return () => {
            // Don't clear session storage on unmount to preserve state for back navigation
        };
    }, [searchParams, handleLookup, initialSearchComplete]);

    // Clear session storage when user manually changes the phone number
    const handlePhoneNumberChange = (value: string) => {
        if (typeof window !== 'undefined' && value !== phoneNumber) {
            sessionStorage.removeItem('eventLookupRegistrations');
            sessionStorage.removeItem('eventLookupPhoneNumber');
            sessionStorage.removeItem('eventLookupHasSearched');
            sessionStorage.removeItem('eventLookupAllRegistrations');
        }
        setPhoneNumber(value || '');
    };

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
                    输入您报名时使用的电话号码，查找您的活动详情和排队号码。
                    <br />
                    Enter your registration phone number to find your event details and queue number.
                </p>
                <form 
                    onSubmit={(e) => {
                        e.preventDefault();
                        if (phoneNumber && isReady && !isLoading) {
                            handleLookup();
                        }
                    }}
                    className="flex flex-col gap-4 max-w-md mx-auto"
                >
                    <div className="relative">
                        {useManualInput ? (
                            <Input
                                type="tel"
                                placeholder="输入电话号码 Enter phone number"
                                value={phoneNumber}
                                onChange={(e) => handlePhoneNumberChange(e.target.value)}
                                className="p-regular-16 border-2 h-12 transition-all duration-200 focus:ring-2 focus:ring-primary-500"
                            />
                        ) : (
                            <PhoneInput
                                key={initialSearchComplete ? "editable" : "initial"}
                                placeholder="输入电话号码 Enter phone number"
                                value={phoneNumber}
                                onChange={(value) => handlePhoneNumberChange(value || '')}
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
                                // Clear session storage when switching input modes
                                if (typeof window !== 'undefined') {
                                    sessionStorage.removeItem('eventLookupRegistrations');
                                    sessionStorage.removeItem('eventLookupPhoneNumber');
                                    sessionStorage.removeItem('eventLookupHasSearched');
                                    sessionStorage.removeItem('eventLookupAllRegistrations');
                                }
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
                        type="submit"
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
                </form>
            </motion.div>

            {error && (
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-lg text-center"
                >
                    获取报名资料失败。请重试。 
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
                        emptyTitle="未找到报名资料 No registrations found"
                        emptyStateSubtext="未找到与此电话号码相关的报名资料。请检查后重试。 No registrations were found for this phone number. Please check and try again."
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
                        报名资料将显示在这里 Registrations will appear here
                    </h3>
                    <p className="p-regular-14 text-gray-600">
                        使用上方的表单搜索您的报名资料和排队号码。
                        <br />
                        Use the form above to search for your registrations and queue numbers.
                    </p>
                </motion.div>
            )}

        </div>
    );
};

export default EventLookupPage;
