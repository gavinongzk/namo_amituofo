"use client"

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { setCookie, getCookie } from 'cookies-next';
import { getUserIpAddress } from '@/lib/utils';

const countryFlags: { [key: string]: string } = {
  'Singapore': '🇸🇬',
  'Malaysia': '🇲🇾',
};

const CountrySelector = () => {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const [country, setCountry] = useState<string>('Singapore'); // Default to Singapore

  useEffect(() => {
    const detectCountry = async () => {
      try {
        // First, check cookie
        const cookieCountry = getCookie('userCountry') as string | undefined;
        if (cookieCountry && countryFlags[cookieCountry]) {
          setCountry(cookieCountry);
          return;
        }

        // If cookie fails, check localStorage
        const storedCountry = localStorage.getItem('userCountry');
        if (storedCountry && countryFlags[storedCountry]) {
          setCountry(storedCountry);
          return;
        }

        // If localStorage fails, check Clerk's publicMetadata
        if (isLoaded && user && user.publicMetadata.country) {
          const clerkCountry = user.publicMetadata.country as string;
          if (countryFlags[clerkCountry]) {
            setCountry(clerkCountry);
            try {
              setCookie('userCountry', clerkCountry);
              localStorage.setItem('userCountry', clerkCountry);
            } catch (error) {
              console.error('Error setting cookie or localStorage:', error);
            }
            return;
          }
        }

        // Try IP-based country detection
        const ipAddress = await getUserIpAddress();
        if (ipAddress) {
          const response = await fetch(`https://get.geojs.io/v1/ip/country.json?ip=${ipAddress}`);
          const data = await response.json();
          const detectedCountry = data.country === 'SG' ? 'Singapore' : 
                                data.country === 'MY' ? 'Malaysia' : null;

          if (detectedCountry) {
            setCountry(detectedCountry);
            try {
              setCookie('userCountry', detectedCountry);
              localStorage.setItem('userCountry', detectedCountry);
            } catch (error) {
              console.error('Error setting cookie or localStorage:', error);
            }
            return;
          }
        }

        // Fallback to Singapore if all detection methods fail
        console.log('All country detection methods failed, falling back to Singapore');
        setCountry('Singapore');
        try {
          setCookie('userCountry', 'Singapore');
          localStorage.setItem('userCountry', 'Singapore');
        } catch (error) {
          console.error('Error setting cookie or localStorage:', error);
        }
      } catch (error) {
        // Fallback to Singapore if any error occurs
        console.error('Error detecting country:', error);
        console.log('Error in country detection, falling back to Singapore');
        setCountry('Singapore');
        try {
          setCookie('userCountry', 'Singapore');
          localStorage.setItem('userCountry', 'Singapore');
        } catch (storageError) {
          console.error('Error setting cookie or localStorage:', storageError);
        }
      }
    };

    detectCountry();
  }, [isLoaded, user]);

  const changeCountry = async (newCountry: string) => {
    setCountry(newCountry);
    try {
      // Update local storage and cookie
      localStorage.setItem('userCountry', newCountry);
      setCookie('userCountry', newCountry);

      // Invalidate cache by making a request to the API with cache busting
      await fetch(`/api/events?country=${newCountry}&bustCache=true&_=${Date.now()}`);

      // Use router.refresh() instead of window.location.reload()
      // This will trigger a soft refresh of the page's dynamic content
      router.refresh();
    } catch (error) {
      console.error('Error setting country preference:', error);
    }
  };

  return (
    <div className="country-selector">
      <Select value={country} onValueChange={changeCountry}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Select country" />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(countryFlags).map(([countryName, flag]) => (
            <SelectItem key={countryName} value={countryName}>
              {flag} {countryName}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default CountrySelector;