"use client"

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

interface ClappingExerciseVolunteerRegistration {
  _id: string
  customFieldValues: Array<{
    groupId: string
    fields: Array<{
      id: string
      label: string
      type: string
      value: string
    }>
    cancelled: boolean
    attendance: boolean
  }>
  createdAt: string
  queueNumber: string
}

export default function ClappingExerciseVolunteersPage() {
  const [volunteers, setVolunteers] = useState<ClappingExerciseVolunteerRegistration[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchVolunteers()
  }, [])

  const fetchVolunteers = async () => {
    try {
      const response = await fetch('/api/clapping-exercise-volunteer')
      if (response.ok) {
        const data = await response.json()
        setVolunteers(data.volunteers || [])
      }
    } catch (error) {
      console.error('Error fetching clapping exercise volunteers:', error)
    } finally {
      setLoading(false)
    }
  }

  const getFieldValue = (volunteer: ClappingExerciseVolunteerRegistration, fieldId: string) => {
    const group = volunteer.customFieldValues[0] // Get first group
    const field = group?.fields.find(f => f.id === fieldId)
    return field?.value || ''
  }

  const getParticipationStatus = (volunteer: ClappingExerciseVolunteerRegistration) => {
    const willing = getFieldValue(volunteer, '4')
    return willing === 'yes' ? '愿意参与' : '暂时无法参与'
  }

  const getParticipationFrequency = (volunteer: ClappingExerciseVolunteerRegistration) => {
    const frequency = getFieldValue(volunteer, '5')
    const other = getFieldValue(volunteer, '5_other')
    switch (frequency) {
      case 'weekly': return '每星期'
      case 'biweekly': return '两个星期一次'
      case 'other': return other ? `其他（${other}）` : '其他'
      default: return frequency
    }
  }

  const exportToCSV = () => {
    const headers = [
      '名字',
      '净土宗皈依号',
      '联系号码',
      '是否愿意参与',
      '参与频率',
      '询问事项',
      '申请日期',
      '状态'
    ]

    const csvData = volunteers.map(volunteer => [
      getFieldValue(volunteer, '1'),
      getFieldValue(volunteer, '2'),
      getFieldValue(volunteer, '3'),
      getParticipationStatus(volunteer),
      getParticipationFrequency(volunteer),
      getFieldValue(volunteer, '6'),
      new Date(volunteer.createdAt).toLocaleDateString('zh-CN'),
      volunteer.customFieldValues[0]?.cancelled ? '已取消' : '已确认'
    ])

    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `clapping-exercise-volunteers-${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <div className="text-2xl">🪷</div>
          <p className="text-lg text-gray-600">加载中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">🪷</div>
          <h1 className="text-3xl font-bold text-orange-800 mb-2">
            拍手念佛健身操义工申请管理
          </h1>
          <p className="text-gray-600">
            拍手念佛健身操义工招募申请列表
          </p>
        </div>

        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <Badge variant="secondary" className="text-lg px-4 py-2">
              总申请数: {volunteers.length}
            </Badge>
            <Badge variant="outline" className="text-lg px-4 py-2">
              愿意参与: {volunteers.filter(v => getFieldValue(v, '4') === 'yes').length}
            </Badge>
          </div>
          <Button onClick={exportToCSV} className="bg-orange-600 hover:bg-orange-700">
            导出 CSV
          </Button>
        </div>
      </div>

      <Card className="p-6">
        {volunteers.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">✨</div>
            <p className="text-lg text-gray-600">暂无拍手念佛健身操义工申请</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>名字</TableHead>
                  <TableHead>皈依号</TableHead>
                  <TableHead>联系号码</TableHead>
                  <TableHead>参与意愿</TableHead>
                  <TableHead>参与频率</TableHead>
                  <TableHead>询问事项</TableHead>
                  <TableHead>申请日期</TableHead>
                  <TableHead>状态</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {volunteers.map((volunteer) => (
                  <TableRow key={volunteer._id}>
                    <TableCell className="font-medium">
                      {getFieldValue(volunteer, '1')}
                    </TableCell>
                    <TableCell>
                      {getFieldValue(volunteer, '2') || '-'}
                    </TableCell>
                    <TableCell>
                      {getFieldValue(volunteer, '3')}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={getFieldValue(volunteer, '4') === 'yes' ? 'default' : 'secondary'}
                        className={getFieldValue(volunteer, '4') === 'yes' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}
                      >
                        {getParticipationStatus(volunteer)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {getParticipationFrequency(volunteer)}
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {getFieldValue(volunteer, '6') || '-'}
                    </TableCell>
                    <TableCell>
                      {new Date(volunteer.createdAt).toLocaleDateString('zh-CN')}
                    </TableCell>
                    <TableCell>
                      <Badge variant={volunteer.customFieldValues[0]?.cancelled ? 'destructive' : 'default'}>
                        {volunteer.customFieldValues[0]?.cancelled ? '已取消' : '已确认'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>
    </div>
  )
}
