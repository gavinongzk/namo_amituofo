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
  participationFrequency: z.string().min(1, '请选择参与频率'),
  otherFrequency: z.string().optional(),
  inquiries: z.string().optional(),
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
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🪷</div>
          <h1 className="text-4xl font-bold text-purple-800 mb-4">
            新加坡净土儿童佛学班·义工招募
          </h1>
          <div className="text-2xl mb-2">🌸</div>
          
          {/* Event Details */}
          <div className="bg-white/80 backdrop-blur-sm rounded-lg p-6 max-w-2xl mx-auto shadow-sm border border-purple-100">
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div className="text-left">
                <p className="font-semibold text-purple-700 mb-1">活动类别 / Category:</p>
                <p className="text-gray-700">义工招募 / Volunteer Recruitment</p>
              </div>
              <div className="text-left">
                <p className="font-semibold text-purple-700 mb-1">主办单位 / Organiser:</p>
                <p className="text-gray-700">净土宗弥陀寺（新加坡）</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <Card className="p-8 mb-8">
          <div className="prose prose-lg max-w-none">
            <div className="mb-6">
              <h2 className="text-2xl font-semibold text-purple-700 mb-4">
                亲爱的义工菩萨们：
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                为了让孩子们在佛光中茁壮成长，「净土儿童佛学班」即将开课。本寺诚挚邀请大家一同加入义工之行，共同成就此殊胜因缘。
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 mb-8">
              <div className="bg-pink-50 p-6 rounded-lg">
                <h3 className="text-xl font-semibold text-purple-700 mb-4 flex items-center">
                  ⏰ 时间安排
                </h3>
                <ul className="space-y-2 text-gray-700">
                  <li>• 上课时间：每月两次 · 星期六，上午10:00am – 11:00am</li>
                  <li>• 义工服务时间：上午9:30am - 11:30am</li>
                </ul>
              </div>

              <div className="bg-purple-50 p-6 rounded-lg">
                <h3 className="text-xl font-semibold text-purple-700 mb-4 flex items-center">
                  ⭐ 义工服务内容
                </h3>
                <ul className="space-y-2 text-gray-700 text-sm">
                  <li>• 协助课堂秩序与安全照顾</li>
                  <li>• 帮助带领儿童诵念「南无阿弥陀佛」</li>
                  <li>• 协助讲解佛教启蒙故事与生活规范</li>
                  <li>• 引导小组活动与游戏互动</li>
                  <li>• 协助课程布置、清理与行政协助</li>
                </ul>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8 mb-8">
              <div className="bg-yellow-50 p-6 rounded-lg">
                <h3 className="text-xl font-semibold text-purple-700 mb-4 flex items-center">
                  🎯 义工条件
                </h3>
                <ul className="space-y-2 text-gray-700">
                  <li>• 发心护持佛法，愿意陪伴儿童成长</li>
                  <li>• 年龄 18 岁以上，具备耐心与责任心</li>
                  <li>• 无需有照顾小孩子的经验</li>
                  <li>• 每月至少能参与一次活动</li>
                </ul>
              </div>

              <div className="bg-green-50 p-6 rounded-lg">
                <h3 className="text-xl font-semibold text-purple-700 mb-4 flex items-center">
                  🌷 义工功德
                </h3>
                <ul className="space-y-2 text-gray-700">
                  <li>• 种下陪伴儿童学佛的善缘</li>
                  <li>• 增长慈悲与智慧，修习菩萨行</li>
                  <li>• 与大众共修共学，结集净土福德资粮</li>
                </ul>
              </div>
            </div>

            <div className="bg-gradient-to-r from-purple-100 to-pink-100 p-6 rounded-lg mb-8">
              <p className="text-gray-700 leading-relaxed mb-4">
                让我们以慈悲心护持「净土儿童佛学班」，在孩子纯洁的心田中播下念佛的种子，陪伴他们走在光明大道上，远离迷惘与黑暗。
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                您所付出的每一份爱心与耐心，不仅是陪伴孩子学习，更是为他们点亮前途的明灯，让他们从小具足慈悲、智慧与感恩，成长为未来社会与佛门的栋梁。
              </p>
              <p className="text-gray-700 leading-relaxed">
                义工的护持，不只是一次服务，而是成就无量的福慧因缘；帮助一个孩子，就是护佑一个家庭，培育一代善根，就是延续佛法慧命。
              </p>
            </div>

            <div className="text-center">
              <p className="text-lg text-purple-700 font-medium mb-2">
                让我们一同发心，陪伴孩子走向智慧与慈悲，共同成就净业，同归阿弥陀佛温暖的怀抱。
              </p>
              <p className="text-xl text-purple-800 font-bold">
                南无阿弥陀佛 🙏
              </p>
            </div>
          </div>
        </Card>

        {/* Registration Form */}
        <Card className="p-8">
          <h2 className="text-2xl font-bold text-purple-800 mb-6 text-center">
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
                        <SelectItem value="twice">每月 2 次</SelectItem>
                        <SelectItem value="once">每月 1 次</SelectItem>
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

              <div className="text-center pt-6">
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-12 py-3 text-lg font-medium"
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
