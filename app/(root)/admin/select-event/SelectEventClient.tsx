'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, MapPinIcon, UsersIcon } from '@heroicons/react/24/outline';
import { formatDateTime } from '@/lib/utils';
import { Loader2 } from "lucide-react";
import EventSelector from '@/components/shared/EventSelector';
import { Event } from '@/types';

export default function SelectEventClient() {
  const { user } = useUser();
  const router = useRouter();
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSelectEvent = (event: Event) => {
    setSelectedEvent(event);
  };

  const handleGoToAttendance = () => {
    if (selectedEvent?._id) {
      router.push(`/admin/attendance?eventId=${selectedEvent._id}`);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-center mb-8">Select an Event for Attendance</h1>
      <div className="max-w-2xl mx-auto">
        <EventSelector onEventSelect={handleSelectEvent} />

        {selectedEvent ? (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-2xl">{selectedEvent.title}</CardTitle>
              <CardDescription className="text-lg">{selectedEvent.category.name}</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Event details content */}
              <div className="space-y-4">
                <div className="flex items-center">
                  <CalendarIcon className="h-5 w-5 mr-2 text-gray-500" />
                  <span className="text-lg">{formatDateTime(new Date(selectedEvent.startDateTime)).dateOnly}</span>
                </div>
                {/* ... other event details ... */}
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
          disabled={!selectedEvent || isLoading}
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
} 