'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { getMonthlyStats, getYearlyStats } from '@/lib/actions/chanting.actions'
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts'

interface MonthlyStats {
  totalCount: number
  daysWithRecords: number
  averagePerDay: number
  records: Array<{
    _id: string
    userId: string
    date: string
    count: number
    remarks?: string
  }>
}

interface MonthStat {
  month: number
  totalCount: number
  daysWithRecords: number
  averagePerDay: number
}

interface YearlyStats {
  totalCount: number
  daysWithRecords: number
  averagePerDay: number
  monthlyStats: MonthStat[]
}

const ChantingStats = () => {
  const { user } = useUser()
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStats | null>(null)
  const [yearlyStats, setYearlyStats] = useState<YearlyStats | null>(null)

  const years = Array.from(
    { length: 5 },
    (_, i) => new Date().getFullYear() - i
  )
  const months = Array.from({ length: 12 }, (_, i) => i + 1)

  useEffect(() => {
    if (user?.id) {
      loadStats()
    }
  }, [user?.id, selectedYear, selectedMonth])

  const loadStats = async () => {
    if (!user?.id) return

    const monthly = await getMonthlyStats(user.id, selectedYear, selectedMonth)
    setMonthlyStats(monthly)

    const yearly = await getYearlyStats(user.id, selectedYear)
    setYearlyStats(yearly)
  }

  const formatNumber = (num: number) => {
    return Math.round(num).toLocaleString('zh-CN')
  }

  return (
    <div className="space-y-8 p-4">
      <div className="flex gap-4 flex-wrap">
        <Select
          value={selectedYear.toString()}
          onValueChange={(value) => setSelectedYear(parseInt(value))}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="选择年份" />
          </SelectTrigger>
          <SelectContent>
            {years.map((year) => (
              <SelectItem key={year} value={year.toString()}>
                {year} 年
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={selectedMonth.toString()}
          onValueChange={(value) => setSelectedMonth(parseInt(value))}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="选择月份" />
          </SelectTrigger>
          <SelectContent>
            {months.map((month) => (
              <SelectItem key={month} value={month.toString()}>
                {month} 月
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">本月总计</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {monthlyStats ? formatNumber(monthlyStats.totalCount) : '0'} 次
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">本月记录天数</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {monthlyStats ? monthlyStats.daysWithRecords : '0'} 天
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">本月平均</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {monthlyStats ? formatNumber(monthlyStats.averagePerDay) : '0'} 次/天
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">年度总计</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {yearlyStats ? formatNumber(yearlyStats.totalCount) : '0'} 次
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="col-span-4">
        <CardHeader>
          <CardTitle>年度统计</CardTitle>
        </CardHeader>
        <CardContent className="pl-2">
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={yearlyStats?.monthlyStats || []}>
              <XAxis
                dataKey="month"
                stroke="#888888"
                tickFormatter={(value: number) => `${value}月`}
              />
              <YAxis
                stroke="#888888"
                tickFormatter={(value: number) => formatNumber(value)}
              />
              <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200" />
              <Tooltip
                formatter={(value: number) => formatNumber(value)}
                labelFormatter={(label: number) => `${label}月`}
              />
              <Bar
                dataKey="totalCount"
                fill="currentColor"
                radius={[4, 4, 0, 0]}
                className="fill-primary"
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}

export default ChantingStats 