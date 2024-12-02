'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import PhoneInput from 'react-phone-number-input';
import RegistrationCollection from '@/components/shared/RegistrationCollection';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { unstable_cache } from 'next/cache';

// Debounce function for search optimization
const debounce = (func: Function, wait: number) => {
  let timeout: NodeJS.Timeout;
  return (...args: any[]) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

const EventLookupPage = () => {
    const [phoneNumber, setPhoneNumber] = useState('');
    const [useManualInput, setUseManualInput] = useState(false);
    const [registrations, setRegistrations] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    // Optimized search function with debouncing
    const handleSearch = debounce(async () => {
        if (!phoneNumber) return;

        setIsLoading(true);
        try {
            const response = await fetch(`/api/user/registrations?phone=${encodeURIComponent(phoneNumber)}`, {
                next: { 
                    revalidate: 30,
                    tags: ['registrations']
                }
            });
            
            if (!response.ok) throw new Error('Failed to fetch registrations');
            
            const data = await response.json();
            
            startTransition(() => {
                setRegistrations(data);
                setHasSearched(true);
                router.prefetch('/events'); // Prefetch events page
            });
        } catch (error) {
            console.error('Error fetching registrations:', error);
        } finally {
            setIsLoading(false);
        }
    }, 300);

    return (
        <div className="wrapper my-8 flex flex-col gap-8">
            <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-2xl font-bold mb-4 text-center text-primary-500">
                    Event Lookup / 活动查询
                </h2>
                <div className="flex flex-col gap-4">
                    {useManualInput ? (
                        <Input
                            type="tel"
                            placeholder="Enter phone number / 输入电话号码"
                            value={phoneNumber}
                            onChange={(e) => {
                                setPhoneNumber(e.target.value);
                                handleSearch();
                            }}
                            className="p-regular-16 border-2"
                        />
                    ) : (
                        <PhoneInput
                            placeholder="Enter phone number / 输入电话号码"
                            value={phoneNumber}
                            onChange={(value) => {
                                setPhoneNumber(value || '');
                                handleSearch();
                            }}
                            defaultCountry="SG"
                            countries={["SG", "MY"]}
                            international
                            countryCallingCodeEditable={false}
                            className="p-regular-16 border-2 border-gray-300 rounded-md"
                        />
                    )}
                    
                    <Button
                        onClick={() => setUseManualInput(!useManualInput)}
                        variant="outline"
                        className="w-full"
                    >
                        {useManualInput ? 'Use Phone Input / 使用电话输入' : 'Manual Input / 手动输入'}
                    </Button>
                </div>
            </div>

            {isLoading || isPending ? (
                <div className="flex-center min-h-[200px]">
                    <div className="loader" />
                </div>
            ) : hasSearched ? (
                <RegistrationCollection
                    data={registrations}
                    emptyTitle="No registrations found / 未找到注册信息"
                    emptyStateSubtext="No registrations were found for this phone number. Please check and try again. / 未找到与此电话号码相关的注册信息。请检查后重试。"
                    collectionType="All_Registrations"
                    limit={6}
                    page={1}
                    totalPages={1}
                />
            ) : null}
        </div>
    );
};

export default EventLookupPage;
