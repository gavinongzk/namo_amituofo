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

      <Card className="p-6 md:p-8 bg-gradient-to-br from-orange-50 to-amber-50 border-orange-100 space-y-6">
        <div className="text-center space-y-4">
          <p className="text-gray-700">
            需要报名皈依或加入义工团队？请使用既有报名表格提交资料，我们会尽快与您联系。
          </p>
          <Button asChild className="bg-orange-600 hover:bg-orange-700">
          <Link
              href="/refuge-registration"
              target="_blank"
              rel="noopener noreferrer"
            >
              前往皈依 / 义工报名表单
            </Link>
          </Button>
        </div>
      </Card>
    </div>
  )
}

export default AmitabhaEventExtras

