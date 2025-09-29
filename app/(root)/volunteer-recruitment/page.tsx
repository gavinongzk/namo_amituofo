"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import Image from 'next/image'

const volunteerFormSchema = z.object({
  name: z.string().min(1, '名字是必填项'),
  dharmaName: z.string().optional(),
  contactNumber: z.string().min(1, '联系号码是必填项'),
  willingToParticipate: z.string().min(1, '请选择是否愿意参与'),
  participationFrequency: z.string().optional(),
  otherFrequency: z.string().optional(),
  inquiries: z.string().optional(),
}).refine((data) => {
  // If willing to participate is 'yes', then participation frequency is required
  if (data.willingToParticipate === 'yes') {
    return data.participationFrequency && data.participationFrequency.trim().length > 0;
  }
  return true;
}, {
  message: '请选择参与频率',
  path: ['participationFrequency'],
}).refine((data) => {
  // If participationFrequency is 'other', then otherFrequency must be provided
  if (data.participationFrequency === 'other') {
    return data.otherFrequency && data.otherFrequency.trim().length > 0;
  }
  return true;
}, {
  message: '请注明其他参与频率',
  path: ['otherFrequency'], // This will show the error on the otherFrequency field
})

type VolunteerFormData = z.infer<typeof volunteerFormSchema>

export default function VolunteerRecruitmentPage() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const form = useForm<VolunteerFormData>({
    resolver: zodResolver(volunteerFormSchema),
    defaultValues: {
      name: '',
      dharmaName: '',
      contactNumber: '',
      willingToParticipate: '',
      participationFrequency: '',
      otherFrequency: '',
      inquiries: '',
    }
  })

  const onSubmit = async (data: VolunteerFormData) => {
    setIsSubmitting(true)
    try {
      const response = await fetch('/api/volunteer-registration', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error('Failed to submit volunteer registration')
      }

      const result = await response.json()
      console.log('Volunteer registration successful:', result)
      
      setIsSubmitted(true)
    } catch (error) {
      console.error('Error submitting volunteer registration:', error)
      // You could add error handling UI here
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <Card className="p-8 text-center">
            <div className="mb-6">
              <div className="text-6xl mb-4">🪷</div>
              <h1 className="text-3xl font-bold text-purple-800 mb-4">感恩您的发心</h1>
              <p className="text-lg text-gray-700 mb-6">
                您的义工申请已成功提交！我们会尽快与您联系，安排义工服务事宜。
              </p>
              <p className="text-gray-600">
                南无阿弥陀佛 🙏
              </p>
            </div>
            <Button 
              onClick={() => {
                setIsSubmitted(false)
                form.reset()
              }}
              className="bg-purple-600 hover:bg-purple-700"
            >
              返回申请页面
            </Button>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-12">
          {/* Volunteer Registration Image */}
          <div className="mb-8 relative">
            <div className="absolute inset-0 bg-gradient-to-t from-purple-900/20 to-transparent rounded-2xl"></div>
            <Image
              src="/assets/images/volunteer-registration.jpeg"
              alt="新加坡净土儿童佛学班·义工招募"
              width={900}
              height={500}
              className="mx-auto rounded-2xl shadow-2xl max-w-full h-auto transform hover:scale-[1.02] transition-transform duration-500"
              priority
            />
          </div>
          
          {/* Event Details */}
          <div className="bg-white/90 backdrop-blur-md rounded-2xl p-8 max-w-3xl mx-auto shadow-xl border border-purple-200/50">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="text-left space-y-2">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <p className="font-semibold text-purple-700">活动类别 / Category:</p>
                </div>
                <p className="text-gray-700 ml-4">义工招募 / Volunteer Recruitment</p>
              </div>
              <div className="text-left space-y-2">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <p className="font-semibold text-purple-700">主办单位 / Organiser:</p>
                </div>
                <p className="text-gray-700 ml-4">净土宗弥陀寺（新加坡）</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <Card className="p-8 mb-8 shadow-xl border-0 bg-white/95 backdrop-blur-sm">
          <div className="prose prose-lg max-w-none">
            <div className="mb-8 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full mb-4">
                <span className="text-3xl">🪷</span>
              </div>
              <h2 className="text-3xl font-bold text-purple-800 mb-4">
                亲爱的义工菩萨们：
              </h2>
              <p className="text-gray-700 leading-relaxed text-lg max-w-3xl mx-auto">
                为了让孩子们在佛光中茁壮成长，「净土儿童佛学班」即将开课。本寺诚挚邀请大家一同加入义工之行，共同成就此殊胜因缘。
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="bg-gradient-to-br from-pink-50 to-pink-100 p-6 rounded-2xl border border-pink-200/50 hover:shadow-lg transition-shadow duration-300">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 bg-pink-500 rounded-full flex items-center justify-center mr-3">
                    <span className="text-white text-lg">⏰</span>
                  </div>
                  <h3 className="text-xl font-semibold text-purple-700">时间安排</h3>
                </div>
                <ul className="space-y-3 text-gray-700">
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-pink-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <span>上课时间：每月两次 · 星期六，上午10:00am – 11:00am</span>
                  </li>
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-pink-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <span>义工服务时间：上午9:30am - 11:30am</span>
                  </li>
                </ul>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-2xl border border-purple-200/50 hover:shadow-lg transition-shadow duration-300">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center mr-3">
                    <span className="text-white text-lg">⭐</span>
                  </div>
                  <h3 className="text-xl font-semibold text-purple-700">义工服务内容</h3>
                </div>
                <ul className="space-y-3 text-gray-700">
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <span>协助课堂秩序与安全照顾</span>
                  </li>
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <span>帮助带领儿童诵念「南无阿弥陀佛」</span>
                  </li>
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <span>协助讲解佛教启蒙故事与生活规范</span>
                  </li>
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <span>引导小组活动与游戏互动</span>
                  </li>
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <span>协助课程布置、清理与行政协助</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="bg-gradient-to-br from-yellow-50 to-amber-100 p-6 rounded-2xl border border-yellow-200/50 hover:shadow-lg transition-shadow duration-300">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center mr-3">
                    <span className="text-white text-lg">🎯</span>
                  </div>
                  <h3 className="text-xl font-semibold text-purple-700">义工条件</h3>
                </div>
                <ul className="space-y-3 text-gray-700">
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <span>发心护持佛法，愿意陪伴儿童成长</span>
                  </li>
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <span>年龄 18 岁以上，具备耐心与责任心</span>
                  </li>
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <span>无需有照顾小孩子的经验</span>
                  </li>
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <span>每月至少能参与一次活动</span>
                  </li>
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <span>女众义工、男众义工：皆可</span>
                  </li>
                </ul>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-emerald-100 p-6 rounded-2xl border border-green-200/50 hover:shadow-lg transition-shadow duration-300">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center mr-3">
                    <span className="text-white text-lg">🌸</span>
                  </div>
                  <h3 className="text-xl font-semibold text-purple-700">义工功德 · 菩萨行愿</h3>
                </div>
                <div className="space-y-4 text-gray-700">
                  <div className="bg-white/50 p-3 rounded-lg">
                    <p className="font-medium text-purple-600 mb-1">播下无尽的佛缘</p>
                    <p className="text-sm">陪伴儿童亲近佛法，种下念佛的善根，绽放来世无量光明。</p>
                  </div>
                  <div className="bg-white/50 p-3 rounded-lg">
                    <p className="font-medium text-purple-600 mb-1">增长慈悲与智慧</p>
                    <p className="text-sm">在服务中修菩萨行，柔软心、智慧心，成就自他无量功德。</p>
                  </div>
                  <div className="bg-white/50 p-3 rounded-lg">
                    <p className="font-medium text-purple-600 mb-1">共修共学·功德无边</p>
                    <p className="text-sm">与大众一同念佛、护持佛事，共享平生业成净土福慧。</p>
                  </div>
                  <div className="bg-white/50 p-3 rounded-lg">
                    <p className="font-medium text-purple-600 mb-1">庄严净土·利益众生</p>
                    <p className="text-sm">每一份护持，皆是庄严极乐世界的莲花，普利十方有情。</p>
                  </div>
                  <div className="bg-white/50 p-3 rounded-lg">
                    <p className="font-medium text-purple-600 mb-1">同行弥陀大愿</p>
                    <p className="text-sm">义工不仅是付出，更是与阿弥陀佛愿力相应，迈向究竟成佛之道。</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-purple-100 via-pink-100 to-indigo-100 p-8 rounded-2xl mb-8 border border-purple-200/50 shadow-lg">
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full mb-4">
                  <span className="text-white text-xl">💝</span>
                </div>
                <h3 className="text-2xl font-bold text-purple-800 mb-4">发心护持，成就无量功德</h3>
              </div>
              <div className="space-y-4 text-gray-700 leading-relaxed">
                <p className="text-center">
                  让我们以慈悲心护持「净土儿童佛学班」，在孩子纯洁的心田中播下念佛的种子，陪伴他们走在光明大道上，远离迷惘与黑暗。
                </p>
                <p className="text-center">
                  您所付出的每一份爱心与耐心，不仅是陪伴孩子学习，更是为他们点亮前途的明灯，让他们从小具足慈悲、智慧与感恩，成长为未来社会与佛门的栋梁。
                </p>
                <p className="text-center">
                  义工的护持，不只是一次服务，而是成就无量的福慧因缘；帮助一个孩子，就是护佑一个家庭，培育一代善根，就是延续佛法慧命。
                </p>
              </div>
            </div>

            <div className="text-center bg-gradient-to-br from-purple-50 to-pink-50 p-8 rounded-2xl border border-purple-200/50">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full mb-4">
                <span className="text-white text-2xl">🙏</span>
              </div>
              <p className="text-xl text-purple-700 font-semibold mb-3">
                让我们一同发心，陪伴孩子走向智慧与慈悲，共同成就净业，同归阿弥陀佛温暖的怀抱。
              </p>
              <p className="text-3xl text-purple-800 font-bold">
                南无阿弥陀佛 🙏
              </p>
            </div>
          </div>
        </Card>

        {/* Registration Form */}
        <Card className="p-8 shadow-xl border-0 bg-white/95 backdrop-blur-sm">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full mb-4">
              <span className="text-white text-2xl">📝</span>
            </div>
            <h2 className="text-3xl font-bold text-purple-800 mb-2">
              义工申请表格
            </h2>
            <p className="text-gray-600">请填写以下信息，我们会尽快与您联系</p>
          </div>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700 font-medium">1. 名字 *</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="请输入您的姓名" 
                          {...field} 
                          className="border-purple-200 focus:border-purple-400"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="dharmaName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700 font-medium">2. 净土宗皈依号</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="如有皈依号请填写" 
                          {...field} 
                          className="border-purple-200 focus:border-purple-400"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="contactNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 font-medium">3. 联系号码 *</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="请输入您的联系电话" 
                        {...field} 
                        className="border-purple-200 focus:border-purple-400"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="willingToParticipate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 font-medium">
                      4. 请问您是否愿意参与「净土儿童佛学班」的义工服务？ *
                    </FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="border-purple-200 focus:border-purple-400">
                          <SelectValue placeholder="请选择" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="yes">是的，我愿意参与</SelectItem>
                        <SelectItem value="no">暂时无法参与</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {form.watch('willingToParticipate') === 'yes' && (
                <FormField
                  control={form.control}
                  name="participationFrequency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700 font-medium">
                        5. 请问您大概每月能参与的次数？ *
                      </FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="border-purple-200 focus:border-purple-400">
                            <SelectValue placeholder="请选择" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="once">每月 1 次</SelectItem>
                          <SelectItem value="twice">每月 2 次</SelectItem>
                          <SelectItem value="other">其他（请注明）</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {form.watch('willingToParticipate') === 'yes' && form.watch('participationFrequency') === 'other' && (
                <FormField
                  control={form.control}
                  name="otherFrequency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700 font-medium">请注明其他参与频率</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="请详细说明您的参与频率" 
                          {...field} 
                          className="border-purple-200 focus:border-purple-400"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="inquiries"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 font-medium">6. 询问事项</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="如有任何疑问或需要了解的事项，请在此填写" 
                        {...field} 
                        className="border-purple-200 focus:border-purple-400 min-h-[100px]"
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
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-16 py-4 text-lg font-semibold rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:transform-none"
                >
                  {isSubmitting ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>提交中...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <span>提交申请</span>
                      <span>🙏</span>
                    </div>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </Card>

        {/* Footer */}
        <div className="text-center mt-12 p-8 bg-white/80 backdrop-blur-sm rounded-2xl border border-purple-200/50 shadow-lg">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full mb-4">
            <span className="text-white text-lg">🏛️</span>
          </div>
          <h3 className="text-xl font-semibold text-purple-700 mb-3">净土宗弥陀寺（新加坡）</h3>
          <p className="text-gray-700 mb-2">Namo Amituofo Organization Ltd</p>
          <div className="space-y-1 text-gray-600">
            <p>📍 27, Lor 27, Geylang, S&apos;pore 388163</p>
            <p>📞 +65-8818 4848</p>
            <p>🚇 阿裕尼地铁站附近 / Near Aljunied MRT</p>
          </div>
        </div>
      </div>
    </div>
  )
}
