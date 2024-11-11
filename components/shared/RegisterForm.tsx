// components/shared/RegisterForm.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, useFieldArray } from "react-hook-form"
import * as z from 'zod'
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { IEvent } from '@/lib/database/models/event.model'
import { CreateOrderParams } from "@/types"
import { getOrderCountByEvent } from '@/lib/actions/order.actions'
import PhoneInput, { isValidPhoneNumber } from 'react-phone-number-input'
import 'react-phone-number-input/style.css'
import { categoryCustomFields, CategoryName } from '@/constants'
import { CustomField } from "@/types"
import { useUser } from '@clerk/nextjs';
import { getCookie, setCookie } from 'cookies-next';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"


const isValidName = (name: string) => {
  // Regex to match letters (including Chinese), spaces, brackets, and common punctuation
  const nameRegex = /^[\p{L}\p{N}\s\-.'()\[\]{}]+$/u;
  return nameRegex.test(name);
};

const sanitizeName = (name: string) => {
  // Remove emojis and other non-standard characters while keeping Chinese characters and brackets
  return name.replace(/[^\p{L}\p{N}\s\-.'()\[\]{}]/gu, '');
};

const RegisterForm = ({ event }: { event: IEvent & { category: { name: CategoryName } } } ) => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentRegistrations, setCurrentRegistrations] = useState(0);
  const [message, setMessage] = useState('');
  const { user, isLoaded } = useUser();
  const [userCountry, setUserCountry] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [duplicatePhoneNumbers, setDuplicatePhoneNumbers] = useState<string[]>([]);
  const [formValues, setFormValues] = useState<any>(null);
  const [isCountryLoading, setIsCountryLoading] = useState(true);

  useEffect(() => {
    async function fetchOrderCount() {
      const count = await getOrderCountByEvent(event._id);
      setCurrentRegistrations(count ?? 0);
    }
    fetchOrderCount();
  }, [event._id]);

  useEffect(() => {
    const detectCountry = async () => {
      setIsCountryLoading(true);
      try {
        // First check if we have a country in cookie
        const cookieCountry = getCookie('userCountry');
        if (cookieCountry) {
          setUserCountry(cookieCountry as string);
          setIsCountryLoading(false);
          return;
        }

        // Then check if user is logged in and has country in metadata
        if (isLoaded && user && user.publicMetadata.country) {
          setUserCountry(user.publicMetadata.country as string);
          setIsCountryLoading(false);
          return;
        }

        // If no cookie or user metadata, use IP detection
        const response = await fetch('https://get.geojs.io/v1/ip/country.json');
        const data = await response.json();
        const detectedCountry = data.name === 'SG' ? 'Singapore' : 
                               data.name === 'MY' ? 'Malaysia' : 
                               'Others';
        
        setUserCountry(detectedCountry);
        try {
          setCookie('userCountry', detectedCountry);
        } catch (error) {
          console.error('Error setting cookie:', error);
        }
      } catch (error) {
        console.error('Error detecting country:', error);
        // Default to Singapore if detection fails
        setUserCountry('Singapore');
      } finally {
        setIsCountryLoading(false);
      }
    };

    detectCountry();
  }, [isLoaded, user]);

  const customFields = categoryCustomFields[event.category.name as CategoryName] || categoryCustomFields.default;

  const formSchema = z.object({
    groups: z.array(
      z.object(
        Object.fromEntries(
          customFields.map(field => [
            field.id,
            field.type === 'boolean'
              ? z.boolean()
              : field.type === 'phone'
                ? z.string()
                    .min(1, { message: "Phone number is required" })
                    .refine(
                      (value) => userCountry === 'Others' ? true : isValidPhoneNumber(value),
                      { message: "Invalid phone number" }
                    )
                : field.label.toLowerCase().includes('name')
                  ? z.string()
                      .min(1, { message: "This field is required" })
                      .refine(
                        (value) => isValidName(value),
                        { message: "Name can only contain letters, spaces, hyphens, apostrophes, and periods" }
                      )
                  : z.string().min(1, { message: "This field is required" })
          ])
        )
      )
    )
  });

  // Helper function to get default country code
  const getDefaultCountry = (country: string | null) => {
    if (country === 'Others') return undefined;
    return country === 'Malaysia' ? 'MY' : 'SG';
  };

  // Update form initialization with detected country
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      groups: [Object.fromEntries(
        customFields.map(field => [
          field.id, 
          field.type === 'boolean' ? false : 
          field.type === 'phone' ? (userCountry === 'Malaysia' ? '+60' : '+65') : 
          ''
        ])
      )]
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "groups"
  });

  const checkForDuplicatePhoneNumbers = async (values: z.infer<typeof formSchema>) => {
    const phoneNumbers = values.groups.map(group => group[customFields.find(f => f.type === 'phone')?.id || '']);
    
    try {
      const response = await fetch('/api/check-phone-numbers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          phoneNumbers,
          eventId: event._id 
        })
      });
      
      const { duplicates } = await response.json();
      return duplicates;
    } catch (error) {
      console.error('Error checking phone numbers:', error);
      return [];
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const duplicates = await checkForDuplicatePhoneNumbers(values);
    
    if (duplicates.length > 0) {
      setDuplicatePhoneNumbers(duplicates);
      setFormValues(values);
      setShowConfirmation(true);
      return;
    }
    
    await submitForm(values);
  };

  const submitForm = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    setMessage('');
    
    try {
      const customFieldValues = values.groups.map((group, index) => ({
        groupId: `group_${index + 1}`,
        fields: Object.entries(group).map(([key, value]) => {
          const field = customFields.find(f => f.id === key) as CustomField;
          return {
            id: key,
            label: field?.label || key,
            type: field?.type,
            value: String(value),
            options: field?.options || [],
          };
        })
      }));

      const orderData: CreateOrderParams = {
        eventId: event._id,
        createdAt: new Date(),
        customFieldValues,
      };

      const response = await fetch('/api/createOrder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        throw new Error('Failed to create order');
      }

      const data = await response.json();
      router.push(`/orders/${data.order._id}`);
    } catch (error) {
      console.error('Error submitting form:', error);
      setMessage('Failed to submit registration. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFullyBooked = currentRegistrations >= event.maxSeats;

  // Update the append function
  const handleAddPerson = () => {
    append(Object.fromEntries(
      customFields.map(field => [
        field.id,
        field.type === 'boolean' ? false :
        field.type === 'phone' ? (userCountry === 'Malaysia' ? '+60' : '+65') :
        ''
      ])
    ));
  };

  // Define PhoneInputWithOthers inside RegisterForm to access the functions
  const PhoneInputWithOthers = ({ value, onChange, userCountry }: {
    value: string;
    onChange: (value: string | undefined) => void;
    userCountry: string | null;
  }) => {
    return (
      <div className="space-y-2">
        <select 
          className="w-full rounded-md border border-input px-3 py-2 text-sm"
          value={userCountry || ''}
          onChange={(e) => {
            setUserCountry(e.target.value);
            onChange(e.target.value === 'Malaysia' ? '+60' : 
                    e.target.value === 'Singapore' ? '+65' : 
                    '');
          }}
        >
          <option value="Singapore">Singapore</option>
          <option value="Malaysia">Malaysia</option>
          <option value="Others">Others</option>
        </select>
        
        <PhoneInput
          value={value}
          onChange={onChange}
          defaultCountry={getDefaultCountry(userCountry)}
          international
          countries={userCountry === 'Others' ? undefined : ["SG", "MY"]}
          className="input-field"
          withCountryCallingCode
        />
      </div>
    );
  };

  return (
    <>
      {isCountryLoading ? (
        <div className="flex items-center justify-center p-8">
          <div className="flex flex-col items-center gap-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
            <p className="text-gray-600">Loading... 加载中...</p>
          </div>
        </div>
      ) : (
        <>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              {message && <p className="text-red-500">{message}</p>}
              {isFullyBooked ? (
                <p className="text-red-500">This event is fully booked. 此活动已满员。</p>
              ) : (
                <>
                  {fields.map((field, index) => (
                    <div key={field.id} className="space-y-4">
                      <h3 className="font-bold">Person {index + 1}</h3>
                      {customFields.map((customField) => (
                        <FormField
                          key={customField.id}
                          control={form.control}
                          name={`groups.${index}.${customField.id}`}
                          render={({ field: formField }) => (
                            <FormItem>
                              <FormLabel>{customField.label}</FormLabel>
                              <FormControl>
                                {customField.type === 'boolean' ? (
                                  <Checkbox
                                    checked={formField.value as boolean}
                                    onCheckedChange={formField.onChange}
                                  />
                                ) : customField.type === 'phone' ? (
                                  <PhoneInputWithOthers
                                    value={formField.value as string}
                                    onChange={(value) => formField.onChange(value || '')}
                                    userCountry={userCountry}
                                  />
                                ) : customField.type === 'radio' ? (
                                  <div className="flex gap-4">
                                    {('options' in customField) && customField.options?.map((option) => (
                                      <label key={option.value} className="flex items-center">
                                        <input
                                          type="radio"
                                          value={option.value}
                                          checked={formField.value === option.value}
                                          onChange={() => formField.onChange(option.value)}
                                          className="mr-2"
                                        />
                                        {option.label}
                                      </label>
                                    ))}
                                  </div>
                                ) : (
                                  <Input 
                                    {...formField} 
                                    value={String(formField.value)}
                                    onChange={(e) => {
                                      const sanitized = sanitizeName(e.target.value);
                                      formField.onChange(sanitized);
                                    }}
                                    onPaste={(e) => {
                                      e.preventDefault();
                                      const text = e.clipboardData.getData('text');
                                      const sanitized = sanitizeName(text);
                                      formField.onChange(sanitized);
                                    }}
                                  />
                                )}
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      ))}
                      {index > 0 && (
                        <Button type="button" variant="destructive" onClick={() => remove(index)}>
                          Remove Person
                        </Button>
                      )}
                    </div>
                  ))}
                  <div className="flex gap-4 mt-6">
                    <Button
                      type="button"
                      onClick={handleAddPerson}
                      className="flex-1 bg-gray-600 hover:bg-gray-700 text-white"
                    >
                      Add Another Person 添加另一位
                    </Button>
                    <Button type="submit" disabled={isSubmitting} className="flex-1">
                      {isSubmitting ? 'Submitting... 提交中...' : 'Register 注册'}
                    </Button>
                  </div>
                </>
              )}
            </form>
          </Form>

          <Dialog open={showConfirmation} onOpenChange={setShowConfirmation}>
            <DialogContent className="bg-white border-2 border-gray-200 shadow-xl max-w-md w-[90vw]">
              <DialogHeader className="space-y-4">
                <DialogTitle className="text-xl font-bold text-gray-900">
                  Duplicate Registration Found / 发现重复注册
                </DialogTitle>
                <DialogDescription className="text-gray-700 space-y-4">
                  <p className="text-base">
                    The following phone numbers have already registered for this event:
                    <br />
                    以下电话号码已经注册过此活动：
                  </p>
                  <div className="bg-red-50 p-3 rounded-md border border-red-200">
                    <p className="text-red-600 font-medium text-lg">
                      {duplicatePhoneNumbers.join(', ')}
                    </p>
                  </div>
                  <p className="text-base pt-2">
                    Do you want to continue with the registration?
                    <br />
                    您要继续注册吗？
                  </p>
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="sm:justify-end gap-3 mt-6">
                <Button 
                  variant="outline" 
                  onClick={() => setShowConfirmation(false)}
                  className="flex-1 sm:flex-none border-gray-300 hover:bg-gray-100"
                >
                  Cancel / 取消
                </Button>
                <Button 
                  onClick={() => {
                    setShowConfirmation(false);
                    if (formValues) {
                      submitForm(formValues);
                    }
                  }}
                  className="flex-1 sm:flex-none bg-primary-500 hover:bg-primary-600 text-white"
                >
                  Continue / 继续
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}
    </>
  )
}

export default RegisterForm