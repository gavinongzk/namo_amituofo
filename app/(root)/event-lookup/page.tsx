'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import RegistrationCollection from '@/components/shared/RegistrationCollection';
import { getOrdersByPhoneNumber } from '@/lib/actions/order.actions';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import { IRegistration } from '@/types';
import { IOrderItem } from '@/lib/database/models/order.model'; // Import IOrderItem

const EventLookupPage = () => {
    const [phoneNumber, setPhoneNumber] = useState('');
    const [registrations, setRegistrations] = useState<IRegistration[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLookup = async () => {
        setIsLoading(true);
        setError('');
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
        <>
            <section className="bg-primary-50 bg-dotted-pattern bg-cover bg-center py-5 md:py-10">
                <div className="wrapper flex items-center justify-center sm:justify-between">
                    <h3 className='h3-bold text-center sm:text-left'>Event Lookup</h3>
                </div>
            </section>

            <div className="wrapper my-8 flex flex-col gap-8">
                <div className="flex flex-col gap-4">
                    <PhoneInput
                        placeholder="Enter phone number"
                        value={phoneNumber}
                        onChange={(value) => setPhoneNumber(value || '')}
                        defaultCountry="SG"
                        countries={["SG", "MY"]}
                        international
                        countryCallingCodeEditable={false}
                        className="p-regular-16 border-2 border-gray-300 rounded-md"
                    />
                    <Button onClick={handleLookup} disabled={isLoading}>
                        {isLoading ? 'Looking up...' : 'Lookup Orders'}
                    </Button>
                </div>

                {error && <p className="text-red-500">{error}</p>}

                {isLoading ? (
                    <p>Loading...</p>
                ) : (
                    <RegistrationCollection
                        data={registrations}
                        emptyTitle="No registrations found"
                        emptyStateSubtext="No registrations found for this phone number."
                        collectionType="All_Registrations"
                        limit={6}
                        page={1}
                        totalPages={1}
                    />
                )}
            </div>
        </>
    );
};

export default EventLookupPage;
