'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CalendarIcon, MapPinIcon, UsersIcon } from '@heroicons/react/24/outline'
import { formatBilingualDateTime } from '@/lib/utils';
import { ScrollArea } from "@/components/ui/scroll-area"
import { Loader2 } from "lucide-react"
import { isAfter, isBefore, parseISO } from 'date-fns';
import { EVENT_CONFIG } from '@/lib/config/event.config';

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
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      setIsLoading(true);
      try {
        const country = user?.publicMetadata.country as string | undefined;
        const role = user?.publicMetadata.role as string | undefined;
        const timestamp = new Date().getTime();
        const response = await fetch(`/api/events${country ? `?country=${country}` : ''}${role ? `&role=${role}` : ''}&bustCache=true&_=${timestamp}`);
        
        if (!response.ok) {
          console.error('Failed to fetch events:', response.status, response.statusText);
          const text = await response.text();
          console.error('Response text:', text);
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('Fetched events:', result);

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
          console.log('Processed events:', recentAndUpcomingEvents); // Add logging
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

  const groupEventsByCategory = (events: Event[]) => {
    const currentDate = new Date();
    const userRole = user?.publicMetadata?.role as string;
    const isSuperAdmin = userRole === 'superadmin';
    const expirationDate = EVENT_CONFIG.getExpirationDate(userRole);

    // Separate expired and active events
    const { expired, active } = events.reduce((acc, event) => {
      const endDate = parseISO(event.endDateTime);
      // For superadmins, only check if the event has ended
      const isExpired = isSuperAdmin 
        ? isBefore(endDate, currentDate)
        : isBefore(endDate, expirationDate) && isBefore(endDate, currentDate);
      
      if (isExpired) {
        acc.expired.push(event);
      } else {
        acc.active.push(event);
      }
      return acc;
    }, { expired: [] as Event[], active: [] as Event[] });

    // Sort active events by start date (ascending - upcoming first)
    const sortedActive = [...active].sort((a, b) => 
      new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime()
    );

    // Sort expired events by end date (descending - most recently expired first)
    const sortedExpired = [...expired].sort((a, b) => 
      new Date(b.endDateTime).getTime() - new Date(a.endDateTime).getTime()
    );

    // Group active events by category
    const groupedEvents: Record<string, Event[]> = {};

    // First add all active events
    sortedActive.forEach(event => {
      const category = event.category.name;
      if (!groupedEvents[category]) {
        groupedEvents[category] = [];
      }
      groupedEvents[category].push(event);
    });

    // Then add expired events at the end if user is superadmin
    if (isSuperAdmin && sortedExpired.length > 0) {
      groupedEvents['──────────────'] = []; // Add a separator
      groupedEvents['已过期活动 / Expired Events'] = sortedExpired;
    }

    return groupedEvents;
  };

  const groupedEvents = groupEventsByCategory(events);

  return (
    <div className="wrapper my-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card className="border-2 border-primary-100">
          <CardHeader>
            <CardTitle className="text-2xl text-primary-700">选择活动 Select Event</CardTitle>
            <CardDescription className="text-base">
              请从下列活动中选择一个进行管理 Please select an event to manage
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="mr-2 h-6 w-6 animate-spin text-primary-500" />
                <span className="text-lg text-primary-600">加载中... Loading...</span>
              </div>
            ) : (
              <Select onValueChange={handleSelectEvent} value={selectedEventId}>
                <SelectTrigger className="w-full h-[54px] text-base">
                  <SelectValue placeholder="选择一个活动 / Select an event" />
                </SelectTrigger>
                <SelectContent>
                  <ScrollArea className="h-[400px]">
                    {Object.entries(groupedEvents).map(([category, categoryEvents]) => (
                      <SelectGroup key={category}>
                        <SelectLabel className={`px-3 py-2 rounded-md text-base font-semibold mb-2 ${
                          category === '──────────────' 
                            ? 'text-gray-400 border-t border-b border-gray-200 my-2' 
                            : 'bg-primary-50 text-primary-700'
                        }`}>
                          {category}
                        </SelectLabel>
                        {categoryEvents.map((event) => (
                          <SelectItem 
                            key={event._id} 
                            value={event._id} 
                            className="py-4 px-3 cursor-pointer hover:bg-primary-50 focus:bg-primary-50 transition-colors duration-200"
                          >
                            <div className="flex flex-col gap-2">
                              <div className="flex items-start justify-between">
                                <span className="font-medium text-base text-gray-900">{event.title}</span>
                                <Badge variant="outline" className="ml-2 whitespace-nowrap">
                                  {event.category.name}
                                </Badge>
                              </div>
                              <div className="flex flex-wrap items-center text-sm text-gray-600 gap-2">
                                <div className="flex items-center gap-1">
                                  <CalendarIcon className="h-4 w-4 text-primary-400" />
                                  <span>{formatBilingualDateTime(new Date(event.startDateTime)).combined.dateOnly}</span>
                                </div>
                                <span className="text-gray-400">|</span>
                                <div className="flex items-center gap-1">
                                  <CalendarIcon className="h-4 w-4 text-primary-400" />
                                  <span>{formatBilingualDateTime(new Date(event.startDateTime)).combined.timeOnly}</span>
                                </div>
                                <span className="text-gray-400">|</span>
                                <div className="flex items-center gap-1">
                                  <UsersIcon className="h-4 w-4 text-primary-400" />
                                  <span>{event.totalRegistrations}/{event.maxSeats}</span>
                                </div>
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
          </CardContent>
        </Card>

        {selectedEvent ? (
          <Card className="mb-8 border-2 border-primary-100">
            <CardHeader className="bg-primary-50">
              <CardTitle className="text-2xl text-primary-700">{selectedEvent.title}</CardTitle>
              <CardDescription className="text-lg text-primary-600">
                {selectedEvent.category.name}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                <div className="space-y-4">
                  <div className="flex items-center bg-gray-50 p-3 rounded-lg">
                    <CalendarIcon className="h-5 w-5 mr-3 text-primary-500" />
                    <div>
                      <p className="text-sm text-gray-600">日期 Date</p>
                      <p className="text-base font-medium">{formatBilingualDateTime(new Date(selectedEvent.startDateTime)).combined.dateOnly}</p>
                    </div>
                  </div>
                  <div className="flex items-center bg-gray-50 p-3 rounded-lg">
                    <CalendarIcon className="h-5 w-5 mr-3 text-primary-500" />
                    <div>
                      <p className="text-sm text-gray-600">时间 Time</p>
                      <p className="text-base font-medium">
                        {formatBilingualDateTime(new Date(selectedEvent.startDateTime)).combined.timeOnly} - 
                        {formatBilingualDateTime(new Date(selectedEvent.endDateTime)).combined.timeOnly}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center bg-gray-50 p-3 rounded-lg">
                    <MapPinIcon className="h-5 w-5 mr-3 text-primary-500" />
                    <div>
                      <p className="text-sm text-gray-600">地点 Location</p>
                      <p className="text-base font-medium">{selectedEvent.location}</p>
                    </div>
                  </div>
                  <div className="flex items-center bg-gray-50 p-3 rounded-lg">
                    <UsersIcon className="h-5 w-5 mr-3 text-primary-500" />
                    <div>
                      <p className="text-sm text-gray-600">注册人数 Registrations</p>
                      <div className="flex items-center gap-4">
                        <p className="text-base font-medium">
                          已注册 Registered: {selectedEvent.totalRegistrations} / {selectedEvent.maxSeats}
                        </p>
                        <p className="text-base font-medium">
                          已出席 Attended: {selectedEvent.attendedUsers}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-wrap gap-2 bg-gray-50">
              <Badge variant="outline" className="text-sm bg-white">
                {selectedEvent.category.name}
              </Badge>
              <Badge variant="outline" className="text-sm bg-white">
                {new Date(selectedEvent.startDateTime) > new Date() ? '即将开始 Upcoming' : '进行中 Ongoing'}
              </Badge>
              {selectedEvent.cannotReciteAndWalk > 0 && (
                <Badge variant="outline" className="text-sm bg-white">
                  不能绕佛 Cannot Recite & Walk: {selectedEvent.cannotReciteAndWalk}
                </Badge>
              )}
            </CardFooter>
          </Card>
        ) : (
          <Card className="mb-8 text-center p-8 border-2 border-primary-100">
            <CardDescription className="text-lg text-primary-600">
              选择一个活动以查看详情 / Select an event to view its details
            </CardDescription>
          </Card>
        )}

        <Button 
          onClick={handleGoToAttendance} 
          disabled={!selectedEventId || isLoading}
          className="w-full text-lg py-6 bg-primary-500 hover:bg-primary-600 transition-colors duration-200"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              加载中... / Loading...
            </>
          ) : (
            <>
              <UsersIcon className="mr-2 h-5 w-5" />
              前往记录出席 / Go to Attendance
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default SelectEventPage;
