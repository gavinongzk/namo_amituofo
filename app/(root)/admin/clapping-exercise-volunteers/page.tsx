"use client"

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Pencil, Trash2 } from 'lucide-react'

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
  const [editingVolunteer, setEditingVolunteer] = useState<ClappingExerciseVolunteerRegistration | null>(null)
  const [deleteVolunteerId, setDeleteVolunteerId] = useState<string | null>(null)
  const [editFormData, setEditFormData] = useState({
    name: '',
    dharmaName: '',
    contactNumber: '',
    willingToParticipate: '',
    participationFrequency: '',
    otherFrequency: '',
    inquiries: ''
  })

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

  const handleEdit = (volunteer: ClappingExerciseVolunteerRegistration) => {
    setEditingVolunteer(volunteer)
    setEditFormData({
      name: getFieldValue(volunteer, '1'),
      dharmaName: getFieldValue(volunteer, '2'),
      contactNumber: getFieldValue(volunteer, '3'),
      willingToParticipate: getFieldValue(volunteer, '4'),
      participationFrequency: getFieldValue(volunteer, '5'),
      otherFrequency: getFieldValue(volunteer, '5_other'),
      inquiries: getFieldValue(volunteer, '6')
    })
  }

  const handleSaveEdit = async () => {
    if (!editingVolunteer) return

    try {
      const response = await fetch('/api/clapping-exercise-volunteer', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          registrationId: editingVolunteer._id,
          fieldUpdates: {
            '1': editFormData.name,
            '2': editFormData.dharmaName,
            '3': editFormData.contactNumber,
            '4': editFormData.willingToParticipate,
            '5': editFormData.participationFrequency,
            '5_other': editFormData.otherFrequency,
            '6': editFormData.inquiries
          }
        })
      })

      if (response.ok) {
        await fetchVolunteers()
        setEditingVolunteer(null)
        alert('更新成功')
      } else {
        alert('更新失败')
      }
    } catch (error) {
      console.error('Error updating clapping exercise volunteer:', error)
      alert('更新失败')
    }
  }

  const handleDelete = async () => {
    if (!deleteVolunteerId) return

    try {
      const response = await fetch(`/api/clapping-exercise-volunteer?id=${deleteVolunteerId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await fetchVolunteers()
        setDeleteVolunteerId(null)
        alert('删除成功')
      } else {
        alert('删除失败')
      }
    } catch (error) {
      console.error('Error deleting clapping exercise volunteer:', error)
      alert('删除失败')
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
                  <TableHead className="text-right">操作</TableHead>
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
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(volunteer)}
                          className="hover:bg-orange-50"
                        >
                          <Pencil className="h-4 w-4 text-orange-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteVolunteerId(volunteer._id)}
                          className="hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editingVolunteer} onOpenChange={() => setEditingVolunteer(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>编辑拍手念佛健身操义工申请</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="edit-name">名字 / Name</Label>
              <Input
                id="edit-name"
                value={editFormData.name}
                onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-dharma">净土宗皈依号 / Pure Land Refuge Number</Label>
              <Input
                id="edit-dharma"
                value={editFormData.dharmaName}
                onChange={(e) => setEditFormData({ ...editFormData, dharmaName: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-contact">联系号码 / Contact Number</Label>
              <Input
                id="edit-contact"
                value={editFormData.contactNumber}
                onChange={(e) => setEditFormData({ ...editFormData, contactNumber: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-willing">是否愿意参与</Label>
              <select
                id="edit-willing"
                className="w-full border border-gray-300 rounded-md p-2"
                value={editFormData.willingToParticipate}
                onChange={(e) => setEditFormData({ ...editFormData, willingToParticipate: e.target.value })}
              >
                <option value="yes">是的，我愿意参与</option>
                <option value="no">暂时无法参与</option>
              </select>
            </div>
            <div>
              <Label htmlFor="edit-frequency">参与频率</Label>
              <select
                id="edit-frequency"
                className="w-full border border-gray-300 rounded-md p-2"
                value={editFormData.participationFrequency}
                onChange={(e) => setEditFormData({ ...editFormData, participationFrequency: e.target.value })}
              >
                <option value="weekly">每星期</option>
                <option value="biweekly">两个星期一次</option>
                <option value="other">其他</option>
              </select>
            </div>
            {editFormData.participationFrequency === 'other' && (
              <div>
                <Label htmlFor="edit-other-frequency">其他频率说明</Label>
                <Input
                  id="edit-other-frequency"
                  value={editFormData.otherFrequency}
                  onChange={(e) => setEditFormData({ ...editFormData, otherFrequency: e.target.value })}
                />
              </div>
            )}
            <div>
              <Label htmlFor="edit-inquiries">询问事项 / Inquiries</Label>
              <Textarea
                id="edit-inquiries"
                value={editFormData.inquiries}
                onChange={(e) => setEditFormData({ ...editFormData, inquiries: e.target.value })}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingVolunteer(null)}>
              取消
            </Button>
            <Button onClick={handleSaveEdit} className="bg-orange-600 hover:bg-orange-700">
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteVolunteerId} onOpenChange={() => setDeleteVolunteerId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              您确定要删除这条拍手念佛健身操义工申请吗？此操作无法撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
