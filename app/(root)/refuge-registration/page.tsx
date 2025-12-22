"use client"

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import PhoneInput, { isValidPhoneNumber } from 'react-phone-number-input'
import { toast } from 'react-hot-toast'
import { useUser } from '@clerk/nextjs'
import { getCookie, setCookie } from 'cookies-next'
import * as Sentry from '@sentry/nextjs'
import 'react-phone-number-input/style.css'
import { useSearchParams } from 'next/navigation'

const phoneInputStyles = `
  .phone-input-enhanced .PhoneInput {
    display: flex;
    align-items: stretch;
    border: 2px solid #e5e7eb;
    border-radius: 0.5rem;
    overflow: hidden;
    transition: border-color 0.2s, box-shadow 0.2s;
  }
  
  .phone-input-enhanced .PhoneInput:focus-within {
    border-color: #f97316;
    box-shadow: 0 0 0 2px rgba(249, 115, 22, 0.1);
    outline: none;
  }
  
  .phone-input-enhanced .PhoneInputCountrySelect {
    border: none;
    border-right: 1px solid #e5e7eb;
    padding: 0.75rem 0.5rem;
    background: white;
    cursor: pointer;
  }
  
  .phone-input-enhanced .PhoneInputCountrySelect:focus {
    outline: none;
  }
  
  .phone-input-enhanced .PhoneInputInput {
    border: none;
    border-radius: 0;
    padding: 0.75rem 1rem;
    font-size: 1rem;
    line-height: 1.5rem;
    height: auto;
    flex: 1;
    outline: none;
  }
  
  .phone-input-enhanced .PhoneInputInput:focus {
    outline: none;
  }
`

// Helper function to get default country code
const getDefaultCountry = (country: string | null) => {
  return country === 'Malaysia' ? 'MY' : 'SG';
}

const refugeFormSchema = z.object({
  chineseName: z.string().min(1, '中文名字是必填项 / Chinese Name is required'),
  englishName: z.string().min(1, '英文名字是必填项 / English Name is required'),
  age: z.string().min(1, '年龄是必填项 / Age is required').regex(/^\d+$/, '年龄必须是数字 / Age must be a number'),
  dob: z.string().min(1, '出生日期是必填项 / Date of Birth is required'),
  gender: z.string().min(1, '性别是必填项 / Gender is required'),
  contactNumber: z.string().min(1, '联系号码是必填项 / Contact Number is required'),
  address: z.string().min(1, '地址是必填项 / Address is required'),
})

type RefugeFormData = z.infer<typeof refugeFormSchema>

export default function RefugeRegistrationPage() {
  const { user, isLoaded } = useUser()
  const searchParams = useSearchParams()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [userCountry, setUserCountry] = useState<string | null>(null)
  const [phoneOverride, setPhoneOverride] = useState(false)
  const [isCountryLoading, setIsCountryLoading] = useState(true)
  const prefillAppliedRef = useRef(false)

  // Detect user country
  useEffect(() => {
    const detectCountry = async () => {
      setIsCountryLoading(true)
      try {
        // First check if we have a country in cookie
        const cookieCountry = getCookie('userCountry')
        if (cookieCountry) {
          setUserCountry(cookieCountry as string)
          setIsCountryLoading(false)
          return
        }

        // Then check if user is logged in and has country in metadata
        if (isLoaded && user && user.publicMetadata.country) {
          setUserCountry(user.publicMetadata.country as string)
          setIsCountryLoading(false)
          return
        }

        // If no cookie or user metadata, use IP detection
        const response = await fetch('https://get.geojs.io/v1/ip/country.json')
        const data = await response.json()
        const detectedCountry = data.country === 'SG' 
          ? 'Singapore' 
          : data.country === 'MY' 
            ? 'Malaysia' 
            : 'Singapore'
        
        setUserCountry(detectedCountry)
        try {
          setCookie('userCountry', detectedCountry)
        } catch (error) {
          console.error('Error setting cookie:', error)
        }
      } catch (error) {
        console.error('Error detecting country:', error)
        Sentry.captureException(error)
        setUserCountry('Singapore')
      } finally {
        setIsCountryLoading(false)
      }
    }
    detectCountry()
  }, [isLoaded, user])

  const form = useForm<RefugeFormData>({
    resolver: zodResolver(refugeFormSchema),
    defaultValues: {
      chineseName: '',
      englishName: '',
      age: '',
      dob: '',
      gender: '',
      contactNumber: userCountry === 'Malaysia' ? '+60' : '+65',
      address: '',
    }
  })

  // Apply prefill from query params (e.g. coming from event registration)
  useEffect(() => {
    if (prefillAppliedRef.current) return;
    if (!searchParams) return;

    const englishName = searchParams.get('englishName') || '';
    const contactNumber = searchParams.get('contactNumber') || '';

    if (englishName) form.setValue('englishName', englishName);
    if (contactNumber) form.setValue('contactNumber', contactNumber);

    if (englishName || contactNumber) {
      prefillAppliedRef.current = true;
    }
  }, [searchParams, form]);

  // Update default phone number when country is detected
  useEffect(() => {
    if (!userCountry) return;
    if (prefillAppliedRef.current) return;
    const current = form.getValues('contactNumber');
    if (!current || current === '+65' || current === '+60') {
      form.setValue('contactNumber', userCountry === 'Malaysia' ? '+60' : '+65');
    }
  }, [userCountry, form])

  const onSubmit = async (data: RefugeFormData) => {
    setIsSubmitting(true)
    
    try {
      // Validate phone number
      const phoneNumber = data.contactNumber || ''
      
      if (phoneOverride) {
        // For overridden numbers, just check if it starts with + and contains only numbers after that
        if (!/^\+\d+$/.test(phoneNumber)) {
          toast.error('电话号码格式无效。必须以+开头，后跟数字 / Invalid phone number format. Must start with + followed by numbers')
          setIsSubmitting(false)
          return
        }
      } else {
        // Regular phone validation for SG/MY numbers
        if (!isValidPhoneNumber(phoneNumber)) {
          toast.error('联系号码无效 / Invalid phone number')
          setIsSubmitting(false)
          return
        }
      }

      const response = await fetch('/api/refuge-registration', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to submit registration')
      }

      const result = await response.json()
      console.log('Refuge registration successful:', result)
      
      setIsSubmitted(true)
      toast.success('报名成功！/ Registration successful!')
    } catch (error: any) {
      console.error('Error submitting refuge registration:', error)
      toast.error(error.message || '提交失败，请重试 / Submission failed, please try again')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <Card className="p-8 text-center">
            <div className="mb-6">
              <div className="text-6xl mb-4">🪷</div>
              <h1 className="text-3xl font-bold text-orange-800 mb-4">皈依报名成功
              / Registration Successful</h1>
              <p className="text-lg text-gray-700 mb-6 ml-12">
              随喜您的发心，您的皈依申请已成功提交，请于弥陀诞辰法会当天准时出席。南無阿彌陀佛

              注：如还需为多一位报名皈依，请点选下方按钮。

              Rejoice in your sincere aspiration. Your refuge application has been successfully submitted. Please be present on the day of the Amitabha Birthday Dharma Ceremony. Namo Amituofo.

              Note: If you need to register another person for refuge, please click the button below.
              </p>
              <Button 
                onClick={() => {
                  setIsSubmitted(false)
                  form.reset()
                }}
                className="bg-orange-600 hover:bg-orange-700"
              >
                再报名皈依 / Refuge Registration
              </Button>
            </div>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 py-8 px-4">
      <style dangerouslySetInnerHTML={{ __html: phoneInputStyles }} />
      {isCountryLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-orange-500 border-t-transparent"></div>
            <p className="text-gray-600 font-medium">加载中... / Loading...</p>
          </div>
        </div>
      ) : (
        <div className="max-w-3xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-orange-500 to-amber-500 rounded-full mb-4">
            <span className="text-white text-2xl">🪷</span>
          </div>
          <h1 className="text-4xl font-bold text-orange-800 mb-4">
            报名：净土宗皈依
          </h1>
          <p className="text-xl text-gray-700 mb-6">
            Pure Land Buddhism Taking Refuge Registration
          </p>
          <div className="bg-white/90 backdrop-blur-md rounded-2xl p-6 shadow-xl border border-orange-200/50">
            <div className="space-y-3 text-left">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <p className="font-semibold text-orange-700">主办单位 / Organiser:</p>
              </div>
              <p className="text-gray-700 ml-4">新加坡 净土宗弥陀寺</p>
              <p className="text-gray-700 ml-4">Namo Amituofo Organization Ltd</p>
              <div className="space-y-1 text-gray-600 ml-4">
                <p>📍 No. 27, Lor 27, Geylang, Singapore 388163</p>
                <p>📞 +65-8818 4848</p>
              </div>
            </div>
          </div>
        </div>

        {/* Registration Form */}
        <Card className="p-8 shadow-xl border-0 bg-white/95 backdrop-blur-sm">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-orange-500 to-amber-500 rounded-full mb-4">
              <span className="text-white text-xl">📝</span>
            </div>
            <h2 className="text-2xl font-bold text-orange-800 mb-2">
              报名表格 / Registration Form
            </h2>
            <p className="text-gray-600 text-sm">* Indicates required question</p>
          </div>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="chineseName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 font-medium">
                      中文名字 Chinese Name *
                    </FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="请输入中文名字 / Please enter Chinese name" 
                        {...field} 
                        className="border-orange-200 focus:border-orange-400"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="englishName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 font-medium">
                      英文名字 English Name *
                    </FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Please enter English name" 
                        {...field} 
                        className="border-orange-200 focus:border-orange-400"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="age"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 font-medium">
                      年龄 Age *
                    </FormLabel>
                    <FormControl>
                      <Input 
                        type="number"
                        placeholder="请输入年龄 / Please enter age" 
                        {...field} 
                        className="border-orange-200 focus:border-orange-400"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dob"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 font-medium">
                      出生日期 DOB *
                    </FormLabel>
                    <FormControl>
                      <Input 
                        type="date"
                        {...field} 
                        className="border-orange-200 focus:border-orange-400"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="gender"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 font-medium">
                      性别 Gender *
                    </FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="border-orange-200 focus:border-orange-400">
                          <SelectValue placeholder="请选择 / Please select" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="male">男众 Male</SelectItem>
                        <SelectItem value="female">女众 Female</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="contactNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 font-medium">
                      联系号码 Contact Number *
                    </FormLabel>
                    <FormControl>
                      <div className="space-y-2 sm:space-y-3 p-2 sm:p-4 bg-white rounded-md">
                        {phoneOverride ? (
                          <div className="space-y-2">
                            <Input
                              {...field}
                              value={String(field.value)}
                              type="tel"
                              className="w-full h-10 sm:h-12 text-base sm:text-lg border-2 border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-100 rounded-lg"
                              placeholder="e.g. +8613812345678"
                            />
                            <p className="text-sm text-gray-600 pl-1">
                              Format: +[country code][number]
                            </p>
                            <button
                              type="button"
                              onClick={() => {
                                setPhoneOverride(false)
                                form.setValue('contactNumber', userCountry === 'Malaysia' ? '+60' : '+65')
                              }}
                              className="text-orange-500 hover:text-orange-600 hover:underline text-xs mt-1"
                            >
                              Switch back to SG/MY phone number format 切换回新马电话格式
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <div className="phone-input-container w-full">
                              <PhoneInput
                                value={field.value as string}
                                onChange={(value) => field.onChange(value || '')}
                                defaultCountry={getDefaultCountry(userCountry)}
                                countries={["SG", "MY"]}
                                international
                                countryCallingCodeEditable={false}
                                className="h-10 sm:h-12 text-base sm:text-lg phone-input-enhanced"
                                withCountryCallingCode
                              />
                            </div>
                            <div className="hidden sm:flex items-center gap-2 text-xs text-gray-500 bg-blue-50 p-2 rounded">
                              <div className="w-1 h-1 bg-blue-400 rounded-full"></div>
                              <span>Singapore (+65) or Malaysia (+60) numbers only</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setPhoneOverride(true)
                                form.setValue('contactNumber', '')
                              }}
                              className="text-orange-500 hover:text-orange-600 hover:underline text-xs mt-1"
                            >
                              使用其他国家的电话号码？点击这里 Using a phone number from another country? Click here
                            </button>
                          </div>
                        )}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 font-medium">
                      地址 Address *
                    </FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="请输入地址 / Please enter address" 
                        {...field} 
                        className="border-orange-200 focus:border-orange-400"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="text-center pt-8">
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white px-16 py-4 text-lg font-semibold rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:transform-none"
                >
                  {isSubmitting ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>提交中... / Submitting...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <span>提交 / Submit</span>
                      <span>🙏</span>
                    </div>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 p-6 bg-white/80 backdrop-blur-sm rounded-2xl border border-orange-200/50 shadow-lg">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-orange-500 to-amber-500 rounded-full mb-4">
            <span className="text-white text-lg">🏛️</span>
          </div>
          <h3 className="text-xl font-semibold text-orange-700 mb-3">净土宗弥陀寺（新加坡）</h3>
          <p className="text-gray-700 mb-2">Namo Amituofo Organization Ltd</p>
          <div className="space-y-1 text-gray-600">
            <p>📍 No. 27, Lor 27, Geylang, Singapore 388163</p>
            <p>📞 +65-8818 4848</p>
          </div>
        </div>
      </div>
      )}
    </div>
  )
}

