"use client"

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { setCookie } from 'cookies-next';

const countryFlags: { [key: string]: string } = {
  'Singapore': '🇸🇬',
  'Malaysia': '🇲🇾',
};

const CountrySelector = () => {
  const { user, isLoaded } = useUser();
  const [country, setCountry] = useState<string | null>(null);

  useEffect(() => {
    const detectCountry = async () => {
      try {
        // First, try to detect country using GeoJS
        const response = await fetch('https://get.geojs.io/v1/ip/country.json');
        const data = await response.json();
        const detectedCountry = data.country === 'SG' ? 'Singapore' : data.country === 'MY' ? 'Malaysia' : null;

        if (detectedCountry) {
          setCountry(detectedCountry);
          localStorage.setItem('userCountry', detectedCountry);
          setCookie('userCountry', detectedCountry);
          return;
        }

        // If GeoJS fails, check localStorage
        const storedCountry = localStorage.getItem('userCountry');
        if (storedCountry) {
          setCountry(storedCountry);
          setCookie('userCountry', storedCountry);
          return;
        }

        // Finally, check Clerk's publicMetadata
        if (isLoaded && user && user.publicMetadata.country) {
          setCountry(user.publicMetadata.country as string);
          localStorage.setItem('userCountry', user.publicMetadata.country as string);
          setCookie('userCountry', user.publicMetadata.country as string);
        }
      } catch (error) {
        console.error('Error detecting country:', error);
      }
    };

    detectCountry();
  }, [isLoaded, user]);

  const changeCountry = async (newCountry: string) => {
    try {
      setCountry(newCountry);
      localStorage.setItem('userCountry', newCountry);
      setCookie('userCountry', newCountry);
    } catch (error) {
      console.error('Error updating country:', error);
    }
  };

  if (!country) return null;

  return (
    <Select value={country} onValueChange={changeCountry}>
      <SelectTrigger className="w-[60px]">
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