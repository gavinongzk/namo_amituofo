'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarIcon, MapPinIcon, UsersIcon } from '@heroicons/react/24/outline';
import { formatBilingualDateTime } from '@/lib/utils';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2 } from "lucide-react";
import Collection from '@/components/shared/Collection';
import { IEvent } from '@/lib/database/models/event.model';
import { CustomField } from '@/types';

type EventWithCounts = IEvent & {
  registrationCount?: number;
  orderId?: string;
  customFieldValues?: CustomField[];
  queueNumber?: string;
};

const EventLookupPage = () => {
  const { user } = useUser();
  const [searchQuery, setSearchQuery] = useState('');
  const [events, setEvents] = useState<EventWithCounts[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const fetchEvents = async () => {
      setIsLoading(true);
      try {
        const country = user?.publicMetadata.country as string | undefined;
        const timestamp = new Date().getTime();
        const response = await fetch(`/api/events${country ? `?country=${country}` : ''}&bustCache=true&_=${timestamp}`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();

        if (Array.isArray(result.data)) {
          const eventsWithCounts = await Promise.all(result.data.map(async (event: IEvent) => {
            const countsResponse = await fetch(`/api/events/${event._id}/counts`);
            const countsData = await countsResponse.json();
            return {
              ...event,
              registrationCount: countsData.totalRegistrations
            };
          }));

          setEvents(eventsWithCounts);
          setTotalPages(result.totalPages || 1);
        }
      } catch (error) {
        console.error('Error fetching events:', error);
        setEvents([]);
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchEvents();
    }
  }, [user, page]);

  const filteredEvents = events.filter(event => 
    event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    event.category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    event.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="wrapper my-8 min-h-screen">
      <div className="flex flex-col gap-8">
        <h1 className="h2-bold">Event Lookup</h1>
        
        <div className="flex items-center gap-4">
          <Input
            type="text"
            placeholder="Search events by title, category, or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full max-w-lg"
          />
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <Collection
            data={filteredEvents}
            emptyTitle="No events found"
            emptyStateSubtext="Try adjusting your search criteria"
            page={page}
            totalPages={totalPages}
            limit={10}
            collectionType="Admin_Events"
          />
        )}
      </div>
    </div>
  );
};

export default EventLookupPage; 