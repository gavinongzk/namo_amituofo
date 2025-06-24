"use client"

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { setCookie, getCookie } from 'cookies-next';
import { getUserIpAddress } from '@/lib/utils';
import { REGIONS, Region } from '@/types';

const regionFlags: { [key: string]: string } = {
  'Singapore': '🇸🇬',
  'Malaysia-JB': '🇲🇾',
  'Malaysia-KL': '🇲🇾',
};

const RegionSelector = () => {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const [region, setRegion] = useState<string>('Singapore'); // Default to Singapore

  useEffect(() => {
    const detectRegion = async () => {
      try {
        // First, check cookie
        const cookieRegion = getCookie('userRegion') as string | undefined;
        if (cookieRegion && regionFlags[cookieRegion]) {
          setRegion(cookieRegion);
          return;
        }

        // If cookie fails, check localStorage
        const storedRegion = localStorage.getItem('userRegion');
        if (storedRegion && regionFlags[storedRegion]) {
          setRegion(storedRegion);
          return;
        }

        // If localStorage fails, check Clerk's publicMetadata
        if (isLoaded && user && user.publicMetadata.region) {
          const clerkRegion = user.publicMetadata.region as string;
          if (regionFlags[clerkRegion]) {
            setRegion(clerkRegion);
            try {
              setCookie('userRegion', clerkRegion);
              localStorage.setItem('userRegion', clerkRegion);
            } catch (error) {
              console.error('Error setting cookie or localStorage:', error);
            }
            return;
          }
        }

        // Try IP-based country detection (default to regions)
        const ipAddress = await getUserIpAddress();
        if (ipAddress) {
          const response = await fetch(`https://get.geojs.io/v1/ip/country.json?ip=${ipAddress}`);
          const data = await response.json();
          
          let detectedRegion: string | null = null;
          if (data.country === 'SG') {
            detectedRegion = 'Singapore';
          } else if (data.country === 'MY') {
            // For Malaysia, default to KL but let user choose
            detectedRegion = 'Malaysia-KL';
          }

          if (detectedRegion) {
            setRegion(detectedRegion);
            try {
              setCookie('userRegion', detectedRegion);
              localStorage.setItem('userRegion', detectedRegion);
            } catch (error) {
              console.error('Error setting cookie or localStorage:', error);
            }
            return;
          }
        }

        // Fallback to Singapore if all detection methods fail
        console.log('All region detection methods failed, falling back to Singapore');
        setRegion('Singapore');
        try {
          setCookie('userRegion', 'Singapore');
          localStorage.setItem('userRegion', 'Singapore');
        } catch (error) {
          console.error('Error setting cookie or localStorage:', error);
        }
      } catch (error) {
        // Fallback to Singapore if any error occurs
        console.error('Error detecting region:', error);
        console.log('Error in region detection, falling back to Singapore');
        setRegion('Singapore');
        try {
          setCookie('userRegion', 'Singapore');
          localStorage.setItem('userRegion', 'Singapore');
        } catch (storageError) {
          console.error('Error setting cookie or localStorage:', storageError);
        }
      }
    };

    detectRegion();
  }, [isLoaded, user]);

  const changeRegion = async (newRegion: string) => {
    setRegion(newRegion);
    try {
      // Update local storage and cookie
      localStorage.setItem('userRegion', newRegion);
      setCookie('userRegion', newRegion);

      // Invalidate cache by making a request to the API with cache busting
      await fetch(`/api/events?region=${newRegion}&bustCache=true&_=${Date.now()}`);

      // Use router.refresh() instead of window.location.reload()
      // This will trigger a soft refresh of the page's dynamic content
      router.refresh();
    } catch (error) {
      console.error('Error setting region preference:', error);
    }
  };

  return (
    <div className="region-selector">
      <Select value={region} onValueChange={changeRegion}>
        <SelectTrigger className="w-[48px] h-[48px] p-0 border-none bg-transparent hover:bg-transparent focus:ring-0 focus:ring-offset-0">
          <SelectValue>
            <span className="text-3xl">{regionFlags[region]}</span>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {Object.entries(REGIONS).map(([regionKey, regionLabel]) => (
            <SelectItem key={regionKey} value={regionKey}>
              <div className="flex items-center">
                <span className="text-2xl mr-2">{regionFlags[regionKey]}</span>
                {regionLabel}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default RegionSelector;