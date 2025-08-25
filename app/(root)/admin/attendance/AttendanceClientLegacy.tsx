'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Modal from '@/components/ui/modal';
import { useUser } from "@clerk/nextjs";
import { Checkbox } from '@/components/ui/checkbox';
import Image from 'next/image';
import AttendanceDetailsCard from '@/components/shared/AttendanceDetails';
import { isEqual } from 'lodash';
import { Loader2 } from 'lucide-react';
import QrCodeScanner from '@/components/shared/QrCodeScanner';
import DownloadCsvButton from '@/components/shared/DownloadCsvButton';
import { cn, prepareRegistrationIdentifiers } from "@/lib/utils";
import QrCodeWithLogo from '@/components/shared/QrCodeWithLogo';
import FloatingNavigation from '@/components/shared/FloatingNavigation';
import crypto from 'crypto';

// This is the legacy version - kept for backup
// The content is exactly the same as your current AttendanceClient.tsx

type EventRegistration = {
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

function useDeepCompareMemo<T>(factory: () => T, dependencies: React.DependencyList) {
  const ref = useRef<{ deps: React.DependencyList; obj: T; initialized: boolean }>({
    deps: dependencies,
    obj: undefined as unknown as T,
    initialized: false,
  });

  if (ref.current.initialized === false || !isEqual(dependencies, ref.current.deps)) {
    ref.current.deps = dependencies;
    ref.current.obj = factory();
    ref.current.initialized = true;
  }

  return ref.current.obj;
}

interface AttendanceItem {
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

interface SortConfig {
  key: keyof AttendanceItem;
  direction: 'asc' | 'desc';
}

const AttendanceClientLegacy = React.memo(function AttendanceClientLegacy({ event }: { event: Event }) {
  // All your existing code goes here...
  // This is just a placeholder - copy all the content from your current AttendanceClient.tsx
  
  return (
    <div className="wrapper my-8">
      <p className="text-red-500 font-bold">Legacy AttendanceClient - Copy your existing code here</p>
    </div>
  );
});

export default AttendanceClientLegacy; 