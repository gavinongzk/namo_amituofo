'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { Calendar } from '@/components/ui/calendar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { createOrUpdateChantingRecord, getChantingRecords } from '@/lib/actions/chanting.actions'
import { Loader2 } from 'lucide-react'
import { DayContent } from 'react-day-picker'

interface ChantingRecord {
  _id: string
  userId: string
  date: string
  count: number
  remarks?: string
  createdAt: string
  updatedAt: string
}

const ChantingRecordForm = () => {
  const { user } = useUser()
  const [date, setDate] = useState<Date>(new Date())
  const [count, setCount] = useState('')
  const [remarks, setRemarks] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [records, setRecords] = useState<ChantingRecord[]>([])

  useEffect(() => {
    if (user?.id) {
      loadRecords()
    }
  }, [user?.id])

  const loadRecords = async () => {
    if (!user?.id) return

    const startDate = new Date()
    startDate.setDate(1)
    const endDate = new Date()
    endDate.setMonth(endDate.getMonth() + 1, 0)

    const monthlyRecords = await getChantingRecords(user.id, startDate, endDate)
    setRecords(monthlyRecords || [])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.id || !count) return

    try {
      setIsSubmitting(true)
      await createOrUpdateChantingRecord(
        user.id,
        date,
        parseInt(count),
        remarks
      )
      
      // Reset form
      setCount('')
      setRemarks('')
      
      // Reload records
      await loadRecords()
    } catch (error) {
      console.error('Error submitting record:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const getDayContent = (day: Date) => {
    const record = records.find(r => {
      const recordDate = new Date(r.date)
      return recordDate.toDateString() === day.toDateString()
    })

    if (!record) return null

    return (
      <div className="w-full h-full flex items-center justify-center">
        <span className="text-xs font-medium">{record.count}</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col md:flex-row gap-8 p-4">
      <div className="flex-1">
        <h2 className="text-2xl font-bold mb-4">记录每日念佛</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">日期</label>
            <Calendar
              mode="single"
              selected={date}
              onSelect={(newDate: Date | undefined) => newDate && setDate(newDate)}
              className="rounded-md border"
              components={{
                DayContent: (props: { date: Date }) => getDayContent(props.date)
              }}
            />
          </div>
          
          <div>
            <label htmlFor="count" className="block text-sm font-medium mb-1">
              念佛次数
            </label>
            <Input
              id="count"
              type="number"
              min="0"
              value={count}
              onChange={(e) => setCount(e.target.value)}
              placeholder="输入今日念佛次数"
              required
            />
          </div>

          <div>
            <label htmlFor="remarks" className="block text-sm font-medium mb-1">
              备注 (选填)
            </label>
            <Textarea
              id="remarks"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="添加备注..."
              rows={3}
            />
          </div>

          <Button
            type="submit"
            disabled={isSubmitting || !count}
            className="w-full"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                提交中...
              </>
            ) : (
              '提交'
            )}
          </Button>
        </form>
      </div>

      <div className="flex-1">
        <h2 className="text-2xl font-bold mb-4">本月记录</h2>
        <div className="space-y-4">
          {records.map((record) => (
            <div
              key={record._id}
              className="p-4 rounded-lg border hover:border-primary transition-colors"
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium">
                    {new Date(record.date).toLocaleDateString('zh-CN')}
                  </p>
                  <p className="text-lg font-bold">{record.count} 次</p>
                </div>
                {record.remarks && (
                  <p className="text-sm text-gray-600">{record.remarks}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default ChantingRecordForm 