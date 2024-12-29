"use client"

import Image from 'next/image';
import { useEffect, useState } from 'react'
import { Input } from '../ui/input';
import { formUrlQuery, removeKeysFromQuery } from '@/lib/utils';
import { useRouter, useSearchParams } from 'next/navigation';

const Search = ({ placeholder = '搜索名称... / Search name...' }: { placeholder?: string }) => {
  const [query, setQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      try {
        let newUrl = '';

        if(query) {
          newUrl = formUrlQuery({
            params: searchParams.toString(),
            key: 'query',
            value: query.slice(0, 100) // Limit query length for safety
          })
        } else {
          newUrl = removeKeysFromQuery({
            params: searchParams.toString(),
            keysToRemove: ['query']
          })
        }

        // Validate URL before navigation
        new URL(newUrl, window.location.origin);
        router.push(newUrl, { scroll: false });
        if (error) setError(null);
      } catch (err) {
        console.error('Error updating search URL:', err);
        setError('Invalid search query. Please try a simpler search term.');
        // Reset the query to last known good state
        setQuery(searchParams.get('query') || '');
      }
    }, 300)

    return () => clearTimeout(delayDebounceFn);
  }, [query, searchParams, router, error])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Basic input sanitization
    const sanitizedValue = value.replace(/[<>]/g, '');
    setQuery(sanitizedValue);
  };

  return (
    <div className="flex flex-col w-full">
      <div className="flex-center min-h-[54px] w-full overflow-hidden rounded-full bg-grey-50 px-4 py-2">
        <Image 
          src="/assets/icons/search.svg" 
          alt="搜索 / Search" 
          width={24} 
          height={24} 
        />
        <Input 
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={handleInputChange}
          maxLength={100}
          className="p-regular-16 border-0 bg-grey-50 outline-offset-0 placeholder:text-grey-500 focus:border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
          aria-label="搜索输入框 / Search input field"
        />
      </div>
      {error && (
        <p className="text-red-500 text-sm mt-2 px-4">{error}</p>
      )}
    </div>
  )
}

export default Search