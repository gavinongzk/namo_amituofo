import React, { useState } from 'react';
import { formatBilingualDateTime } from '@/lib/utils';
import { Pencil } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { getCategoryColor } from '@/lib/utils/colorUtils';

interface AttendanceDetailsCardProps {
  event: {
    _id: string;
    title: string;
    startDateTime: string;
    endDateTime: string;
    location: string;
    category: {
      name: string;
      color?: string;
    };
    maxSeats: number;
  };
  totalRegistrations: number;
  attendedUsersCount: number;
  cannotReciteAndWalkCount: number;
  cancelledUsersCount: number;
  isSuperAdmin?: boolean;
  onUpdateMaxSeats?: (newMaxSeats: number) => Promise<void>;
}

const AttendanceDetailsCard: React.FC<AttendanceDetailsCardProps> = ({ 
  event, 
  totalRegistrations, 
  attendedUsersCount, 
  cannotReciteAndWalkCount, 
  cancelledUsersCount,
  isSuperAdmin,
  onUpdateMaxSeats
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [maxSeats, setMaxSeats] = useState(event.maxSeats);
  const [isUpdating, setIsUpdating] = useState(false);

  // Get category color
  const categoryColor = event.category.color 
    ? event.category.color 
    : getCategoryColor(event.category.name);
    
  // Safely extract background and text colors
  const colorParts = categoryColor.split(' ');
  const bgColor = colorParts[0] || 'bg-gray-200';
  const textColor = colorParts[1] || 'text-gray-700';

  const handleSave = async () => {
    if (onUpdateMaxSeats) {
      setIsUpdating(true);
      try {
        await onUpdateMaxSeats(maxSeats);
        setIsEditing(false);
      } catch (error) {
        console.error('Failed to update max seats:', error);
      } finally {
        setIsUpdating(false);
      }
    }
  };

  return (
    <div className="bg-white shadow-lg rounded-lg overflow-hidden">
      <div className="bg-gradient-to-r from-primary-500 to-primary-600 px-6 py-4">
        <h2 className="text-2xl font-bold text-white">{event.title}</h2>
      </div>
      <div className="p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Date 日期</p>
            <p className="font-semibold">{formatBilingualDateTime(new Date(event.startDateTime)).combined.dateOnly}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Time 时间</p>
            <p className="font-semibold">
              {formatBilingualDateTime(new Date(event.startDateTime)).combined.timeOnly} - {formatBilingualDateTime(new Date(event.endDateTime)).combined.timeOnly}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Location 地点</p>
            <p className="font-semibold">{event.location}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Category 类别</p>
            <p className={`font-semibold ${textColor}`}>
              {event.category.name}
            </p>
          </div>
        </div>
        <div className="border-t pt-4 mt-4">
          <div className="grid grid-cols-4 gap-4">
            <div className="relative">
              <p className="text-sm text-gray-600">Max Seats 最大座位数</p>
              <div className="flex items-center gap-2">
                {isEditing ? (
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={maxSeats}
                      onChange={(e) => setMaxSeats(Number(e.target.value))}
                      className="w-24"
                    />
                    <Button 
                      onClick={handleSave}
                      disabled={isUpdating}
                      size="sm"
                    >
                      {isUpdating ? 'Saving...' : 'Save'}
                    </Button>
                    <Button 
                      onClick={() => {
                        setIsEditing(false);
                        setMaxSeats(event.maxSeats);
                      }}
                      variant="outline"
                      size="sm"
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <>
                    <p className="font-semibold">{event.maxSeats}</p>
                    {isSuperAdmin && (
                      <button 
                        onClick={() => setIsEditing(true)}
                        className="ml-2 text-gray-500 hover:text-gray-700"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Registrations 总报名数</p>
              <p className="font-semibold">{totalRegistrations}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Attended Users 已出席用户</p>
              <p className="font-semibold">{attendedUsersCount}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Cannot Recite & Walk 不能绕佛</p>
              <p className="font-semibold">{cannotReciteAndWalkCount}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Cancelled Users 已取消用户</p>
              <p className="font-semibold">{cancelledUsersCount}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendanceDetailsCard;
