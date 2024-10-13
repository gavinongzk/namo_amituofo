import React, { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

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
};

type EventSelectorProps = {
  onEventSelect: (event: Event) => void;
};

const EventSelector: React.FC<EventSelectorProps> = ({ onEventSelect }) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/events');
        const data = await response.json();
        setEvents(data.data);
      } catch (error) {
        console.error('Error fetching events:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvents();
  }, []);

  return (
    <div className="mb-6">
      <h2 className="text-2xl font-bold mb-4">Select an Event</h2>
      {isLoading ? (
        <p>Loading events...</p>
      ) : (
        <Select onValueChange={(value) => onEventSelect(events.find(e => e._id === value)!)}>
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
      )}
    </div>
  );
};

export default EventSelector;

