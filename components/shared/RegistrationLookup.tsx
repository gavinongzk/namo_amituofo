'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import RegistrationCollection from '@/components/shared/RegistrationCollection';
import { getOrdersByPhoneNumber } from '@/lib/actions/order.actions';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import { IRegistration } from '@/types';
import { IOrderItem } from '@/lib/database/models/order.model';

const RegistrationLookup = () => {
    const [phoneNumber, setPhoneNumber] = useState('');
    const [registrations, setRegistrations] = useState<IRegistration[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [hasSearched, setHasSearched] = useState(false);

    const handleLookup = async () => {
        setIsLoading(true);
        setError('');
        setHasSearched(true);
        try {
            console.log('Fetching orders for phone number:', phoneNumber);
            const orders = await getOrdersByPhoneNumber(phoneNumber);
            console.log('Received orders:', orders);

            // Transform orders into IRegistration format
            const transformedRegistrations: IRegistration[] = orders.map((order: IOrderItem) => ({
                event: {
                    _id: order.event._id,
                    title: order.event.title,
                    imageUrl: order.event.imageUrl,
                    startDateTime: order.event.startDateTime,
                    endDateTime: order.event.endDateTime,
                    orderId: order._id.toString(),
                    organizer: { _id: order.event.organizer?.toString() || '' },
                },
                registrations: order.customFieldValues.map((group) => ({
                    queueNumber: group.queueNumber || '',
                    name: group.fields.find(field => field.label.toLowerCase().includes('name'))?.value || 'Unknown',
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
        <div className="flex flex-col gap-8">
            <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-2xl font-bold mb-4 text-center text-primary-500">注册查询</h2>
                <p className="text-gray-600 mb-6 text-center">
                    输入您注册时使用的电话号码，查找您的活动详情和排队号码。
                </p>
                <div className="flex flex-col gap-4">
                    <PhoneInput
                        placeholder="输入电话号码"
                        value={phoneNumber}
                        onChange={(value) => setPhoneNumber(value || '')}
                        defaultCountry="SG"
                        countries={["SG", "MY"]}
                        international
                        countryCallingCodeEditable={false}
                        className="p-regular-16 border-2 border-gray-300 rounded-md"
                    />
                    <Button onClick={handleLookup} disabled={isLoading} className="w-full">
                        {isLoading ? 'Looking up... / 查询中...' : 'Lookup Registrations / 查询注册'}
                    </Button>
                </div>
            </div>

            {error && <p className="text-red-500 text-center">{error}</p>}

            {isLoading ? (
                <p className="text-center">Loading... / 加载中...</p>
            ) : hasSearched ? (
                <RegistrationCollection
                    data={registrations}
                    emptyTitle="No registrations found / 未找到注册信息"
                    emptyStateSubtext="No registrations found for this phone number. / 未找到与此电话号码相关的注册信息。"
                    collectionType="All_Registrations"
                    limit={6}
                    page={1}
                    totalPages={1}
                />
            ) : (
                <div className="flex-center wrapper min-h-[200px] w-full flex-col gap-3 rounded-[14px] bg-primary-50 py-28 text-center">
                    <h3 className="p-bold-20 md:h5-bold text-primary-500">注册信息将显示在这里</h3>
                    <p className="p-regular-14 text-gray-600">Use the form above to search for your registrations and queue numbers. / 使用上方的表单搜索您的注册信息和排队号码。</p>
                </div>
            )}
        </div>
    );
};

export default RegistrationLookup;
