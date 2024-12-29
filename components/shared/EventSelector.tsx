import React, { useState, useEffect, useMemo } from 'react';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Loader2 } from "lucide-react"
import { useUser } from '@clerk/nextjs';
import { Event } from '@/types';
import { Button } from "@/components/ui/button";

type EventSelectorProps = {
  onEventSelect: (event: Event) => void;
};

const EventSelector: React.FC<EventSelectorProps> = ({ onEventSelect }) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const { user } = useUser();

  const fetchEvents = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const country = user?.publicMetadata.country as string | undefined;
      const response = await fetch(`/api/events${country ? `?country=${country}` : ''}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();

      if (!Array.isArray(result.data)) {
        throw new Error('Fetched data is not in the expected format');
      }

      const recentAndUpcomingEvents = await Promise.all(result.data
        .sort((a: Event, b: Event) => new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime())
        .map(async (event: Event) => {
          try {
            const countsResponse = await fetch(`/api/events/${event._id}/counts`);
            if (!countsResponse.ok) {
              throw new Error(`Failed to fetch counts for event ${event._id}`);
            }
            const countsData = await countsResponse.json();
            return {
              ...event,
              totalRegistrations: countsData.totalRegistrations,
              attendedUsers: countsData.attendedUsers,
              cannotReciteAndWalk: countsData.cannotReciteAndWalk
            };
          } catch (error) {
            console.error(`Error fetching counts for event ${event._id}:`, error);
            // Return event without counts rather than failing completely
            return {
              ...event,
              totalRegistrations: 0,
              attendedUsers: 0,
              cannotReciteAndWalk: 0
            };
          }
        }));
      setEvents(recentAndUpcomingEvents);
    } catch (error) {
      console.error('Error fetching events:', error);
      setError('Unable to load events. Please try again.');
      setEvents([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchEvents();
    }
  }, [user]);

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    fetchEvents();
  };

  const groupedEvents = useMemo(() => {
    return events.reduce((acc, event) => {
      const category = event.category.name;
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(event);
      return acc;
    }, {} as Record<string, Event[]>);
  }, [events]);

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">Select an Event</h2>
        {error && (
          <Button 
            onClick={handleRetry}
            variant="outline"
            size="sm"
            className="ml-4"
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              'Retry'
            )}
          </Button>
        )}
      </div>
      
      {isLoading ? (
        <div className="flex items-center justify-center p-4 bg-gray-50 rounded-lg">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          <span>Loading events...</span>
        </div>
      ) : error ? (
        <div className="p-4 bg-red-50 text-red-700 rounded-lg">
          <p>{error}</p>
          <p className="text-sm mt-2">Retry count: {retryCount}</p>
        </div>
      ) : (
        <Select 
          onValueChange={(value) => {
            const selectedEvent = events.find(e => e._id === value);
            if (selectedEvent) {
              onEventSelect(selectedEvent);
            }
          }}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select an event" />
          </SelectTrigger>
          <SelectContent>
            <ScrollArea className="h-[300px]">
              {Object.entries(groupedEvents).map(([category, categoryEvents]) => (
                <SelectGroup key={category}>
                  <SelectLabel className="bg-gray-100 px-2 py-1 rounded-md text-sm font-semibold mb-2">
                    {category}
                  </SelectLabel>
                  {categoryEvents.map((event) => (
                    <SelectItem key={event._id} value={event._id}>
                      {event.title}
                    </SelectItem>
                  ))}
                </SelectGroup>
              ))}
              {Object.keys(groupedEvents).length === 0 && (
                <div className="p-2 text-gray-500 text-center">
                  No events available
                </div>
              )}
            </ScrollArea>
          </SelectContent>
        </Select>
      )}
    </div>
  );
};

export default EventSelector;
