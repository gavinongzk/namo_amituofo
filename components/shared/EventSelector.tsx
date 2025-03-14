import React, { useState, useEffect, useMemo } from 'react';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Loader2 } from "lucide-react"
import { useUser } from '@clerk/nextjs';
import { Event } from '@/types';
import { formatBilingualDateTime } from '@/lib/utils';

type EventSelectorProps = {
  onEventSelect: (event: Event) => void;
};

const EventSelector: React.FC<EventSelectorProps> = ({ onEventSelect }) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useUser();

  useEffect(() => {
    const fetchEvents = async () => {
      setIsLoading(true);
      try {
        const country = user?.publicMetadata.country as string | undefined;
        const response = await fetch(`/api/events${country ? `?country=${country}` : ''}`);
        const result = await response.json();

        if (Array.isArray(result.data)) {
          const recentAndUpcomingEvents = await Promise.all(result.data
            .sort((a: Event, b: Event) => new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime())
            .map(async (event: Event) => {
              const countsResponse = await fetch(`/api/events/${event._id}/counts`);
              const countsData = await countsResponse.json();
              return {
                ...event,
                totalRegistrations: countsData.totalRegistrations,
                attendedUsers: countsData.attendedUsers,
                cannotReciteAndWalk: countsData.cannotReciteAndWalk
              };
            }));
          setEvents(recentAndUpcomingEvents);
        } else {
          console.error('Fetched data is not an array:', result);
          setEvents([]);
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
  }, [user]);

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
    <div className="mb-4 md:mb-6">
      <h2 className="text-xl md:text-2xl font-bold mb-3 md:mb-4">
        <span className="block md:inline">选择活动</span>
        <span className="hidden md:inline"> / </span>
        <span className="block md:inline">Select an Event</span>
      </h2>
      {isLoading ? (
        <div className="flex items-center justify-center p-4 border rounded-md bg-gray-50">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          <span className="text-sm md:text-base">
            <span className="md:inline">加载中...</span>
            <span className="hidden md:inline"> / </span>
            <span className="md:inline">Loading events...</span>
          </span>
        </div>
      ) : (
        <Select onValueChange={(value) => onEventSelect(events.find(e => e._id === value)!)}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="选择一个活动 / Select an event" />
          </SelectTrigger>
          <SelectContent>
            <ScrollArea className="h-[300px]">
              {Object.entries(groupedEvents).map(([category, categoryEvents]) => (
                <SelectGroup key={category}>
                  <SelectLabel className="bg-gray-100 px-2 py-1 rounded-md text-sm font-semibold mb-2">
                    {category}
                  </SelectLabel>
                  {categoryEvents.map((event) => (
                    <SelectItem key={event._id} value={event._id} className="py-3 px-2 cursor-pointer">
                      <div className="flex flex-col gap-1.5">
                        <span className="font-medium text-base">{event.title}</span>
                        <div className="flex items-center text-sm text-gray-500 gap-2">
                          <span>{formatBilingualDateTime(new Date(event.startDateTime)).combined.dateOnly}</span>
                          <span className="text-gray-400">|</span>
                          <span>{formatBilingualDateTime(new Date(event.startDateTime)).combined.timeOnly}</span>
                        </div>
                      </div>
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
