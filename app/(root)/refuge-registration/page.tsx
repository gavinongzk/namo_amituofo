"use client"

import { useState } from 'react'
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
import 'react-phone-number-input/style.css'

const phoneInputStyles = `
  .phone-input-enhanced {
    display: flex;
    align-items: stretch;
    border: 2px solid #e5e7eb;
    border-radius: 0.5rem;
    background: white;
    transition: all 0.2s ease-in-out;
    overflow: hidden;
  }
  
  .phone-input-enhanced:focus-within {
    border-color: #f97316;
    box-shadow: 0 0 0 3px rgba(249, 115, 22, 0.1);
    outline: none;
  }
  
  .phone-input-enhanced .PhoneInputCountry {
    display: flex;
    align-items: center;
    padding: 0.75rem 0.5rem;
    background: #f9fafb;
    border-right: 2px solid #e5e7eb;
    margin: 0;
  }
  
  .phone-input-enhanced:focus-within .PhoneInputCountry {
    background: #fef3c7;
    border-right-color: #f97316;
  }
  
  .phone-input-enhanced .PhoneInputCountryIcon {
    width: 1.5rem;
    height: 1.5rem;
    margin-right: 0.5rem;
    box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.1);
    border-radius: 2px;
  }
  
  .phone-input-enhanced .PhoneInputCountrySelect {
    border: none;
    background: transparent;
    padding: 0;
    margin: 0;
    font-size: 0.875rem;
    font-weight: 500;
    color: #374151;
    cursor: pointer;
    outline: none;
  }
  
  .phone-input-enhanced .PhoneInputCountrySelect:focus {
    outline: none;
  }
  
  .phone-input-enhanced .PhoneInputCountrySelectArrow {
    opacity: 0.6;
    margin-left: 0.25rem;
    width: 0.75rem;
    height: 0.75rem;
  }
  
  .phone-input-enhanced .PhoneInputInput {
    flex: 1;
    border: none;
    border-radius: 0;
    padding: 0.75rem 1rem;
    font-size: 1rem;
    line-height: 1.5rem;
    background: white;
    outline: none;
    color: #111827;
  }
  
  .phone-input-enhanced .PhoneInputInput::placeholder {
    color: #9ca3af;
  }
  
  .phone-input-enhanced .PhoneInputInput:focus {
    outline: none;
    background: white;
  }
  
  /* Remove default borders and styling */
  .phone-input-enhanced .PhoneInputCountryIcon--border {
    border: none;
    box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.1);
  }
`

const refugeFormSchema = z.object({
  chineseName: z.string().min(1, '中文名字是必填项 / Chinese Name is required'),
  englishName: z.string().min(1, '英文名字是必填项 / English Name is required'),
  age: z.string().min(1, '年龄是必填项 / Age is required').regex(/^\d+$/, '年龄必须是数字 / Age must be a number'),
  dob: z.string().min(1, '出生日期是必填项 / Date of Birth is required'),
  gender: z.string().min(1, '性别是必填项 / Gender is required'),
  contactNumber: z.string().min(1, '联系号码是必填项 / Contact Number is required'),
  address: z.string().min(1, '地址是必填项 / Address is required'),
}).refine((data) => {
  // Validate phone number format
  if (data.contactNumber) {
    return isValidPhoneNumber(data.contactNumber);
  }
  return true;
}, {
  message: '联系号码格式无效 / Invalid phone number format',
  path: ['contactNumber'],
})

type RefugeFormData = z.infer<typeof refugeFormSchema>

export default function RefugeRegistrationPage() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const form = useForm<RefugeFormData>({
    resolver: zodResolver(refugeFormSchema),
    defaultValues: {
      chineseName: '',
      englishName: '',
      age: '',
      dob: '',
      gender: '',
      contactNumber: '+65',
      address: '',
    }
  })

  const onSubmit = async (data: RefugeFormData) => {
    setIsSubmitting(true)
    try {
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
              <h1 className="text-3xl font-bold text-orange-800 mb-4">感恩您的发心</h1>
              <p className="text-lg text-gray-700 mb-6">
                您的报名已成功提交！我们会尽快与您联系，安排皈依事宜。
              </p>
              <p className="text-gray-600 mb-4">
                南无阿弥陀佛 🙏
              </p>
              <Button 
                onClick={() => {
                  setIsSubmitted(false)
                  form.reset()
                }}
                className="bg-orange-600 hover:bg-orange-700"
              >
                返回报名页面 / Return to Registration
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
                      <div className="w-full">
                        <PhoneInput
                          value={field.value as string}
                          onChange={(value) => field.onChange(value || '')}
                          defaultCountry="SG"
                          countries={["SG", "MY"]}
                          international
                          countryCallingCodeEditable={false}
                          className="phone-input-enhanced"
                          withCountryCallingCode
                          placeholder="Enter phone number"
                        />
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
    </div>
  )
}

