'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import Collection from '@/components/shared/Collection';
import { Button } from '@/components/ui/button';
import { Loader2 } from "lucide-react";
import Link from 'next/link';
import { IEvent } from '@/lib/database/models/event.model';

const MyEventsPage = () => {
  const { user } = useUser();
  const [events, setEvents] = useState<IEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const fetchMyEvents = async () => {
      if (!user?.publicMetadata?.userId) return;

      setIsLoading(true);
      try {
        const response = await fetch(`/api/users/${user.publicMetadata.userId}/events?page=${page}`);
        const data = await response.json();

        if (response.ok) {
          setEvents(data.data);
          setTotalPages(data.totalPages);
        } else {
          console.error('Failed to fetch events:', data);
        }
      } catch (error) {
        console.error('Error fetching events:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMyEvents();
  }, [user, page]);

  return (
    <div className="wrapper my-8 min-h-screen">
      <div className="flex flex-col gap-8">
        <div className="flex items-center justify-between">
          <h1 className="h2-bold">My Events</h1>
          <Link href="/events/create">
            <Button>Create New Event</Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <Collection
            data={events}
            emptyTitle="No events created yet"
            emptyStateSubtext="Start by creating your first event"
            page={page}
            totalPages={totalPages}
            limit={10}
            collectionType="Events_Organized"
          />
        )}
      </div>
    </div>
  );
};

export default MyEventsPage; 