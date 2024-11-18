'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CalendarIcon, MapPinIcon, UsersIcon } from '@heroicons/react/24/outline'
import { formatDateTime } from '@/lib/utils';
import { ScrollArea } from "@/components/ui/scroll-area"
import { Loader2 } from "lucide-react"
import { addDays, isAfter, parseISO } from 'date-fns';
import useSWR from 'swr';

type Event = {
  _id: string;
  title: string;
  startDateTime: string;
  endDateTime: string;
  location: string;
  category: {
    name: string;
  };
  maxSeats: number;
  totalRegistrations: number;
  attendedUsers: number;
  cannotReciteAndWalk: number;
};

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch');
  return res.json();
};

const SelectEventPage = () => {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [selectedEventId, setSelectedEventId] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);

  const country = user?.publicMetadata.country as string | undefined;
  const { data: eventsData, error } = useSWR(
    isLoaded && user ? `/api/events${country ? `?country=${country}` : ''}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 60000,
      suspense: true,
      keepPreviousData: true,
      onSuccess: () => setIsLoadingEvents(false),
      onError: () => setIsLoadingEvents(false)
    }
  );

  const { data: eventCounts } = useSWR(
    selectedEventId ? `/api/events/${selectedEventId}/counts` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  const events = useMemo(() => {
    if (!eventsData?.data) return [];
    
    const currentDate = new Date();
    const fiveDaysAgo = addDays(currentDate, -5);
    
    return eventsData.data
      .filter((event: Event) => {
        if (user?.publicMetadata?.role === 'superadmin') return true;
        const endDate = parseISO(event.endDateTime);
        return isAfter(endDate, fiveDaysAgo) || isAfter(endDate, currentDate);
      })
      .sort((a: Event, b: Event) => 
        new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime()
      );
  }, [eventsData, user]);

  const handleSelectEvent = (eventId: string) => {
    setSelectedEventId(eventId);
    const event = events.find((e: Event) => e._id === eventId);
    setSelectedEvent(event || null);
  };

  const handleGoToAttendance = () => {
    if (selectedEventId) {
      router.push(`/admin/attendance?eventId=${selectedEventId}`);
    }
  };

  const groupEventsByCategory = (events: Event[]) => {
    return events.reduce((acc, event) => {
      const category = event.category.name;
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(event);
      return acc;
    }, {} as Record<string, Event[]>);
  };

  const groupedEvents = groupEventsByCategory(events);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-center mb-8">Select an Event for Attendance</h1>
      <div className="max-w-2xl mx-auto">
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-xl">Choose an Event</CardTitle>
            <CardDescription>Select an event to view details and manage attendance</CardDescription>
          </CardHeader>
          <CardContent>
            <Select onValueChange={handleSelectEvent} value={selectedEventId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={
                  isLoadingEvents ? "Loading events..." : "Select an event"
                } />
              </SelectTrigger>
              <SelectContent>
                <ScrollArea className="h-[300px]">
                  {isLoadingEvents ? (
                    <div className="flex items-center justify-center p-4">
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      <span>Loading events...</span>
                    </div>
                  ) : (
                    Object.entries(groupedEvents).map(([category, categoryEvents]) => (
                      <SelectGroup key={category}>
                        <SelectLabel className="bg-gray-100 px-2 py-1 rounded-md text-sm font-semibold mb-2">
                          {category}
                        </SelectLabel>
                        {categoryEvents.map((event) => (
                          <SelectItem key={event._id} value={event._id} className="py-2">
                            <div className="flex flex-col">
                              <span className="font-medium">{event.title}</span>
                              <span className="text-sm text-gray-500">
                                {formatDateTime(new Date(event.startDateTime)).dateOnly} | 
                                {formatDateTime(new Date(event.startDateTime)).timeOnly}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    ))
                  )}
                </ScrollArea>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {selectedEvent ? (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-2xl">{selectedEvent.title}</CardTitle>
              <CardDescription className="text-lg">{selectedEvent.category.name}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center">
                  <CalendarIcon className="h-5 w-5 mr-2 text-gray-500" />
                  <span className="text-lg">{formatDateTime(new Date(selectedEvent.startDateTime)).dateOnly}</span>
                </div>
                <div className="flex items-center">
                  <CalendarIcon className="h-5 w-5 mr-2 text-gray-500" />
                  <span className="text-lg">
                    {formatDateTime(new Date(selectedEvent.startDateTime)).timeOnly} - 
                    {formatDateTime(new Date(selectedEvent.endDateTime)).timeOnly}
                  </span>
                </div>
                <div className="flex items-center">
                  <MapPinIcon className="h-5 w-5 mr-2 text-gray-500" />
                  <span className="text-lg">{selectedEvent.location}</span>
                </div>
                <div className="flex items-center">
                  <UsersIcon className="h-5 w-5 mr-2 text-gray-500" />
                  <span className="text-lg">
                    {selectedEvent.totalRegistrations} / {selectedEvent.maxSeats} registered
                  </span>
                </div>
                <div className="flex items-center">
                  <UsersIcon className="h-5 w-5 mr-2 text-gray-500" />
                  <span className="text-lg">
                    {selectedEvent.attendedUsers} attended
                  </span>
                </div>
                <div className="flex items-center">
                  <UsersIcon className="h-5 w-5 mr-2 text-gray-500" />
                  <span className="text-lg">
                    {selectedEvent.cannotReciteAndWalk} cannot recite and walk
                  </span>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Badge variant="outline" className="mr-2 text-sm">
                {selectedEvent.category.name}
              </Badge>
              <Badge variant="outline" className="text-sm">
                {new Date(selectedEvent.startDateTime) > new Date() ? 'Upcoming' : 'Ongoing'}
              </Badge>
            </CardFooter>
          </Card>
        ) : (
          <Card className="mb-8 text-center p-8">
            <CardDescription>Select an event to view its details</CardDescription>
          </Card>
        )}

        <Button 
          onClick={handleGoToAttendance} 
          disabled={!selectedEventId}
          className="w-full text-lg py-6"
        >
          {selectedEventId ? (
            'Go to Attendance'
          ) : (
            'Select an event to go to attendance'
          )}
        </Button>
      </div>
    </div>
  );
};

export default SelectEventPage;
