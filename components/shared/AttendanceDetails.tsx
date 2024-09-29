import React from 'react';
import { formatDateTime } from '@/lib/utils';

type AttendanceDetailsCardProps = {
  event: {
    title: string;
    startDateTime: string;
    endDateTime: string;
    location: string;
    category: {
      name: string;
    };
    maxSeats: number;
  };
  totalRegistrations: number;
  attendedUsersCount: number;
};

const AttendanceDetailsCard: React.FC<AttendanceDetailsCardProps> = ({ event, totalRegistrations, attendedUsersCount }) => {
  return (
    <div className="bg-white shadow-lg rounded-lg overflow-hidden">
      <div className="bg-gradient-to-r from-primary-500 to-primary-600 px-6 py-4">
        <h2 className="text-2xl font-bold text-white">{event.title}</h2>
      </div>
      <div className="p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Date 日期</p>
            <p className="font-semibold">{formatDateTime(new Date(event.startDateTime)).dateOnly}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Time 时间</p>
            <p className="font-semibold">
              {formatDateTime(new Date(event.startDateTime)).timeOnly} - {formatDateTime(new Date(event.endDateTime)).timeOnly}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Location 地点</p>
            <p className="font-semibold">{event.location}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Category 类别</p>
            <p className="font-semibold">{event.category.name}</p>
          </div>
        </div>
        <div className="border-t pt-4 mt-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-600">Max Seats 最大座位数</p>
              <p className="font-semibold">{event.maxSeats}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Registrations 总注册</p>
              <p className="font-semibold">{totalRegistrations}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Attended Users 已出席用户</p>
              <p className="font-semibold">{attendedUsersCount}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendanceDetailsCard;
