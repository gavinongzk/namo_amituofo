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
import { CreateOrderParams } from "@/types"
import PhoneInput, { isValidPhoneNumber } from 'react-phone-number-input'
import 'react-phone-number-input/style.css'
import { categoryCustomFields, CategoryName } from '@/constants'
import { CustomField } from "@/types"
import { useUser } from '@clerk/nextjs';
import { getCookie, setCookie } from 'cookies-next';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { toast } from "react-hot-toast"
import { PlusIcon, Loader2Icon } from 'lucide-react'
import { debounce } from 'lodash';

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

const isValidPostalCode = (code: string, country: string) => {
  if (!code) return false;
  
  if (country === 'Singapore') {
    return /^\d{6}$/.test(code);
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

const RegisterFormClient = ({ event, initialOrderCount }: RegisterFormClientProps) => {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentRegistrations, setCurrentRegistrations] = useState(initialOrderCount)
  const [message, setMessage] = useState('');
  const { user, isLoaded } = useUser();
  const [userCountry, setUserCountry] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [duplicatePhoneNumbers, setDuplicatePhoneNumbers] = useState<string[]>([]);
  const [formValues, setFormValues] = useState<any>(null);
  const [isCountryLoading, setIsCountryLoading] = useState(true);
  const [phoneOverrides, setPhoneOverrides] = useState<Record<number, boolean>>({});
  const [lastUsedFields, setLastUsedFields] = useState<Record<string, string | boolean>>({});
  const [currentStep, setCurrentStep] = useState(0);

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
                      (value) => {
                        const index = parseInt(field.id.split('_')[1]) - 1;
                        return phoneOverrides[index] || userCountry === 'Others' || isValidPhoneNumber(value);
                      },
                      { message: "Invalid phone number" }
                    )
                : field.type === 'postal'
                  ? z.string()
                      .min(1, { message: "Postal code is required" })
                      .refine(
                        (value) => isValidPostalCode(value, userCountry || 'Singapore'),
                        {
                          message: userCountry === 'Singapore' 
                            ? "Please enter a valid 6-digit postal code"
                            : userCountry === 'Malaysia'
                              ? "Please enter a valid 5-digit postal code"
                              : "Please enter a valid postal code"
                        }
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
    return country === 'Malaysia' ? 'MY' : 'SG';
  };

  // Update form initialization with detected country
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      groups: [Object.fromEntries(
        customFields.map(field => [
          field.id, 
          field.type === 'boolean' ? false : ''
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
    const toastId = toast.loading("Checking registration details... / 检查注册详情中...");
    
    saveFormData(values);
    
    const duplicates = await checkForDuplicatePhoneNumbers(values);
    
    if (duplicates.length > 0) {
      toast.dismiss(toastId);
      setDuplicatePhoneNumbers(duplicates);
      setFormValues(values);
      setShowConfirmation(true);
      return;
    }
    
    await submitForm(values, toastId);
  };

  const submitForm = async (values: z.infer<typeof formSchema>, toastId: string) => {
    setIsSubmitting(true);
    setMessage('');
    
    toast.loading("Processing registration... / 处理注册中...", { id: toastId });
    
    try {
      const customFieldValues = values.groups.map((group, index) => ({
        groupId: `group_${index + 1}`,
        fields: Object.entries(group).map(([key, value]) => {
          const field = customFields.find(f => f.id === key) as CustomField;
          // Save first person's postal code
          if (index === 0 && field?.type === 'postal') {
            const postalValue = String(value);
            localStorage.setItem('lastUsedPostal', postalValue);
            setCookie('lastUsedPostal', postalValue, { maxAge: 60 * 60 * 24 * 30 }); // 30 days
          }
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
        throw new Error(`Failed to create order: ${response.statusText}`);
      }

      const data = await response.json();
      
      toast.success("Registration successful! / 注册成功！", { id: toastId });
      router.push(`/orders/${data.order._id}`);
    } catch (error) {
      console.error('Error submitting form:', error);
      
      toast.error("Registration failed. Please try again. / 注册失败，请重试。", { id: toastId });
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

  useEffect(() => {
    // Load saved form data from cookies
    const savedFormData = getCookie('lastUsedFields');
    if (savedFormData) {
      try {
        const parsedData = JSON.parse(savedFormData as string);
        setLastUsedFields(parsedData);
        
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
            const personIndex = parseInt(entry.target.id.split('-')[1]);
            setCurrentStep(personIndex);
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
      if (name?.includes('postal')) {
        const postalField = customFields.find(f => f.type === 'postal')?.id;
        if (postalField) {
          debouncedSaveForm(form.getValues());
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [form, debouncedSaveForm]);

  const validatePostalCode = (code: string, country: string | null) => {
    if (!code) return '';
    if (country === 'Singapore' && !/^\d{6}$/.test(code)) {
      return 'Must be 6 digits for Singapore / 新加坡邮区编号必须是6位数字';
    }
    if (country === 'Malaysia' && !/^\d{5}$/.test(code)) {
      return 'Must be 5 digits for Malaysia / 马来西亚邮区编号必须是5位数字';
    }
    return '';
  };

  return (
    <div className="max-w-3xl mx-auto">
      {isCountryLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary-500 border-t-transparent"></div>
            <p className="text-gray-600 font-medium">Loading... 加载中...</p>
          </div>
        </div>
      ) : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {message && <p className="text-red-500">{message}</p>}
            {isFullyBooked ? (
              <div className="p-6 bg-red-50 rounded-lg border border-red-200 text-center">
                <p className="text-red-600 font-medium text-lg">This event is fully booked. 此活动已满员。</p>
              </div>
            ) : (
              <>
                {fields.map((field, personIndex) => (
                  <div 
                    key={field.id}
                    id={`person-${personIndex}`}
                    className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden scroll-mt-6"
                  >
                    <div className="bg-gradient-to-r from-primary-500/10 to-transparent px-6 py-4 border-b border-gray-200">
                      <h3 className="text-xl font-semibold text-primary-700">
                        Person {personIndex + 1} / 参加者 {personIndex + 1}
                      </h3>
                    </div>

                    <div className="p-6 space-y-8">
                      {customFields.map((customField, fieldIndex) => (
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
                                            Switch back to SG/MY phone number format / 切换回新马电话格式
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
                                            Using a phone number from another country? Click here / 使用其他国家的电话号码？点击这里
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  ) : customField.type === 'radio' ? (
                                    <div className="flex gap-6">
                                      {('options' in customField) && customField.options?.map((option) => (
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
                                        className={`max-w-md ${
                                          validatePostalCode(formField.value as string, userCountry) 
                                            ? 'border-red-500 focus:border-red-500' 
                                            : ''
                                        }`}
                                        value={String(formField.value)}
                                        placeholder={
                                          userCountry === 'Singapore' 
                                            ? "e.g. 123456" 
                                            : userCountry === 'Malaysia'
                                              ? "e.g. 12345"
                                              : "Enter postal code"
                                        }
                                        onChange={(e) => {
                                          formField.onChange(e);
                                          const error = validatePostalCode(e.target.value, userCountry);
                                          if (error) {
                                            form.setError(`groups.${personIndex}.${customField.id}`, {
                                              type: 'manual',
                                              message: error
                                            });
                                          } else {
                                            form.clearErrors(`groups.${personIndex}.${customField.id}`);
                                          }
                                        }}
                                      />
                                      {personIndex > 0 && (
                                        <div className="flex items-center gap-2 mt-2">
                                          <Checkbox
                                            checked={formField.value === form.getValues(`groups.0.${customField.id}`)}
                                            onCheckedChange={(checked) => {
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
                                            Use same as Person 1 / 使用与参加者1相同
                                          </label>
                                        </div>
                                      )}
                                      {validatePostalCode(formField.value as string, userCountry) && (
                                        <p className="text-sm text-red-500 pl-1">
                                          {validatePostalCode(formField.value as string, userCountry)}
                                        </p>
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
                          onClick={() => remove(personIndex)}
                          className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white h-10"
                        >
                          Remove Person {personIndex + 1} / 删除参加者 {personIndex + 1}
                        </Button>
                      </div>
                    )}
                  </div>
                ))}

                <div className="flex flex-col sm:flex-row gap-4 pt-6">
                  <Button
                    type="button"
                    onClick={handleAddPerson}
                    disabled={fields.length >= event.maxSeats}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-900 gap-2 text-base font-medium h-12 border-2 border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <PlusIcon className="w-5 h-5" />
                    Add Another Person / 添加参加者
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-base font-medium h-12 disabled:bg-blue-400"
                  >
                    {isSubmitting ? (
                      <div className="flex items-center gap-2">
                        <Loader2Icon className="w-4 h-4 animate-spin" />
                        Submitting... / 提交中...
                      </div>
                    ) : (
                      'Complete Registration / 完成注册'
                    )}
                  </Button>
                </div>
              </>
            )}
          </form>
        </Form>
      )}

      <Dialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <DialogContent className="bg-white sm:max-w-md">
          <DialogHeader className="space-y-3">
            <DialogTitle className="text-xl font-semibold text-gray-900">
              Duplicate Registration Found / 发现重复注册
            </DialogTitle>
            <DialogDescription className="space-y-4">
              <p className="text-gray-700 text-base">
                The following phone numbers are already registered: / 以下电话号码已注册：
              </p>
              <ul className="list-disc pl-6 space-y-1">
                {duplicatePhoneNumbers.map((phone) => (
                  <li key={phone} className="text-red-600 font-medium">{phone}</li>
                ))}
              </ul>
              <p className="text-gray-700 text-base pt-2">
                Do you still want to proceed? / 您是否仍要继续？
              </p>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col sm:flex-row gap-3 mt-6">
            <Button
              variant="outline"
              onClick={() => setShowConfirmation(false)}
              className="w-full sm:w-auto border-gray-300 hover:bg-gray-50"
            >
              Cancel / 取消
            </Button>
            <Button
              onClick={() => {
                setShowConfirmation(false);
                if (formValues) {
                  submitForm(formValues, toast.loading("Processing registration... / 处理注册中..."));
                }
              }}
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white"
            >
              Continue / 继续
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default RegisterFormClient
