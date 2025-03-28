'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import RegistrationCollection from '@/components/shared/RegistrationCollection';
import { getOrdersByPhoneNumber } from '@/lib/actions/order.actions';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import { IRegistration } from '@/types';

interface RegistrationLookupProps {
  showManualInput?: boolean;
  className?: string;
}

const RegistrationLookup = ({ showManualInput = false, className = '' }: RegistrationLookupProps) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [useManualInput, setUseManualInput] = useState(false);
  const [registrations, setRegistrations] = useState<IRegistration[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  const handleLookup = async () => {
    setIsLoading(true);
    setError('');
    setHasSearched(true);
    
    const maxRetries = 2;
    let retryCount = 0;
    
    while (retryCount <= maxRetries) {
      try {
        // Add timestamp AND a random value to prevent any caching issues
        const cacheBuster = `t=${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
        const endpoint = `/api/reg?phoneNumber=${encodeURIComponent(phoneNumber)}&${cacheBuster}`;
        
        console.log(`Fetching registrations from: ${endpoint}`);
        const response = await fetch(endpoint, {
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        });
        
        if (!response.ok) {
          throw new Error(`API responded with status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log(`Received ${data.length} registration(s)`);
        
        // Clear any cached registrations from session storage to ensure fresh data
        sessionStorage.removeItem('eventLookupRegistrations');
        sessionStorage.removeItem('eventLookupAllRegistrations');
        
        setRegistrations(data);
        setIsLoading(false);
        break; // Exit the retry loop if successful
      } catch (err) {
        console.error(`Attempt ${retryCount + 1} failed:`, err);
        if (retryCount === maxRetries) {
          setError('报名查询失败。请重试。Registration lookup failed. Please try again.');
          setRegistrations([]);
        } else {
          // Wait before retrying (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
        }
        retryCount++;
      } finally {
        if (retryCount === maxRetries) {
          setIsLoading(false);
        }
      }
    }
  };

  return (
    <div className={`flex flex-col gap-8 ${className}`}>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-4 text-center text-primary-500">
          活动查询 Event Lookup
        </h2>
        <p className="text-gray-600 mb-6 text-center">
          输入您报名时使用的电话号码，查找您的活动详情和排队号码。/
          Enter your registration phone number to find your event details and queue number.
        </p>
        <div className="flex flex-col gap-4">
          {useManualInput ? (
            <Input
              type="tel"
              placeholder="输入电话号码 Enter phone number"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="p-regular-16 border-2"
            />
          ) : (
            <PhoneInput
              placeholder="输入电话号码 Enter phone number"
              value={phoneNumber}
              onChange={(value) => setPhoneNumber(value || '')}
              defaultCountry="SG"
              countries={["SG", "MY"]}
              international
              countryCallingCodeEditable={false}
              className="p-regular-16 border-2 border-gray-300 rounded-md"
            />
          )}
          
          <div className="text-xs text-gray-500 text-right">
            <button
              type="button"
              onClick={() => {
                setUseManualInput(!useManualInput);
                setPhoneNumber('');
              }}
              className="text-primary-500 hover:text-primary-600 hover:underline"
            >
              {useManualInput ? (
                "切换回新马电话格式 Switch back to SG/MY phone number format"
              ) : (
                "使用其他国家的电话号码？点击这里 Using a phone number from another country? Click here"
              )}
            </button>
          </div>

          <Button onClick={handleLookup} disabled={isLoading} className="w-full">
            {isLoading ? '查询中... Looking up...' : '查询 Lookup'}
          </Button>
        </div>
      </div>

      {error && (
        <p className="text-red-500 text-center">
          获取报名资料失败。请重试。
          Failed to fetch registrations. Please try again.
        </p>
      )}

      {isLoading ? (
        <p className="text-center">加载中... Loading...</p>
      ) : hasSearched ? (
        <RegistrationCollection
          data={registrations}
          emptyTitle="未找到报名资料 No registrations found"
          emptyStateSubtext="未找到与此电话号码相关的报名资料。请检查后重试。No registrations were found for this phone number. Please check and try again."
          collectionType="All_Registrations"
          limit={6}
          page={1}
          totalPages={1}
        />
      ) : (
        <div className="flex-center wrapper min-h-[200px] w-full flex-col gap-3 rounded-[14px] bg-primary-50 py-28 text-center">
          <h3 className="p-bold-20 md:h5-bold text-primary-500">
            报名资料将显示在这里 Registrations will appear here
          </h3>
          <p className="p-regular-14 text-gray-600">
            使用上方的表单搜索您的报名资料和排队号码。/
            Use the form above to search for your registrations and queue numbers.
          </p>
        </div>
      )}
    </div>
  );
};

export default RegistrationLookup;