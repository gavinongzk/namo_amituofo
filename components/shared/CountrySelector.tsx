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
        // First, try to detect country using GeoJS
        const response = await fetch('https://get.geojs.io/v1/ip/country.json');
        const data = await response.json();
        const detectedCountry = data.name === 'SG' ? 'Singapore' : data.name === 'MY' ? 'Malaysia' : null;

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

        // If GeoJS fails, check cookie
        try {
          const cookieCountry = getCookie('userCountry') as string | undefined;
          if (cookieCountry && countryFlags[cookieCountry]) {
            setCountry(cookieCountry);
            return;
          }
        } catch (error) {
          console.error('Error reading cookie:', error);
        }

        // If cookie fails, check localStorage
        try {
          const storedCountry = localStorage.getItem('userCountry');
          if (storedCountry && countryFlags[storedCountry]) {
            setCountry(storedCountry);
            return;
          }
        } catch (error) {
          console.error('Error reading localStorage:', error);
        }

        // Finally, check Clerk's publicMetadata
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
    try {
      localStorage.setItem('userCountry', newCountry);
      setCookie('userCountry', newCountry);
      // Refresh the page
      window.location.reload();
    } catch (error) {
      console.error('Error setting country preference:', error);
    }
  };

  return (
    <div className="country-selector">
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
    </div>
  );
};

export default CountrySelector;