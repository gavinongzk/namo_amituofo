'use client';

import { useEffect, useState } from 'react';
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
import { addDays, isAfter, isBefore, parseISO } from 'date-fns';

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

const SelectEventPage = () => {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Add loading state

  useEffect(() => {
    const fetchEvents = async () => {
      setIsLoading(true);
      try {
        const country = user?.publicMetadata.country as string | undefined;
        const response = await fetch(`/api/events${country ? `?country=${country}` : ''}`);
        const result = await response.json();

        if (Array.isArray(result.data)) {
          const currentDate = new Date();
          const fiveDaysAgo = addDays(currentDate, -5);
          const recentAndUpcomingEvents = await Promise.all(result.data
            .filter((event: Event) => {
              if (user?.publicMetadata?.role === 'superadmin') return true;
              const endDate = parseISO(event.endDateTime);
              return isAfter(endDate, fiveDaysAgo) || isAfter(endDate, currentDate);
            })
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

    if (isLoaded && user) {
      fetchEvents();
    }
  }, [isLoaded, user]);

  const handleSelectEvent = (eventId: string) => {
    setSelectedEventId(eventId);
    const event = events.find(e => e._id === eventId);
    console.log('Selected Event:', event);
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
            {isLoading ? (
              <div className="flex items-center justify-center p-4">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                <span>Loading events...</span>
              </div>
            ) : (
              <Select onValueChange={handleSelectEvent} value={selectedEventId}>
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
                    ))}
                  </ScrollArea>
                </SelectContent>
              </Select>
            )}
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
          disabled={!selectedEventId || isLoading}
          className="w-full text-lg py-6"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading...
            </>
          ) : (
            'Go to Attendance'
          )}
        </Button>
      </div>
    </div>
  );
};

export default SelectEventPage;
