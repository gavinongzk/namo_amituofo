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
  participationFrequency: z.string().min(1, '请选择参与频率'),
  otherFrequency: z.string().optional(),
  inquiries: z.string().optional(),
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

      const result = await response.json()
      console.log('Clapping exercise volunteer registration successful:', result)
      
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
              <p className="text-lg text-gray-700 mb-6">
                您的拍手念佛健身操义工申请已成功提交！我们会尽快与您联系，安排义工服务事宜。
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
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-8">
          {/* Clapping Exercise Image */}
          <div className="mb-6">
            <Image
              src="/assets/images/clapping-exercise.jpeg"
              alt="拍手念佛健身操·义工招募"
              width={800}
              height={600}
              className="mx-auto rounded-lg shadow-lg max-w-full h-auto"
              priority
            />
          </div>
          
          {/* Event Details */}
          <div className="bg-white/80 backdrop-blur-sm rounded-lg p-6 max-w-2xl mx-auto shadow-sm border border-orange-100">
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div className="text-left">
                <p className="font-semibold text-orange-700 mb-1">活动类别 / Category:</p>
                <p className="text-gray-700">拍手念佛健身操义工招募 / Clapping Exercise Volunteer Recruitment</p>
              </div>
              <div className="text-left">
                <p className="font-semibold text-orange-700 mb-1">主办单位 / Organiser:</p>
                <p className="text-gray-700">净土宗弥陀寺（新加坡）</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <Card className="p-8 mb-8">
          <div className="prose prose-lg max-w-none">
            <div className="mb-6">
              <h2 className="text-2xl font-semibold text-orange-700 mb-4">
                亲爱的义工菩萨们：
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                我们即将在 新加坡弥陀寺 长期举办 「拍手念佛健身操」。此活动结合健身运动与念佛，带来身心双重利益：
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 mb-8">
              <div className="bg-orange-50 p-6 rounded-lg">
                <h3 className="text-xl font-semibold text-orange-700 mb-4 flex items-center">
                  💪 健体益处
                </h3>
                <ul className="space-y-2 text-gray-700">
                  <li>• 拍一拍，血脉畅通，活力满满</li>
                  <li>• 动一动，筋骨舒展，强身防病</li>
                  <li>• 乐一乐，轻松节奏，身心自在</li>
                </ul>
              </div>

              <div className="bg-red-50 p-6 rounded-lg">
                <h3 className="text-xl font-semibold text-orange-700 mb-4 flex items-center">
                  🪷 念佛功德
                </h3>
                <ul className="space-y-2 text-gray-700">
                  <li>• 一声佛号，遍照光明，功德无量</li>
                  <li>• 动作之间，口念佛名，身心相应</li>
                  <li>• 除障消灾，远离困厄</li>
                  <li>• 福慧双增，延寿安康</li>
                </ul>
              </div>
            </div>

            <div className="bg-gradient-to-r from-orange-100 to-red-100 p-6 rounded-lg mb-8">
              <p className="text-gray-700 leading-relaxed mb-2 text-center">
                在轻快的节奏里，拍出健康，念出光明！
              </p>
              <p className="text-gray-700 leading-relaxed text-center">
                大家齐声念佛，共修共乐，身安心安，功德无边！
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 mb-8">
              <div className="bg-yellow-50 p-6 rounded-lg">
                <h3 className="text-xl font-semibold text-orange-700 mb-4 flex items-center">
                  📍 活动安排
                </h3>
                <ul className="space-y-2 text-gray-700">
                  <li>• 时间：星期六下午4:00pm – 5:00pm</li>
                  <li>• 地点：新加坡弥陀寺</li>
                </ul>
              </div>

              <div className="bg-green-50 p-6 rounded-lg">
                <h3 className="text-xl font-semibold text-orange-700 mb-4 flex items-center">
                  ⭐ 义工服务内容
                </h3>
                <ul className="space-y-2 text-gray-700">
                  <li>• 协助带领念佛健身操</li>
                  <li>• 协助场地布置与整理</li>
                </ul>
              </div>
            </div>

            <div className="text-center">
              <p className="text-lg text-orange-700 font-medium mb-2">
                🙌 您的双手，不只是拍手动作，更是播撒慈悲的种子！
              </p>
              <p className="text-lg text-orange-700 font-medium mb-2">
                欢迎一同发心，让念佛拍手操传递喜乐与慈悲！
              </p>
              <p className="text-lg text-orange-700 font-medium mb-2">
                诚邀您一同发心参与，用节奏与佛号：
              </p>
              <ul className="text-lg text-orange-700 font-medium mb-4 space-y-1">
                <li>• 拍出喜乐</li>
                <li>• 拍出健康</li>
                <li>• 拍出无量光明</li>
              </ul>
              <p className="text-lg text-orange-700 font-medium mb-4">
                让我们携手护持，共同成就每场身心法喜的念佛弘愿！
              </p>
              <p className="text-xl text-orange-800 font-bold">
                南无阿弥陀佛 🙏
              </p>
            </div>
          </div>
        </Card>

        {/* Registration Form */}
        <Card className="p-8">
          <h2 className="text-2xl font-bold text-orange-800 mb-6 text-center">
            义工申请表格
          </h2>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700 font-medium">名字 *</FormLabel>
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
                      <FormLabel className="text-gray-700 font-medium">净土宗皈依号</FormLabel>
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
                    <FormLabel className="text-gray-700 font-medium">联系号码 *</FormLabel>
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
                    <FormLabel className="text-gray-700 font-medium">
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

              <FormField
                control={form.control}
                name="participationFrequency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 font-medium">
                      请问您大概每月能参与的次数？ *
                    </FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="border-orange-200 focus:border-orange-400">
                          <SelectValue placeholder="请选择" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="weekly">每星期</SelectItem>
                        <SelectItem value="biweekly">两个星期一次</SelectItem>
                        <SelectItem value="other">其他（请注明）</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {form.watch('participationFrequency') === 'other' && (
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
                    <FormLabel className="text-gray-700 font-medium">询问事项</FormLabel>
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

              <div className="text-center pt-6">
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="bg-orange-600 hover:bg-orange-700 text-white px-12 py-3 text-lg font-medium"
                >
                  {isSubmitting ? '提交中...' : '提交申请'}
                </Button>
              </div>
            </form>
          </Form>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 text-gray-600">
          <p>净土宗弥陀寺（新加坡）/ Namo Amituofo Organization Ltd</p>
          <p>27, Lor 27, Geylang, S&apos;pore 388163 | +65-8818 4848</p>
          <p>阿裕尼地铁站附近 / Near Aljunied MRT</p>
        </div>
      </div>
    </div>
  )
}
