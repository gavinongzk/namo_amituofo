import React, { useState, useEffect, useMemo } from 'react';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Loader2, MapPin, Calendar, Clock } from "lucide-react"
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

  // Group events by category and status (upcoming, expired)
  const groupedEvents = useMemo(() => {
    const now = new Date();
    const upcomingEvents: Record<string, Event[]> = {};
    const expiredEvents: Event[] = [];

    events.forEach(event => {
      const eventStartDate = new Date(event.startDateTime);
      
      if (eventStartDate < now) {
        expiredEvents.push(event);
      } else {
        const category = event.category.name;
        if (!upcomingEvents[category]) {
          upcomingEvents[category] = [];
        }
        upcomingEvents[category].push(event);
      }
    });

    return { upcomingEvents, expiredEvents };
  }, [events]);

  // Get event status
  const getEventStatus = (event: Event) => {
    const now = new Date();
    const startDate = new Date(event.startDateTime);
    const endDate = new Date(event.endDateTime);
    
    if (now > endDate) {
      return { label: "已过期 / Expired", color: "text-gray-500" };
    } else if (now >= startDate && now <= endDate) {
      return { label: "进行中 / Ongoing", color: "text-green-600" };
    } else {
      return { label: "即将到来 / Upcoming", color: "text-blue-600" };
    }
  };

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
          <SelectTrigger className="w-full bg-white border-gray-300 hover:bg-gray-50 transition-colors">
            <SelectValue placeholder="选择一个活动 / Select an event" />
          </SelectTrigger>
          <SelectContent className="max-h-[400px] overflow-hidden">
            <ScrollArea className="h-[400px]">
              {/* Upcoming Events */}
              {Object.entries(groupedEvents.upcomingEvents).map(([category, categoryEvents]) => (
                <SelectGroup key={category}>
                  <SelectLabel className="bg-gray-100 px-3 py-2 rounded-md text-sm font-semibold mb-2 sticky top-0 z-10">
                    {category}
                  </SelectLabel>
                  {categoryEvents.map((event) => {
                    const status = getEventStatus(event);
                    return (
                      <SelectItem 
                        key={event._id} 
                        value={event._id} 
                        className="py-3 px-3 cursor-pointer hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                      >
                        <div className="flex flex-col gap-2 w-full">
                          <div className="flex justify-between items-start w-full">
                            <span className="font-medium text-base pt-0">{event.title}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${status.color} bg-opacity-10`}>
                              {status.label}
                            </span>
                          </div>
                          
                          <div className="flex flex-col text-sm text-gray-600 gap-1">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="h-3.5 w-3.5 text-gray-500" />
                              <span>{formatBilingualDateTime(new Date(event.startDateTime)).combined.dateOnly}</span>
                            </div>
                            
                            <div className="flex items-center gap-1.5">
                              <Clock className="h-3.5 w-3.5 text-gray-500" />
                              <span>
                                {formatBilingualDateTime(new Date(event.startDateTime)).combined.timeOnly} - 
                                {formatBilingualDateTime(new Date(event.endDateTime)).combined.timeOnly}
                              </span>
                            </div>
                            
                            {event.location && (
                              <div className="flex items-center gap-1.5">
                                <MapPin className="h-3.5 w-3.5 text-gray-500" />
                                <span className="truncate">{event.location}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectGroup>
              ))}
              
              {/* Expired Events */}
              {groupedEvents.expiredEvents.length > 0 && (
                <SelectGroup>
                  <SelectLabel className="bg-gray-100 px-3 py-2 rounded-md text-sm font-semibold mb-2 sticky top-0 z-10 mt-2">
                    已过期活动 / Expired Events
                  </SelectLabel>
                  {groupedEvents.expiredEvents
                    .sort((a, b) => new Date(b.startDateTime).getTime() - new Date(a.startDateTime).getTime()) // Sort by most recent first
                    .map((event) => (
                      <SelectItem 
                        key={event._id} 
                        value={event._id} 
                        className="py-3 px-3 cursor-pointer hover:bg-gray-50 border-b border-gray-100 last:border-b-0 opacity-75"
                      >
                        <div className="flex flex-col gap-2 w-full">
                          <div className="flex justify-between items-start w-full">
                            <span className="font-medium text-base text-gray-600 pt-0">{event.title}</span>
                            <span className="text-xs px-2 py-0.5 rounded-full text-gray-500 bg-gray-100">
                              已过期 / Expired
                            </span>
                          </div>
                          
                          <div className="flex flex-col text-sm text-gray-500 gap-1">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="h-3.5 w-3.5 text-gray-400" />
                              <span>{formatBilingualDateTime(new Date(event.startDateTime)).combined.dateOnly}</span>
                            </div>
                            
                            <div className="flex items-center gap-1.5">
                              <Clock className="h-3.5 w-3.5 text-gray-400" />
                              <span>
                                {formatBilingualDateTime(new Date(event.startDateTime)).combined.timeOnly} - 
                                {formatBilingualDateTime(new Date(event.endDateTime)).combined.timeOnly}
                              </span>
                            </div>
                            
                            {event.location && (
                              <div className="flex items-center gap-1.5">
                                <MapPin className="h-3.5 w-3.5 text-gray-400" />
                                <span className="truncate">{event.location}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                </SelectGroup>
              )}
            </ScrollArea>
          </SelectContent>
        </Select>
      )}
    </div>
  );
};

export default EventSelector;
