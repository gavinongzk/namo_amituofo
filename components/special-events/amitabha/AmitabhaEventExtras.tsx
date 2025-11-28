'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

const schedule = [
  { time: '09:30am', content: '报到 | 写牌位 | 念佛' },
  { time: '10:30am', content: '祈福超荐法会（第一柱香）' },
  { time: '11:30am', content: '法师开示' },
  { time: '12:00pm', content: '午斋' },
  { time: '01:00pm', content: '念佛绕佛' },
  { time: '02:00pm', content: '休息' },
  { time: '02:30pm', content: '祈福超荐法会（第二柱香）' },
  { time: '03:00pm', content: '法师开示' },
  { time: '03:30pm', content: '念佛绕佛' },
  { time: '03:45pm', content: '传授三皈依' },
  { time: '04:00pm', content: '圆满大回向' },
]

export const AmitabhaEventExtras = () => {
  return (
    <div className="space-y-10 mt-12">
      <Card className="p-6 md:p-8 bg-red-50 border-red-200">
        <div className="flex flex-col gap-4 text-center md:text-left">
          <p className="text-red-700 font-semibold text-lg">
            🛑 温馨提醒：目前位子已满，您的报名将自动列入候补名单，一旦有空缺我们将立即联系您。
          </p>
          <p className="text-gray-700">
            The current spots are full. Your registration will be placed on the waiting list. We will notify you promptly if a spot becomes available.
          </p>
        </div>
      </Card>

      <Card className="p-6 md:p-8 bg-white border-primary-100 space-y-4">
        <h3 className="text-2xl font-semibold text-primary-700 text-center">法会简介 Event Overview</h3>
        <p className="text-gray-700 leading-relaxed">
          阿弥陀佛以慈悲弘愿普度十方，尤其护佑娑婆世界的我们，令得脱离苦海，迈向无上佛果。为感念佛恩，值此阿弥陀佛圣诞之际，新加坡净土宗弥陀寺将举办「弥陀诞佛一法会」，包括念佛一日修、祈福超荐、法师开示，以及传授皈依仪式。
        </p>
        <p className="text-gray-700 leading-relaxed">
          道场提供美味午斋、供立祈福超度牌位，并有义工团队全程协助。祈愿大众在阿弥陀佛的加持下，信佛念佛，身心安乐，愿生净土，究竟解脱。
        </p>
      </Card>

      <Card className="p-6 md:p-8 bg-gradient-to-br from-orange-50 to-amber-50 border-orange-100 space-y-6">
        <div>
          <h3 className="text-xl font-semibold text-orange-700 mb-4">法会流程 / Event Schedule</h3>
          <div className="grid gap-4 md:grid-cols-2">
            {schedule.map((item) => (
              <div key={item.time} className="flex items-start gap-3 rounded-lg border border-orange-100 bg-white p-3 shadow-sm">
                <div className="w-20 text-sm font-semibold text-orange-600">{item.time}</div>
                <p className="text-gray-700 text-sm">{item.content}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center space-y-4">
          <p className="text-gray-700">
            需要报名皈依或加入义工团队？请使用既有报名表格提交资料，我们会尽快与您联系。
          </p>
          <Button asChild className="bg-orange-600 hover:bg-orange-700">
            <Link href="/refuge-registration">
              前往皈依 / 义工报名表单
            </Link>
          </Button>
        </div>
      </Card>
    </div>
  )
}

export default AmitabhaEventExtras

