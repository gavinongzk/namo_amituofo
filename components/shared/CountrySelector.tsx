"use client"

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRouter } from 'next/navigation';

const countryFlags: { [key: string]: string } = {
  'Singapore': '🇸🇬',
  'Malaysia': '🇲🇾',
};

const CountrySelector = () => {
  const { user, isLoaded } = useUser();
  const [country, setCountry] = useState<string>('Singapore'); // Default to Singapore

  useEffect(() => {
    const detectCountry = async () => {
      try {
        // First, check sessionStorage
        const sessionCountry = sessionStorage.getItem('userCountry');
        if (sessionCountry && countryFlags[sessionCountry]) {
          setCountry(sessionCountry);
          return;
        }

        // If sessionStorage fails, try to detect country using GeoJS
        const response = await fetch('https://get.geojs.io/v1/ip/country.json');
        const data = await response.json();
        const detectedCountry = data.name === 'SG' ? 'Singapore' : data.name === 'MY' ? 'Malaysia' : null;

        if (detectedCountry) {
          setCountry(detectedCountry);
          sessionStorage.setItem('userCountry', detectedCountry);
          return;
        }

        // If GeoJS fails, check localStorage
        const storedCountry = localStorage.getItem('userCountry');
        if (storedCountry && countryFlags[storedCountry]) {
          setCountry(storedCountry);
          sessionStorage.setItem('userCountry', storedCountry);
          return;
        }

        // Finally, check Clerk's publicMetadata
        if (isLoaded && user && user.publicMetadata.country) {
          const clerkCountry = user.publicMetadata.country as string;
          if (countryFlags[clerkCountry]) {
            setCountry(clerkCountry);
            sessionStorage.setItem('userCountry', clerkCountry);
          }
        }
      } catch (error) {
        console.error('Error detecting country:', error);
      }
    };

    detectCountry();
  }, [isLoaded, user]);

  const router = useRouter();

  const changeCountry = (newCountry: string) => {
    setCountry(newCountry);
    try {
      sessionStorage.setItem('userCountry', newCountry);
      localStorage.setItem('userCountry', newCountry);
      // Use Next.js router to refresh the current page
      router.refresh();
    } catch (error) {
      console.error('Error setting country preference:', error);
    }
  };

  return (
    <Select value={country} onValueChange={changeCountry}>
      <SelectTrigger className="w-[48px] h-[48px] p-0 border-none bg-transparent hover:bg-transparent focus:ring-0 focus:ring-offset-0">
        <SelectValue>
          <span className="text-3xl">{countryFlags[country]}</span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {Object.entries(countryFlags).map(([countryName, flag]) => (
          <SelectItem key={countryName} value={countryName}>
            <div className="flex items-center">
              <span className="text-2xl mr-2">{flag}</span>
              {countryName}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default CountrySelector;