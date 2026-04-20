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

const clappingExerciseFormSchema = z.object({
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

type ClappingExerciseFormData = z.infer<typeof clappingExerciseFormSchema>

export default function ClappingExerciseVolunteerPage() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const form = useForm<ClappingExerciseFormData>({
    resolver: zodResolver(clappingExerciseFormSchema),
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

  const onSubmit = async (data: ClappingExerciseFormData) => {
    setIsSubmitting(true)
    try {
      const response = await fetch('/api/clapping-exercise-volunteer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error('Failed to submit volunteer registration')
      }

      await response.json()
      
      setIsSubmitted(true)
    } catch (error) {
      console.error('Error submitting clapping exercise volunteer registration:', error)
      // You could add error handling UI here
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <Card className="p-8 text-center">
            <div className="mb-6">
              <div className="text-6xl mb-4">🪷</div>
              <h1 className="text-3xl font-bold text-orange-800 mb-4">感恩您的发心</h1>
              <p className="text-lg text-grey-700 mb-6">
                您的拍手念佛健身操义工申请已成功提交！我们会尽快与您联系，安排义工服务事宜。
              </p>
              <p className="text-grey-600">
                南无阿弥陀佛 🙏
              </p>
            </div>
            <Button 
              onClick={() => {
                setIsSubmitted(false)
                form.reset()
              }}
              className="bg-orange-600 hover:bg-orange-700"
            >
              返回申请页面
            </Button>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-amber-50 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-12">
          {/* Clapping Exercise Image */}
          <div className="mb-8 relative">
            <div className="absolute inset-0 bg-gradient-to-t from-orange-900/20 to-transparent rounded-2xl"></div>
            <Image
              src="/assets/images/clapping-exercise.jpeg"
              alt="拍手念佛健身操·义工招募"
              width={900}
              height={500}
              className="mx-auto rounded-2xl shadow-2xl max-w-full h-auto transform hover:scale-[1.02] transition-transform duration-500"
              priority
            />
          </div>
          
          {/* Event Details */}
          <div className="bg-white/90 backdrop-blur-md rounded-2xl p-8 max-w-3xl mx-auto shadow-xl border border-orange-200/50">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="text-left space-y-2">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <p className="font-semibold text-orange-700">活动类别 / Category:</p>
                </div>
                <p className="text-grey-700 ml-4">拍手念佛健身操义工招募 / Clapping Exercise Volunteer Recruitment</p>
              </div>
              <div className="text-left space-y-2">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <p className="font-semibold text-orange-700">主办单位 / Organiser:</p>
                </div>
                <p className="text-grey-700 ml-4">净土宗弥陀寺（新加坡）</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <Card className="p-8 mb-8 shadow-xl border-0 bg-white/95 backdrop-blur-sm">
          <div className="prose prose-lg max-w-none">
            <div className="mb-8 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-orange-100 to-red-100 rounded-full mb-4">
                <span className="text-3xl">🙏</span>
              </div>
              <h2 className="text-3xl font-bold text-orange-800 mb-4">
                亲爱的义工菩萨们：
              </h2>
              <p className="text-grey-700 leading-relaxed text-lg max-w-3xl mx-auto">
                我们即将在 新加坡弥陀寺 长期举办 「拍手念佛健身操」。此活动结合健身运动与念佛，带来身心双重利益：
              </p>
            </div>

            {/* Activity Schedule and Volunteer Service Content - Moved to Top */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="bg-gradient-to-br from-yellow-50 to-amber-100 p-6 rounded-2xl border border-yellow-200/50 hover:shadow-lg transition-shadow duration-300">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center mr-3">
                    <span className="text-white text-lg">📍</span>
                  </div>
                  <h3 className="text-xl font-semibold text-orange-700">活动安排</h3>
                </div>
                <ul className="space-y-3 text-grey-700">
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <span>时间：每月两次 · 星期六，下午4:00pm – 5:00pm</span>
                  </li>
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <span>义工服务时间：下午3:45pm - 5:30pm</span>
                  </li>
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <span>地点：新加坡弥陀寺</span>
                  </li>
                </ul>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-emerald-100 p-6 rounded-2xl border border-green-200/50 hover:shadow-lg transition-shadow duration-300">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center mr-3">
                    <span className="text-white text-lg">⭐</span>
                  </div>
                  <h3 className="text-xl font-semibold text-orange-700">义工服务内容</h3>
                </div>
                <ul className="space-y-3 text-grey-700">
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <span>协助带领念佛健身操</span>
                  </li>
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <span>协助场地布置与整理</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-2xl border border-orange-200/50 hover:shadow-lg transition-shadow duration-300">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center mr-3">
                    <span className="text-white text-lg">💪</span>
                  </div>
                  <h3 className="text-xl font-semibold text-orange-700">健体益处</h3>
                </div>
                <ul className="space-y-3 text-grey-700">
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <span>拍一拍，血脉畅通，活力满满</span>
                  </li>
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <span>动一动，筋骨舒展，强身防病</span>
                  </li>
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <span>乐一乐，轻松节奏，身心自在</span>
                  </li>
                </ul>
              </div>

              <div className="bg-gradient-to-br from-red-50 to-red-100 p-6 rounded-2xl border border-red-200/50 hover:shadow-lg transition-shadow duration-300">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center mr-3">
                    <span className="text-white text-lg">🪷</span>
                  </div>
                  <h3 className="text-xl font-semibold text-orange-700">念佛功德</h3>
                </div>
                <ul className="space-y-3 text-grey-700">
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <span>一声佛号，遍照光明，功德无量</span>
                  </li>
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <span>动作之间，口念佛名，身心相应</span>
                  </li>
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <span>除障消灾，远离困厄</span>
                  </li>
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <span>福慧双增，延寿安康</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="bg-gradient-to-r from-orange-100 via-red-100 to-amber-100 p-8 rounded-2xl mb-8 border border-orange-200/50 shadow-lg">
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-full mb-4">
                  <span className="text-white text-xl">🎵</span>
                </div>
                <h3 className="text-2xl font-bold text-orange-800 mb-4">节奏与佛号，身心共修</h3>
              </div>
              <div className="space-y-3 text-grey-700 leading-relaxed text-center">
                <p className="text-lg">在轻快的节奏里，拍出健康，念出光明！</p>
                <p className="text-lg">大家齐声念佛，共修共乐，身安心安，功德无边！</p>
              </div>
            </div>

            <div className="text-center bg-gradient-to-br from-orange-50 to-red-50 p-8 rounded-2xl border border-orange-200/50">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-orange-500 to-red-500 rounded-full mb-4">
                <span className="text-white text-2xl">🙌</span>
              </div>
              <h3 className="text-2xl font-bold text-orange-800 mb-4">发心护持，成就无量功德</h3>
              <div className="space-y-4 text-grey-700 leading-relaxed">
                <p className="text-lg">您的双手，不只是拍手动作，更是播撒慈悲的种子！</p>
                <p className="text-lg">欢迎一同发心，让念佛拍手操传递喜乐与慈悲！</p>
                <div className="bg-white/50 p-6 rounded-xl my-6">
                  <p className="text-lg font-semibold text-orange-700 mb-4">诚邀您一同发心参与，用节奏与佛号：</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gradient-to-br from-orange-100 to-orange-200 p-4 rounded-lg">
                      <p className="text-orange-700 font-semibold">🎵 拍出喜乐</p>
                    </div>
                    <div className="bg-gradient-to-br from-red-100 to-red-200 p-4 rounded-lg">
                      <p className="text-red-700 font-semibold">💪 拍出健康</p>
                    </div>
                    <div className="bg-gradient-to-br from-amber-100 to-amber-200 p-4 rounded-lg">
                      <p className="text-amber-700 font-semibold">✨ 拍出无量光明</p>
                    </div>
                  </div>
                </div>
                <p className="text-lg font-semibold text-orange-700">让我们携手护持，共同成就每场身心法喜的念佛弘愿！</p>
                <p className="text-3xl text-orange-800 font-bold mt-6">南无阿弥陀佛 🙏</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Registration Form */}
        <Card className="p-8 shadow-xl border-0 bg-white/95 backdrop-blur-sm">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-orange-500 to-red-500 rounded-full mb-4">
              <span className="text-white text-2xl">📝</span>
            </div>
            <h2 className="text-3xl font-bold text-orange-800 mb-2">
              义工申请表格
            </h2>
            <p className="text-grey-600">请填写以下信息，我们会尽快与您联系</p>
          </div>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-grey-700 font-medium">名字 *</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="请输入您的姓名" 
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
                  name="dharmaName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-grey-700 font-medium">净土宗皈依号</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="如有皈依号请填写" 
                          {...field} 
                          className="border-orange-200 focus:border-orange-400"
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
                    <FormLabel className="text-grey-700 font-medium">联系号码 *</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="请输入您的联系电话" 
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
                name="willingToParticipate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-grey-700 font-medium">
                      请问您是否愿意参与「拍手念佛健身操」的义工服务？ *
                    </FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="border-orange-200 focus:border-orange-400">
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
                      <FormLabel className="text-grey-700 font-medium">
                        请问您大概每月能参与的次数？ *
                      </FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="border-orange-200 focus:border-orange-400">
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
                      <FormLabel className="text-grey-700 font-medium">请注明其他参与频率</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="请详细说明您的参与频率" 
                          {...field} 
                          className="border-orange-200 focus:border-orange-400"
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
                    <FormLabel className="text-grey-700 font-medium">询问事项</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="如有任何疑问或需要了解的事项，请在此填写" 
                        {...field} 
                        className="border-orange-200 focus:border-orange-400 min-h-[100px]"
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
                  className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white px-16 py-4 text-lg font-semibold rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:transform-none"
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
        <div className="text-center mt-12 p-8 bg-white/80 backdrop-blur-sm rounded-2xl border border-orange-200/50 shadow-lg">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-full mb-4">
            <span className="text-white text-lg">🏛️</span>
          </div>
          <h3 className="text-xl font-semibold text-orange-700 mb-3">净土宗弥陀寺（新加坡）</h3>
          <p className="text-grey-700 mb-2">Namo Amituofo Organization Ltd</p>
          <div className="space-y-1 text-grey-600">
            <p>📍 27, Lor 27, Geylang, S&apos;pore 388163</p>
            <p>📞 +65-8818 4848</p>
            <p>🚇 阿裕尼地铁站附近 / Near Aljunied MRT</p>
          </div>
        </div>
      </div>
    </div>
  )
}
