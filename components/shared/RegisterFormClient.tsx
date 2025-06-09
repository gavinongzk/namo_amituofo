'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, useFieldArray } from "react-hook-form"
import * as z from 'zod'
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { IEvent } from '@/lib/database/models/event.model'
import { CreateOrderParams, CustomField, DuplicateRegistrationDetail } from "@/types"
import PhoneInput, { isValidPhoneNumber } from 'react-phone-number-input'
import 'react-phone-number-input/style.css'
import { categoryCustomFields, CategoryName } from '@/constants'
import { useUser } from '@clerk/nextjs';
import { getCookie, setCookie } from 'cookies-next';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { toast } from "react-hot-toast"
import { PlusIcon, Loader2Icon } from 'lucide-react'
import { debounce } from 'lodash';
import * as Sentry from '@sentry/nextjs';
import { validateSingaporePostalCode } from '@/lib/utils';
import { toChineseOrdinal } from '@/lib/utils/chineseNumerals';
import QrCodeWithLogo from '@/components/shared/QrCodeWithLogo';
import { PdpaConsentCheckbox } from './PdpaConsentCheckbox';
import { createRegistrationFormSchema } from '@/lib/validator';

const getQuestionNumber = (personIndex: number, fieldIndex: number) => {
  return `${personIndex + 1}.${fieldIndex + 1}`;
};

const isValidName = (name: string) => {
  // Regex to match letters (including Chinese), spaces, brackets, and common punctuation
  const nameRegex = /^[\p{L}\p{N}\s\-.'()\[\]{}]+$/u;
  return nameRegex.test(name);
};
const sanitizeName = (name: string) => {
  // Remove emojis and other non-standard characters while keeping Chinese characters and brackets
  return name.replace(/[^\p{L}\p{N}\s\-.'()\[\]{}]/gu, '');
};

const isValidPostalCode = async (code: string, country: string) => {
  if (!code) return false;
  
  if (country === 'Singapore') {
    return await validateSingaporePostalCode(code);
  } else if (country === 'Malaysia') {
    return /^\d{5}$/.test(code);
  }
  
  // For other countries, accept 4-10 digits
  return /^\d{4,10}$/.test(code);
};

interface RegisterFormClientProps {
  event: IEvent & { category: { name: CategoryName } }
  initialOrderCount: number
}

const getCountryFromPhoneNumber = (phoneNumber: string | boolean | undefined) => {
  if (!phoneNumber || typeof phoneNumber !== 'string') return null;
  if (phoneNumber.startsWith('+60')) return 'Malaysia';
  if (phoneNumber.startsWith('+65')) return 'Singapore';
  return null;
};

// Function to check if a person's form is empty
const isGroupEmpty = (group: any, customFields: CustomField[]) => {
  const nameFieldId = customFields.find(f => f.label.toLowerCase().includes('name'))?.id;
  const phoneFieldId = customFields.find(f => f.type === 'phone')?.id;

  const nameValue = nameFieldId ? group[nameFieldId] : '';
  const phoneValue = phoneFieldId ? group[phoneFieldId] : '';

  // Consider a group empty if both name and phone are not filled
  return !nameValue && !phoneValue;
};

const RegisterFormClient = ({ event, initialOrderCount }: RegisterFormClientProps) => {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState('');
  const { user, isLoaded } = useUser();
  const [userCountry, setUserCountry] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [duplicatePhoneNumbers, setDuplicatePhoneNumbers] = useState<DuplicateRegistrationDetail[]>([]);
  const [formValues, setFormValues] = useState<any>(null);
  const [isCountryLoading, setIsCountryLoading] = useState(true);
  const [phoneOverrides, setPhoneOverrides] = useState<Record<number, boolean>>({});
  const [phoneCountries, setPhoneCountries] = useState<Record<number, string | null>>({});
  const [postalOverrides, setPostalOverrides] = useState<Record<number, boolean>>({});
  const [numberOfFormsToShow, setNumberOfFormsToShow] = useState<number>(1);
  const [postalCheckedState, setPostalCheckedState] = useState<Record<number, boolean>>({});
  const [timeRemaining, setTimeRemaining] = useState<number>(5);


  useEffect(() => {
    const savedPostalCode = getCookie('lastUsedPostal') || localStorage.getItem('lastUsedPostal');
    if (savedPostalCode) {
      const postalField = customFields.find(f => f.type === 'postal')?.id;
      if (postalField) {
        form.setValue(`groups.0.${postalField}`, savedPostalCode);
      }
    }
  }, []);

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
        console.log('Country data:', data);
        const detectedCountry = data.country === 'SG' 
          ? 'Singapore' 
          : data.country === 'MY' 
            ? 'Malaysia' 
            : 'Singapore'; // Default to Others for non-SG/MY countries
        
        setUserCountry(detectedCountry);
        try {
          setCookie('userCountry', detectedCountry);
        } catch (error) {
          console.error('Error setting cookie:', error);
        }
      } catch (error) {
        console.error('Error detecting country:', error);
        Sentry.captureException(error);
        // Default to Singapore if detection fails
        setUserCountry('Singapore');
      } finally {
        setIsCountryLoading(false);
      }
    };
    detectCountry();
  }, [isLoaded, user]);

  const customFields = (categoryCustomFields[event.category.name as CategoryName] || categoryCustomFields.default) as CustomField[];

  const formSchema = createRegistrationFormSchema(customFields);

  // Helper function to get default country code
  const getDefaultCountry = (country: string | null) => {
    return country === 'Malaysia' ? 'MY' : 'SG';
  };

  // Update form initialization with detected country
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      groups: Array(1).fill(null).map(() => Object.fromEntries(
        customFields.map(field => [
          field.id, 
          field.type === 'boolean' ? false : ''
        ])
      )),
      pdpaConsent: false
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "groups"
  });

  // Add effect to revalidate postal fields when override status changes
  useEffect(() => {
    const postalFields = customFields.filter(field => field.type === 'postal');
    if (postalFields.length > 0 && form) {
      console.log('postalOverrides state changed:', postalOverrides);
      
      // For each person with a postal field
      for (let i = 0; i < form.getValues().groups.length; i++) {
        if (Object.keys(postalOverrides).includes(i.toString())) {
          console.log(`Revalidating postal fields for person ${i}, override: ${postalOverrides[i]}`);
          
          // Trigger validation for each postal field
          postalFields.forEach(field => {
            // Add a small delay to ensure the state is updated before triggering validation
            setTimeout(() => {
              form.trigger(`groups.${i}.${field.id}`);
            }, 100);
          });
        }
      }
    }
  }, [postalOverrides, customFields, form]);

  const checkForDuplicatePhoneNumbers = async (payload: any) => {
    const phoneField = customFields.find(f => f.type === 'phone')?.id || '';
    const phoneNumbers = payload.groups.map((group: any) => group[phoneField]);
    
    try {
      const response = await fetch('/api/check-phone-numbers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          phoneNumbers,
          eventId: payload.eventId || event._id 
        })
      });
      
      const { duplicates } = await response.json();
      return duplicates;
    } catch (error) {
      console.error('Error checking phone numbers:', error);
      Sentry.captureException(error);
      toast.error("检查电话号码时出错 / Error checking phone numbers.");
      return [];
    }
  };
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    // Prevent multiple submissions immediately
    if (isSubmitting) {
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      const toastId = toast.loading("检查报名详情中... / Checking registration details...");
      
      saveFormData(values);

      // Filter out empty groups before further processing
      const filledGroups = values.groups.filter(group => !isGroupEmpty(group, customFields));

      // If all groups are empty after filtering, show a message and return
      if (filledGroups.length === 0) {
        toast.dismiss(toastId);
        toast.error("请至少填写一份报名表格。/ Please fill in at least one registration form.", { id: toastId, duration: 5000 });
        setIsSubmitting(false);
        return;
      }

      // Validate phone numbers first
      const phoneField = customFields.find(f => f.type === 'phone')?.id;
      if (phoneField) {
        const phoneValidationErrors: string[] = [];
        
        for (let i = 0; i < filledGroups.length; i++) {
          const rawValue = filledGroups[i][phoneField];
          const phoneNumber = typeof rawValue === 'boolean' ? '' : String(rawValue || '');
          
          // Skip validation if phone override is active
          if (phoneOverrides[i]) {
            // For overridden numbers, just check if it starts with + and contains only numbers after that
            if (!/^\+\d+$/.test(phoneNumber)) {
              phoneValidationErrors.push(`${toChineseOrdinal(i + 1)}参加者的电话号码格式无效。必须以+开头，后跟数字 / Invalid phone number format for Participant ${i + 1}. Must start with + followed by numbers`);
            }
            continue;
          }
          
          // Regular phone validation for SG/MY numbers
          if (!isValidPhoneNumber(phoneNumber)) {
            phoneValidationErrors.push(`${toChineseOrdinal(i + 1)}参加者的电话号码无效 / Invalid phone number for Participant ${i + 1}`);
          }
        }
        
        if (phoneValidationErrors.length > 0) {
          toast.error(phoneValidationErrors.join('\n'), { id: toastId, duration: 5000 });
          setIsSubmitting(false);
          return;
        }
      }
      
      // Validate postal codes
      const postalField = customFields.find(f => f.type === 'postal')?.id;
      if (postalField) {
        const postalValidationErrors: string[] = [];
        
        for (let i = 0; i < filledGroups.length; i++) {
          // Ensure we're working with a string value
          const rawValue = filledGroups[i][postalField];
          const postalCode = typeof rawValue === 'boolean' ? '' : String(rawValue || '');
          
          // Skip validation if postal code is empty (since it's optional)
          if (!postalCode || !postalCode.trim()) {
            // Ensure empty string is passed instead of undefined or null
            filledGroups[i][postalField] = '';
            continue;
          }
          
          // Skip detailed validation if override is active
          if (postalOverrides[i]) {
            if (!/^\d+$/.test(postalCode)) {
              postalValidationErrors.push(`${toChineseOrdinal(i + 1)}参加者的邮区编号必须只包含数字 / Postal code for Person ${i + 1} must contain only numbers`);
            }
            continue;
          }
          
          try {
            const isValidCountryPostal = await isValidPostalCode(postalCode, userCountry || 'Singapore');
            if (!isValidCountryPostal) {
              postalValidationErrors.push(
                `${toChineseOrdinal(i + 1)}参加者: ${
                  userCountry === 'Singapore'
                    ? "新加坡邮区编号无效 / Invalid postal code for Singapore"
                    : userCountry === 'Malaysia'
                      ? "马来西亚邮区编号必须是5位数字 / Must be 5 digits for Malaysia"
                      : "请输入有效的邮区编号 / Please enter a valid postal code"
                }`
              );
            }
          } catch (error) {
            console.error("Error validating postal code:", error);
          }
        }
        
        if (postalValidationErrors.length > 0) {
          toast.error(postalValidationErrors.join('\n'), { id: toastId, duration: 5000 });
          setIsSubmitting(false);
          return;
        }
      }
      
      // Check for duplicate phone numbers using only filled groups
      const duplicates = await checkForDuplicatePhoneNumbers({
        groups: filledGroups,
        eventId: event._id
      } as any);
      
      if (duplicates.length > 0) {
        toast.dismiss(toastId);
        setDuplicatePhoneNumbers(duplicates);
        setFormValues({...values, groups: filledGroups});
        setShowConfirmation(true);
        setIsSubmitting(false);
        return;
      }
      
      await submitForm({...values, groups: filledGroups}, toastId);
    } catch (error: any) {
      console.error('Error in onSubmit:', error);
      setIsSubmitting(false);
    } finally {
      // Cleanup handled by individual functions
    }
  };

  const submitForm = async (values: z.infer<typeof formSchema>, toastId: string) => {
    try {
      setMessage('');
      
      toast.loading("处理报名中... / Processing registration...", { id: toastId });
      
      const customFieldValues = values.groups.map((group, index) => ({
        groupId: `group_${index + 1}`,
        fields: Object.entries(group).map(([key, value]) => {
          const field = customFields.find(f => f.id === key) as CustomField;
          // Save first person's postal code
          if (index === 0 && field?.type === 'postal' && value) {
            const postalValue = String(value);
            localStorage.setItem('lastUsedPostal', postalValue);
            setCookie('lastUsedPostal', postalValue, { maxAge: 60 * 60 * 24 * 30 }); // 30 days
          }
          return {
            id: key,
            label: field?.label || key,
            type: field?.type,
            value: value === null || value === undefined ? '' : String(value),
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
        throw new Error(`Failed to create order: ${response.statusText}`);
      }

      const data = await response.json();
      
      toast.success("报名成功！/ Registration successful!", { id: toastId });
      router.push(`/reg/${data.order._id}`);
    } catch (error: any) {
      console.error('Error submitting form:', error);
      Sentry.captureException(error);
      
      let errorMessage = "报名失败，请重试。/ Registration failed. Please try again.";
      if (error.response && error.response.data && error.response.data.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        if (error.message.startsWith('Failed to create order')) {
          errorMessage = `处理报名时出错: ${error.message} / Error processing registration: ${error.message}`;
        } else {
          errorMessage = error.message;
        }
      }
      
      toast.error(errorMessage, { id: toastId, duration: 5000 });
      setMessage(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };
  const isFullyBooked = initialOrderCount >= event.maxSeats;

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
    // Increment the number of forms to show
    setNumberOfFormsToShow(prev => prev + 1);
    // Initialize the new person's postal checkbox as unchecked
    setPostalCheckedState(prev => ({
      ...prev,
      [fields.length]: false
    }));
  };

  useEffect(() => {
    // Load saved form data from cookies
    const savedFormData = getCookie('lastUsedFields');
    if (savedFormData) {
      try {
        const parsedData = JSON.parse(savedFormData as string);
        
        // Pre-fill first person's non-sensitive fields
        Object.entries(parsedData).forEach(([fieldId, value]) => {
          // Don't pre-fill sensitive info like phone numbers
          if (!fieldId.includes('phone')) {
            form.setValue(`groups.0.${fieldId}`, value as string | boolean);
          }
        });
      } catch (e) {
        console.error('Error parsing saved form data:', e);
      }
    }
  }, []);

  const saveFormData = (values: z.infer<typeof formSchema>) => {
    const firstPerson = values.groups[0];
    const fieldsToSave = Object.entries(firstPerson).reduce((acc, [key, value]) => {
      // Don't save sensitive info
      if (!key.includes('phone')) {
        acc[key] = value;
      }
      return acc;
    }, {} as Record<string, string | boolean>);

    setCookie('lastUsedFields', JSON.stringify(fieldsToSave), { 
      maxAge: 60 * 60 * 24 * 30 // 30 days
    });
  };

  const debouncedSaveForm = useMemo(
    () => debounce((values: z.infer<typeof formSchema>) => {
      saveFormData(values);
    }, 1000),
    []
  );

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // We don't need to track the current step anymore
            // as it's not used anywhere
          }
        });
      },
      { threshold: 0.5 }
    );

    fields.forEach((_, index) => {
      const element = document.getElementById(`person-${index}`);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, [fields.length]);

  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      // Watch for phone number changes
      if (name?.includes('phone')) {
        const personIndex = parseInt(name.split('.')[1]);
        const phoneValue = value?.groups?.[personIndex]?.phone;
        const detectedCountry = getCountryFromPhoneNumber(phoneValue);
        
        if (detectedCountry) {
          setPhoneCountries(prev => ({
            ...prev,
            [personIndex]: detectedCountry
          }));
        }
      }

      if (name?.includes('postal')) {
        const postalField = customFields.find(f => f.type === 'postal')?.id;
        if (postalField) {
          debouncedSaveForm(form.getValues());
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [form, debouncedSaveForm]);

  // Add useEffect for timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (showConfirmation && timeRemaining > 0) {
      timer = setInterval(() => {
        setTimeRemaining(prev => prev - 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [showConfirmation, timeRemaining]);

  // Reset timer when dialog is closed
  useEffect(() => {
    if (!showConfirmation) {
      setTimeRemaining(5);
    }
  }, [showConfirmation]);

  return (
    <div className="max-w-3xl mx-auto">
      {isCountryLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary-500 border-t-transparent"></div>
            <p className="text-gray-600 font-medium">加载中... / Loading...</p>
          </div>
        </div>
      ) : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {message && <p className="text-red-500">{message}</p>}
            {isFullyBooked ? (
              <div className="p-6 bg-red-50 rounded-lg border border-red-200 text-center">
                <p className="text-red-600 font-medium text-lg">此活动已满员。/ This event is fully booked.</p>
              </div>
            ) : (
              <>
                {fields.slice(0, numberOfFormsToShow).map((field, personIndex) => (
                  <div 
                    key={field.id}
                    id={`person-${personIndex}`}
                    className="bg-white sm:rounded-xl sm:border sm:border-gray-200 sm:shadow-sm overflow-hidden scroll-mt-6"
                  >
                    <div className="bg-gradient-to-r from-primary-500/10 to-transparent px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
                      <h3 className="text-lg sm:text-xl font-semibold text-primary-700">
                        {toChineseOrdinal(personIndex + 1)}参加者 / Participant {personIndex + 1}
                      </h3>
                    </div>

                    <div className="p-4 sm:p-6 space-y-6 sm:space-y-8">
                      {customFields.map((customField: CustomField, fieldIndex) => (
                        <FormField
                          key={customField.id}
                          control={form.control}
                          name={`groups.${personIndex}.${customField.id}`}
                          render={({ field: formField }) => (
                            <FormItem className="space-y-3">
                              <FormLabel className="flex items-start gap-3 text-gray-700">
                                <span className="text-base pt-1">{customField.label}</span>
                              </FormLabel>
                              
                              <FormControl>
                                <div className="pl-0">
                                  {customField.type === 'boolean' ? (
                                    <div className="flex gap-6">
                                      <Checkbox
                                        checked={formField.value as boolean}
                                        onCheckedChange={formField.onChange}
                                        className="h-5 w-5 rounded-md"
                                      />
                                    </div>
                                  ) : customField.type === 'phone' ? (
                                    <div className="space-y-2">
                                      {phoneOverrides[personIndex] ? (
                                        <div className="space-y-1.5">
                                          <Input
                                            {...formField}
                                            value={String(formField.value)}
                                            type="tel"
                                            className="max-w-md h-12 text-lg border-2 focus:border-primary-500"
                                            placeholder="e.g. +8613812345678"
                                          />
                                          <p className="text-sm text-gray-600 pl-1">
                                            Format: +[country code][number]
                                          </p>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setPhoneOverrides(prev => ({
                                                ...prev,
                                                [personIndex]: false
                                              }));
                                              form.setValue(`groups.${personIndex}.phone`, userCountry === 'Malaysia' ? '+60' : '+65');
                                            }}
                                            className="text-primary-500 hover:text-primary-600 hover:underline text-xs mt-1"
                                          >
                                            Switch back to SG/MY phone number format 切换回新马电话格式
                                          </button>
                                        </div>
                                      ) : (
                                        <div className="space-y-2">
                                          <div className="phone-input-container max-w-md">
                                            <PhoneInput
                                              value={formField.value as string}
                                              onChange={(value) => formField.onChange(value || '')}
                                              defaultCountry={getDefaultCountry(userCountry)}
                                              countries={["SG", "MY"]}
                                              international
                                              countryCallingCodeEditable={false}
                                              className="h-12 text-lg"
                                              withCountryCallingCode
                                            />
                                          </div>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setPhoneOverrides(prev => ({
                                                ...prev,
                                                [personIndex]: true
                                              }));
                                              form.setValue(`groups.${personIndex}.phone`, '');
                                            }}
                                            className="text-primary-500 hover:text-primary-600 hover:underline text-xs mt-1"
                                          >
                                            使用其他国家的电话号码？点击这里 Using a phone number from another country? Click here
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  ) : customField.type === 'radio' ? (
                                    <div className="flex gap-6">
                                      {customField.options && customField.options.map((option) => (
                                        <label key={option.value} className="flex items-center gap-2 cursor-pointer">
                                          <input
                                            type="radio"
                                            value={option.value}
                                            checked={formField.value === option.value}
                                            onChange={() => formField.onChange(option.value)}
                                            className="w-4 h-4 text-primary-600"
                                          />
                                          <span className="text-gray-700">{option.label}</span>
                                        </label>
                                      ))}
                                    </div>
                                  ) : customField.type === 'postal' ? (
                                    <div className="space-y-2">
                                      <Input 
                                        {...formField}
                                        className="max-w-md"
                                        value={String(formField.value)}
                                        placeholder={
                                          postalOverrides[personIndex]
                                            ? "输入邮区编号 Enter postal code"
                                            : phoneCountries[personIndex] === 'Malaysia' || (!phoneCountries[personIndex] && userCountry === 'Malaysia')
                                              ? "e.g. 12345"
                                              : "e.g. 123456"
                                        }
                                        onChange={(e) => {
                                          // Only allow numbers when in override mode
                                          if (postalOverrides[personIndex]) {
                                            const numericValue = e.target.value.replace(/[^0-9]/g, '');
                                            formField.onChange(numericValue);
                                          } else {
                                            formField.onChange(e);
                                          }
                                        }}
                                      />
                                      <button
                                        type="button"
                                        onClick={() => {
                                          // Update the override state
                                          const newOverrideState = !postalOverrides[personIndex];
                                          
                                          // Clear the field first
                                          form.setValue(`groups.${personIndex}.${customField.id}`, '', { 
                                            shouldValidate: false  // Prevent validation on clear
                                          });
                                          
                                          // Update the override state
                                          setPostalOverrides(prev => ({
                                            ...prev,
                                            [personIndex]: newOverrideState
                                          }));
                                          
                                          // Reset form errors for this field
                                          form.clearErrors(`groups.${personIndex}.${customField.id}`);
                                          
                                          // Force revalidation after a small delay to ensure state is updated
                                          setTimeout(() => {
                                            form.trigger(`groups.${personIndex}.${customField.id}`);
                                          }, 100);
                                        }}
                                        className="text-primary-500 hover:text-primary-600 hover:underline text-xs mt-1"
                                      >
                                        {postalOverrides[personIndex] ? 
                                          "切换回邮区编号验证 Switch back to postal code validation" : 
                                          "使用其他国家的邮区编号？点击这里 Using a postal code from another country? Click here"}
                                      </button>
                                      {personIndex > 0 && (
                                        <div className="flex items-center gap-2 mt-2">
                                          <Checkbox
                                            checked={postalCheckedState[personIndex] ?? false}
                                            onCheckedChange={(checked) => {
                                              setPostalCheckedState(prev => ({
                                                ...prev,
                                                [personIndex]: !!checked
                                              }));
                                              
                                              if (checked) {
                                                const firstPersonPostal = form.getValues(`groups.0.${customField.id}`);
                                                form.setValue(`groups.${personIndex}.${customField.id}`, firstPersonPostal);
                                              } else {
                                                form.setValue(`groups.${personIndex}.${customField.id}`, '');
                                              }
                                            }}
                                            className="h-4 w-4"
                                          />
                                          <label className="text-sm text-gray-600">
                                            与{toChineseOrdinal(1)}参加者相同 Same as Participant 1
                                          </label>
                                        </div>
                                      )}
                                    </div>
                                  ) : (
                                    <Input 
                                      {...formField}
                                      className="max-w-md"
                                      value={String(formField.value)}
                                      placeholder={customField.label}
                                      onChange={(e) => {
                                        const sanitized = sanitizeName(e.target.value);
                                        formField.onChange(sanitized);
                                      }}
                                    />
                                  )}
                                </div>
                              </FormControl>
                              <FormMessage className="pl-0" />
                            </FormItem>
                          )}
                        />
                      ))}
                    </div>
                    
                    {personIndex > 0 && (
                      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                        <Button 
                          type="button" 
                          onClick={() => {
                            remove(personIndex);
                            setNumberOfFormsToShow(prev => Math.max(1, prev - 1));
                          }}
                          disabled={isSubmitting}
                          className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white h-10 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          删除{toChineseOrdinal(personIndex + 1)}参加者 Remove Participant {personIndex + 1}
                        </Button>
                      </div>
                    )}
                  </div>
                ))}

                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-3 sm:pt-4">
                  <Button
                    type="button"
                    onClick={handleAddPerson}
                    disabled={numberOfFormsToShow >= event.maxSeats || isSubmitting}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-900 gap-2 text-sm md:text-base font-medium h-10 md:h-12 border-2 border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <PlusIcon className="w-4 h-4 md:w-5 md:h-5" />
                    添加参加者 Add Participant
                  </Button>
                </div>
              </>
            )}

            {/* Add PDPA consent checkbox before the submit button */}
            <PdpaConsentCheckbox 
              name="pdpaConsent"
              disabled={isSubmitting}
              className="mt-6"
            />

            <Button 
              type="submit" 
              disabled={isSubmitting || isFullyBooked} 
              className="w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                  处理中... / Processing...
                </>
              ) : isFullyBooked ? (
                '名额已满 / Fully Booked'
              ) : (
                '提交 / Submit'
              )}
            </Button>
          </form>
        </Form>
      )}

      <Dialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <DialogContent className="bg-white sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-gray-900">
              发现重复报名 / Duplicate Registration Found
            </DialogTitle>
            <DialogDescription className="space-y-4 pt-4">
              <p className="text-gray-700">
                以下电话号码已报名：/ The following phone number/s is/are already registered:
              </p>
              <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1">
                {duplicatePhoneNumbers.map((duplicate, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
                    <div className="p-4 space-y-3">
                      <p className="text-red-600 font-medium text-base">{duplicate.phoneNumber}</p>
                      <div className="grid grid-cols-[auto,1fr] gap-x-3 gap-y-2 text-sm">
                        <span className="text-gray-600 font-medium whitespace-nowrap">名字 Name:</span>
                        <span className="text-gray-900">{duplicate.name}</span>
                        <span className="text-gray-600 font-medium whitespace-nowrap">队列号 Queue Number:</span>
                        <span className="text-gray-900">{duplicate.queueNumber}</span>
                      </div>
                      {duplicate.qrCode && (
                        <div className="pt-2">
                          <p className="text-gray-600 font-medium text-sm mb-2">二维码 QR Code:</p>
                          <div className="w-36 h-36 mx-auto bg-white rounded-lg border border-gray-200 overflow-hidden flex items-center justify-center">
                            <QrCodeWithLogo
                              qrCode={duplicate.qrCode}
                              isAttended={false}
                              queueNumber={duplicate.queueNumber}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-gray-700 pt-2">
                您是否仍要继续？/ Do you still want to proceed?
              </p>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col sm:flex-row gap-3 mt-6">
            <Button
              variant="outline"
              onClick={() => {
                setShowConfirmation(false);
                setIsSubmitting(false); // Reset submission state when canceling
                if (duplicatePhoneNumbers.length > 0) {
                  const phoneNumber = encodeURIComponent(duplicatePhoneNumbers[0].phoneNumber);
                  router.push(`/event-lookup?phone=${phoneNumber}`);
                }
              }}
              className="w-full sm:w-auto border-gray-300 hover:bg-gray-50"
            >
              取消 / Cancel
            </Button>
            <Button
              onClick={() => {
                setShowConfirmation(false);
                setIsSubmitting(true);
                if (formValues) {
                  submitForm(formValues, toast.loading("处理报名中... / Processing registration..."));
                }
              }}
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white"
              disabled={timeRemaining > 0 || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                  处理中... / Processing...
                </>
              ) : timeRemaining > 0 ? `继续 / Continue (${timeRemaining}s)` : '继续 / Continue'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default RegisterFormClient
