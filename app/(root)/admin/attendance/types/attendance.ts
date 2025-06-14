export type EventRegistration = {
  id: string;
  eventTitle: string;
  eventStartDateTime: string;
  eventEndDateTime: string;
  order: {
    _id: string;
    customFieldValues: {
      groupId: string;
      queueNumber: string;
      attendance: boolean;
      fields: {
        id: string;
        label: string;
        type: string;
        value: string;
      }[];
      __v: number;
      cancelled: boolean;
    }[];
  };
};

export type Event = {
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

export interface AttendanceItem {
  registrationId: string;
  groupId: string;
  queueNumber: string;
  name: string;
  phoneNumber: string;
  isDuplicate: boolean;
  cannotWalk: boolean | undefined;
  attendance: boolean;
  cancelled: boolean;
  remarks: string;
  postalCode: string;
}

export interface SortConfig {
  key: keyof AttendanceItem;
  direction: 'asc' | 'desc';
}

export interface AttendanceStats {
  totalRegistrations: number;
  attendedUsersCount: number;
  cannotReciteAndWalkCount: number;
  cancelledUsersCount: number;
}

export interface ConfirmationData {
  registrationId: string;
  groupId: string;
  queueNumber: string;
  currentAttendance: boolean;
  name: string;
}

export interface DeleteConfirmationData {
  registrationId: string;
  groupId: string;
  queueNumber: string;
}

export type ModalType = 'loading' | 'success' | 'error'; 