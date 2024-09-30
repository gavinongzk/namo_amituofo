'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CalendarIcon, MapPinIcon, UsersIcon } from '@heroicons/react/24/outline'
import { formatDateTime } from '@/lib/utils';

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
  registeredCount: number;
};

const SelectEventPage = () => {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  useEffect(() => {
    if (isLoaded && user) {
      const role = user.publicMetadata.role as string;
      if (role !== 'admin' && role !== 'superadmin') {
        router.push('/');
      }
    }
  }, [isLoaded, user, router]);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const timestamp = new Date().getTime();
        const response = await fetch(`/api/events?t=${timestamp}`);
        const result = await response.json();

        if (Array.isArray(result.data)) {
          const currentDate = new Date();
          const upcomingEvents = result.data
            .filter((event: Event) => new Date(event.endDateTime) >= currentDate)
            .sort((a: Event, b: Event) => new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime());
          setEvents(upcomingEvents);
        } else {
          console.error('Fetched data is not an array:', result);
          setEvents([]);
        }
      } catch (error) {
        console.error('Error fetching events:', error);
        setEvents([]);
      }
    };

    fetchEvents();
  }, []);

  const handleSelectEvent = (eventId: string) => {
    setSelectedEventId(eventId);
    const event = events.find(e => e._id === eventId);
    setSelectedEvent(event || null);
  };

  const handleGoToAttendance = () => {
    if (selectedEventId) {
      router.push(`/admin/attendance?eventId=${selectedEventId}`);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-center mb-8">Select an Event for Attendance</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <Select onValueChange={handleSelectEvent} value={selectedEventId}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select an event" />
            </SelectTrigger>
            <SelectContent>
              {events.map((event) => (
                <SelectItem key={event._id} value={event._id}>
                  {event.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          {selectedEvent && (
            <Card>
              <CardHeader>
                <CardTitle>{selectedEvent.title}</CardTitle>
                <CardDescription>{selectedEvent.category.name}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center">
                    <CalendarIcon className="h-5 w-5 mr-2" />
                    <span>{formatDateTime(new Date(selectedEvent.startDateTime)).dateOnly}</span>
                  </div>
                  <div className="flex items-center">
                    <CalendarIcon className="h-5 w-5 mr-2" />
                    <span>
                      {formatDateTime(new Date(selectedEvent.startDateTime)).timeOnly} - 
                      {formatDateTime(new Date(selectedEvent.endDateTime)).timeOnly}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <MapPinIcon className="h-5 w-5 mr-2" />
                    <span>{selectedEvent.location}</span>
                  </div>
                  <div className="flex items-center">
                    <UsersIcon className="h-5 w-5 mr-2" />
                    <span>{selectedEvent.registeredCount} / {selectedEvent.maxSeats} registered</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Badge variant="outline" className="mr-2">
                  {selectedEvent.category.name}
                </Badge>
                <Badge variant="outline">
                  {new Date(selectedEvent.startDateTime) > new Date() ? 'Upcoming' : 'Ongoing'}
                </Badge>
              </CardFooter>
            </Card>
          )}
        </div>
      </div>
      <div className="mt-8 flex justify-center">
        <Button 
          onClick={handleGoToAttendance} 
          disabled={!selectedEventId}
          className="w-full max-w-md"
        >
          Go to Attendance
        </Button>
      </div>
    </div>
  );
};

export default SelectEventPage;