"use client"

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { setCookie, getCookie } from 'cookies-next';

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
        // First, check cookie
        const cookieCountry = getCookie('userCountry') as string | undefined;
        if (cookieCountry && countryFlags[cookieCountry]) {
          setCountry(cookieCountry);
          return;
        }

        // Then, try to detect country using GeoJS
        const response = await fetch('https://get.geojs.io/v1/ip/country.json');
        const data = await response.json();
        const detectedCountry = data.name === 'SG' ? 'Singapore' : data.name === 'MY' ? 'Malaysia' : null;

        if (detectedCountry) {
          setCountry(detectedCountry);
          setCookie('userCountry', detectedCountry);
          return;
        }

        // If GeoJS fails, check localStorage
        const storedCountry = localStorage.getItem('userCountry');
        if (storedCountry && countryFlags[storedCountry]) {
          setCountry(storedCountry);
          setCookie('userCountry', storedCountry);
          return;
        }

        // Finally, check Clerk's publicMetadata
        if (isLoaded && user && user.publicMetadata.country) {
          const clerkCountry = user.publicMetadata.country as string;
          if (countryFlags[clerkCountry]) {
            setCountry(clerkCountry);
            setCookie('userCountry', clerkCountry);
          }
        }
      } catch (error) {
        console.error('Error detecting country:', error);
      }
    };

    detectCountry();
  }, [isLoaded, user]);

  const changeCountry = (newCountry: string) => {
    setCountry(newCountry);
    localStorage.setItem('userCountry', newCountry);
    setCookie('userCountry', newCountry);
  };

  return (
    <Select value={country} onValueChange={changeCountry}>
      <SelectTrigger className="w-[40px] h-[40px] p-0 border-none">
        <SelectValue>
          {countryFlags[country]}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {Object.entries(countryFlags).map(([countryName, flag]) => (
          <SelectItem key={countryName} value={countryName}>
            <div className="flex items-center">
              <span className="mr-2">{flag}</span>
              {countryName}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default CountrySelector;