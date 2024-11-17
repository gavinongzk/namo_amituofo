'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import RegistrationCollection from '@/components/shared/RegistrationCollection';
import { getOrdersByPhoneNumber } from '@/lib/actions/order.actions';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import { IRegistration } from '@/types';
import { IOrderItem } from '@/lib/database/models/order.model'; // Import IOrderItem

const EventLookupPage = () => {
    const [phoneNumber, setPhoneNumber] = useState('');
    const [useManualInput, setUseManualInput] = useState(false);
    const [registrations, setRegistrations] = useState<IRegistration[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [hasSearched, setHasSearched] = useState(false);

    const handleLookup = async () => {
        console.log('handleLookup called with phone number:', phoneNumber);
        setIsLoading(true);
        setError('');
        setHasSearched(true);
        try {
            console.log('Calling getOrdersByPhoneNumber...');
            const orders = await getOrdersByPhoneNumber(phoneNumber);
            console.log('Orders received:', orders);

            // Transform each order into IRegistration format
            const transformedRegistrations: IRegistration[] = orders.map((order: any) => ({
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
        } catch (err) {
            console.error('Error fetching registrations:', err);
            setError('Failed to fetch registrations. Please try again.');
            setRegistrations([]);
        }
        setIsLoading(false);
    };

    return (
        <div className="wrapper my-8 flex flex-col gap-8">
            <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-2xl font-bold mb-4 text-center text-primary-500">
                    Event Lookup / 活动查询
                </h2>
                <p className="text-gray-600 mb-6 text-center">
                    Enter your registration phone number to find your event details and queue number. /
                    输入您注册时使用的电话号码，查找您的活动详情和排队号码。
                </p>
                <div className="flex flex-col gap-4">
                    {useManualInput ? (
                        <Input
                            type="tel"
                            placeholder="Enter phone number / 输入电话号码"
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                            className="p-regular-16 border-2"
                        />
                    ) : (
                        <PhoneInput
                            placeholder="Enter phone number / 输入电话号码"
                            value={phoneNumber}
                            onChange={(value) => setPhoneNumber(value || '')}
                            defaultCountry="SG"
                            countries={["SG", "MY"]}
                            international
                            countryCallingCodeEditable={false}
                            className="p-regular-16 border-2 border-gray-300 rounded-md"
                        />
                    )}
                    
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            checked={useManualInput}
                            onCheckedChange={(checked) => {
                                setUseManualInput(checked === true);
                                setPhoneNumber('');
                            }}
                        />
                        <label className="text-xs text-gray-500">
                            I am not from Singapore/Malaysia but would like to lookup (please include country calling code such as +86)
                            <br />
                            我不是来自新加坡/马来西亚但想要查询 (请包括国家区号，例如 +86)
                        </label>
                    </div>

                    <Button onClick={handleLookup} disabled={isLoading} className="w-full">
                        {isLoading ? 'Looking up... / 查询中...' : 'Lookup / 查询'}
                    </Button>
                </div>
            </div>

            {error && (
                <p className="text-red-500 text-center">
                    Failed to fetch registrations. Please try again. / 
                    获取注册信息失败。请重试。
                </p>
            )}

            {isLoading ? (
                <p className="text-center">Loading... / 加载中...</p>
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
            ) : (
                <div className="flex-center wrapper min-h-[200px] w-full flex-col gap-3 rounded-[14px] bg-primary-50 py-28 text-center">
                    <h3 className="p-bold-20 md:h5-bold text-primary-500">
                        Registrations will appear here / 注册信息将显示在这里
                    </h3>
                    <p className="p-regular-14 text-gray-600">
                        Use the form above to search for your registrations and queue numbers. /
                        使用上方的表单搜索您的注册信息和排队号码。
                    </p>
                </div>
            )}
        </div>
    );
};

export default EventLookupPage;
