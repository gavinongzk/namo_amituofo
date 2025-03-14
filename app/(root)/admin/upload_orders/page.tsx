"use client"

import { useState } from 'react';
import UploadOrders from '@/components/shared/UploadOrders';
import EventSelector from '@/components/shared/EventSelector';
import { Event } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const UploadOrdersPage = () => {
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  const handleEventSelect = (event: Event) => {
    setSelectedEvent(event);
  };

  return (
    <div className="container mx-auto px-4 py-6 md:py-8">
      <h1 className="text-2xl md:text-3xl font-bold text-center mb-6 md:mb-8">
        <span className="block md:inline">上传订单</span>
        <span className="hidden md:inline"> / </span>
        <span className="block md:inline">Upload Orders</span>
      </h1>
      <div className="max-w-2xl mx-auto">
        <Card className="mb-6 md:mb-8 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg md:text-xl">
              <span className="block md:inline">选择活动</span>
              <span className="hidden md:inline"> / </span>
              <span className="block md:inline">Select an Event</span>
            </CardTitle>
            <CardDescription className="text-sm md:text-base">
              <span className="block md:inline">请先选择一个活动</span>
              <span className="hidden md:inline"> / </span>
              <span className="block md:inline">Please select an event first</span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <EventSelector onEventSelect={handleEventSelect} />
          </CardContent>
        </Card>

        {selectedEvent && (
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg md:text-xl">
                <span className="block md:inline">上传订单</span>
                <span className="hidden md:inline"> / </span>
                <span className="block md:inline">Upload Orders</span>
              </CardTitle>
              <CardDescription className="text-sm md:text-base">
                <span className="block md:inline">为 {selectedEvent.title} 上传订单</span>
                <span className="hidden md:inline"> / </span>
                <span className="block md:inline">Upload orders for {selectedEvent.title}</span>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <UploadOrders eventId={selectedEvent._id} />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default UploadOrdersPage;
