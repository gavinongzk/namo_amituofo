import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Loader2 } from "lucide-react"
import { useUser } from '@clerk/nextjs';
import { Event } from '@/types';

type EventSelectorProps = {
  onEventSelect: (event: Event) => void;
};

const EventSelector: React.FC<EventSelectorProps> = ({ onEventSelect }) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useUser();
  const eventsCache = useRef<Record<string, Event[]>>({});
  const abortController = useRef<AbortController>();

  // Memoize fetch function to prevent unnecessary re-renders
  const fetchEventCounts = useCallback(async (eventId: string) => {
    try {
      const response = await fetch(`/api/events/${eventId}/counts`, {
        signal: abortController.current?.signal
      });
      return await response.json();
    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'AbortError') return null;
      console.error('Error fetching event counts:', error);
      return null;
    }
  }, []);

  // Batch fetch event counts to reduce API calls
  const batchFetchEventCounts = useCallback(async (events: Event[]) => {
    const batchSize = 5;
    const results = [];
    
    for (let i = 0; i < events.length; i += batchSize) {
      const batch = events.slice(i, i + batchSize);
      const promises = batch.map(event => fetchEventCounts(event._id));
      const batchResults = await Promise.all(promises);
      results.push(...batchResults);
    }
    
    return results;
  }, [fetchEventCounts]);

  useEffect(() => {
    const fetchEvents = async () => {
      if (abortController.current) {
        abortController.current.abort();
      }
      abortController.current = new AbortController();
      
      setIsLoading(true);
      try {
        const country = user?.publicMetadata.country as string | undefined;
        const cacheKey = country || 'default';
        
        // Check cache first
        if (eventsCache.current[cacheKey]) {
          setEvents(eventsCache.current[cacheKey]);
          setIsLoading(false);
          return;
        }

        const response = await fetch(
          `/api/events${country ? `?country=${country}` : ''}`,
          { signal: abortController.current.signal }
        );
        const result = await response.json();

        if (Array.isArray(result.data)) {
          const sortedEvents = result.data.sort((a: Event, b: Event) => 
            new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime()
          );

          // Batch fetch counts for all events
          const countsData = await batchFetchEventCounts(sortedEvents);
          
          const eventsWithCounts = sortedEvents.map((event: Event, index: number) => ({
            ...event,
            totalRegistrations: countsData[index]?.totalRegistrations ?? 0,
            attendedUsers: countsData[index]?.attendedUsers ?? 0,
            cannotReciteAndWalk: countsData[index]?.cannotReciteAndWalk ?? 0
          }));

          // Update cache
          eventsCache.current[cacheKey] = eventsWithCounts;
          setEvents(eventsWithCounts);
        } else {
          console.error('Fetched data is not an array:', result);
          setEvents([]);
        }
      } catch (error: unknown) {
        if (error instanceof Error && error.name !== 'AbortError') {
          console.error('Error fetching events:', error);
          setEvents([]);
        }
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchEvents();
    }

    return () => {
      abortController.current?.abort();
    };
  }, [user, batchFetchEventCounts]);

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
      <h2 className="text-2xl font-bold mb-4">Select an Event</h2>
      {isLoading ? (
        <div className="flex items-center justify-center p-4">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          <span>Loading events...</span>
        </div>
      ) : (
        <Select onValueChange={(value) => onEventSelect(events.find(e => e._id === value)!)}>
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
            </ScrollArea>
          </SelectContent>
        </Select>
      )}
    </div>
  );
};

export default EventSelector;
