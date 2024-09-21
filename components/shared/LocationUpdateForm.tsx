'use client'

import { useState } from 'react'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

const LocationUpdateForm = ({ userId }: { userId: string }) => {
  const [customLocation, setCustomLocation] = useState('');
  const [message, setMessage] = useState('');

  const handleLocationUpdate = async () => {
    try {
      const response = await fetch('/api/users/update-location', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, customLocation }),
      });

      if (response.ok) {
        setMessage('Location updated successfully');
      } else {
        setMessage('Failed to update location');
      }
    } catch (error) {
      console.error('Error updating location:', error);
      setMessage('Error updating location');
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <Input
        type="text"
        placeholder="Enter custom location"
        value={customLocation}
        onChange={(e) => setCustomLocation(e.target.value)}
        className="w-full max-w-xs"
      />
      <Button onClick={handleLocationUpdate} className="w-fit">
        Update Location
      </Button>
      {message && <p className="text-sm text-gray-600">{message}</p>}
    </div>
  );
};

export default LocationUpdateForm;
