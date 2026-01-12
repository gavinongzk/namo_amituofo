"use client"

import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import PhoneInput, { isValidPhoneNumber } from 'react-phone-number-input'
import { toast } from 'react-hot-toast'
import { useUser } from '@clerk/nextjs'
import { getCookie, setCookie } from 'cookies-next'
import * as Sentry from '@sentry/nextjs'
import 'react-phone-number-input/style.css'
import { VoiceRefugeFormAssistant } from '@/components/shared/VoiceRefugeFormAssistant'
import { refugeFormSchema, type RefugeFormData } from '@/lib/forms/refugeForm'

const phoneInputStyles = `
  .phone-input-enhanced .PhoneInput {
    display: flex;
    align-items: stretch;
    border: 2px solid #e5e7eb;
    border-radius: 0.5rem;
    overflow: hidden;
    transition: border-color 0.2s, box-shadow 0.2s;
    background: white;
  }
  
  .phone-input-enhanced .PhoneInput:focus-within {
    border-color: #f97316;
    box-shadow: 0 0 0 2px rgba(249, 115, 22, 0.1);
    outline: none;
  }
  
  .phone-input-enhanced .PhoneInputInput {
    border: none;
    padding: 0.75rem 1rem;
    font-size: 1.125rem;
    line-height: 1.75rem;
    height: 3.5rem;
    flex: 1;
    outline: none;
  }

  .phone-input-enhanced .PhoneInputCountry {
    border-right: 1px solid #e5e7eb;
    padding: 0 0.75rem;
    display: flex;
    align-items: center;
    background: #fffaf0;
  }
  
  .phone-input-enhanced .PhoneInputCountrySelect {
    border: none;
    padding: 0;
    margin: 0;
    cursor: pointer;
    background: transparent;
  }
  
  .phone-input-enhanced .PhoneInputCountrySelect:focus {
    outline: none;
  }

  .phone-input-enhanced .PhoneInputCountryIcon {
    width: 1.5rem;
    height: auto;
  }

  .phone-input-enhanced .PhoneInputCountrySelectArrow {
    margin-left: 0.25rem;
  }
`

// Helper function to get default country code
const getDefaultCountry = (country: string | null) => {
  return country === 'Malaysia' ? 'MY' : 'SG'
}

export type RefugeFormInitialValues = Partial<Pick<
  RefugeFormData,
  'chineseName' | 'englishName' | 'contactNumber' | 'age' | 'dob' | 'gender' | 'address'
>>

export function RefugeRegistrationForm({
  variant = 'page',
  initialValues,
  autoFocusEnglishName = false,
  onSubmitted,
}: {
  variant?: 'page' | 'dialog'
  initialValues?: RefugeFormInitialValues
  autoFocusEnglishName?: boolean
  onSubmitted?: () => void
}) {
  const { user, isLoaded } = useUser()
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
        const cookieCountry = getCookie('userCountry')
        if (cookieCountry) {
          setUserCountry(cookieCountry as string)
          setIsCountryLoading(false)
          return
        }

        if (isLoaded && user && user.publicMetadata.country) {
          setUserCountry(user.publicMetadata.country as string)
          setIsCountryLoading(false)
          return
        }

        const response = await fetch('https://get.geojs.io/v1/ip/country.json')
        const data = await response.json()
        const detectedCountry =
          data.country === 'SG'
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
    },
  })

  // Apply prefill from parent (order page / query params wrapper)
  useEffect(() => {
    if (prefillAppliedRef.current) return
    if (!initialValues) return

    const entries = Object.entries(initialValues) as Array<[keyof RefugeFormInitialValues, any]>
    for (const [key, value] of entries) {
      if (value === undefined || value === null || value === '') continue
      form.setValue(key as keyof RefugeFormData, String(value))
    }
    prefillAppliedRef.current = true
  }, [initialValues, form])

  // Update default phone number when country is detected (avoid overwriting prefill)
  useEffect(() => {
    if (!userCountry) return
    if (prefillAppliedRef.current) return
    const current = form.getValues('contactNumber')
    if (!current || current === '+65' || current === '+60') {
      form.setValue('contactNumber', userCountry === 'Malaysia' ? '+60' : '+65')
    }
  }, [userCountry, form])

  const onSubmit = async (data: RefugeFormData) => {
    setIsSubmitting(true)
    try {
      const phoneNumber = data.contactNumber || ''
      if (phoneOverride) {
        if (!/^\+\d+$/.test(phoneNumber)) {
          toast.error('电话号码格式无效。必须以+开头，后跟数字 / Invalid phone number format. Must start with + followed by numbers')
          return
        }
      } else {
        if (!isValidPhoneNumber(phoneNumber)) {
          toast.error('联系号码无效 / Invalid phone number')
          return
        }
      }

      const response = await fetch('/api/refuge-registration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to submit registration')
      }

      setIsSubmitted(true)
      toast.success('报名成功！/ Registration successful!')
      onSubmitted?.()
    } catch (error: any) {
      console.error('Error submitting refuge registration:', error)
      toast.error(error.message || '提交失败，请重试 / Submission failed, please try again')
    } finally {
      setIsSubmitting(false)
    }
  }

  const content = (
    <>
      <style dangerouslySetInnerHTML={{ __html: phoneInputStyles }} />
      {isCountryLoading ? (
        <div className="flex items-center justify-center py-6">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-orange-500 border-t-transparent" />
            <p className="text-gray-600 font-medium text-sm">加载中... / Loading...</p>
          </div>
        </div>
      ) : isSubmitted ? (
        <Card className={variant === 'dialog' ? 'p-6 text-center' : 'p-8 text-center'}>
          <div className="mb-4">
            <h2 className="text-xl font-bold text-orange-800 mb-2">皈依报名成功 / Registration Successful</h2>
            <p className="text-sm text-gray-700">
              随喜您的发心，您的皈依申请已成功提交。请于法会当天准时出席。南無阿彌陀佛。
              <br />
              Rejoice in your sincere aspiration. Please be present on the event day. Namo Amituofo.
            </p>
          </div>
          <Button
            onClick={() => {
              setIsSubmitted(false)
              form.reset()
              prefillAppliedRef.current = false
            }}
            className="bg-orange-600 hover:bg-orange-700"
          >
            再报名皈依 / Register Another
          </Button>
        </Card>
      ) : (
        <Card className={variant === 'dialog' ? 'p-4 sm:p-6 shadow-none border-0' : 'p-8 shadow-xl border-0 bg-white/95 backdrop-blur-sm'}>
          {variant === 'page' && (
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-orange-500 to-amber-500 rounded-full mb-4">
                <span className="text-white text-xl">📝</span>
              </div>
              <h2 className="text-2xl font-bold text-orange-800 mb-2">报名表格 / Registration Form</h2>
              <p className="text-gray-600 text-sm">* Indicates required question</p>
            </div>
          )}

          <VoiceRefugeFormAssistant
            disabled={isSubmitting}
            getValues={() => form.getValues()}
            applyUpdates={(updates) => {
              for (const [k, v] of Object.entries(updates)) {
                if (typeof v !== 'string') continue
                form.setValue(k as keyof RefugeFormData, v, { shouldDirty: true, shouldValidate: true })
              }
            }}
          />

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="chineseName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 font-medium">中文姓名 Chinese Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="请输入中文姓名 / Please enter Chinese name" {...field} className="border-orange-200 focus:border-orange-400" />
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
                    <FormLabel className="text-gray-700 font-medium">英文姓名 English Name *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Please enter English name"
                        {...field}
                        autoFocus={autoFocusEnglishName}
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
                    <FormLabel className="text-gray-700 font-medium">年龄 Age *</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="请输入年龄 / Please enter age" {...field} className="border-orange-200 focus:border-orange-400" />
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
                    <FormLabel className="text-gray-700 font-medium">出生日期 DOB *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} className="border-orange-200 focus:border-orange-400" />
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
                    <FormLabel className="text-gray-700 font-medium">性别 Gender *</FormLabel>
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
                    <FormLabel className="text-gray-700 font-medium">联系号码 Contact Number *</FormLabel>
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
                            <p className="text-sm text-gray-600 pl-1">Format: +[country code][number]</p>
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
                            <div className="flex items-center gap-2 text-xs text-gray-500 bg-blue-50 p-2 rounded">
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
                    <FormLabel className="text-gray-700 font-medium">地址 Address *</FormLabel>
                    <FormControl>
                      <Input placeholder="请输入地址 / Please enter address" {...field} className="border-orange-200 focus:border-orange-400" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" disabled={isSubmitting} className="w-full bg-orange-600 hover:bg-orange-700">
                {isSubmitting ? '提交中... Submitting...' : '提交 Submit'}
              </Button>
            </form>
          </Form>
        </Card>
      )}
    </>
  )

  if (variant === 'dialog') {
    return <div className="w-full">{content}</div>
  }

  // Page variant keeps the original full-page look
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 py-8 px-4">
      {content}
    </div>
  )
}


