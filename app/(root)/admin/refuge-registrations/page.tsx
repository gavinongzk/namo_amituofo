"use client"

import { useMemo, useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { redirect } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Pencil, Trash2 } from 'lucide-react'

interface RefugeRegistration {
  _id: string
  chineseName: string
  englishName: string
  age: string
  dob: string
  gender: string
  contactNumber: string
  address: string
  createdAt: string
  remarks?: string
}

export default function RefugeRegistrationsPage() {
  const { user, isLoaded } = useUser()
  const [registrations, setRegistrations] = useState<RefugeRegistration[]>([])
  const [loading, setLoading] = useState(true)
  const [editingRegistration, setEditingRegistration] = useState<RefugeRegistration | null>(null)
  const [deleteRegistrationId, setDeleteRegistrationId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [remarksDrafts, setRemarksDrafts] = useState<Record<string, string>>({})
  const [savingRemarksId, setSavingRemarksId] = useState<string | null>(null)
  const [editFormData, setEditFormData] = useState({
    chineseName: '',
    englishName: '',
    age: '',
    dob: '',
    gender: '',
    contactNumber: '',
    address: '',
    remarks: ''
  })

  const isSuperadmin = user?.publicMetadata.role === 'superadmin'

  const filteredRegistrations = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return registrations

    const normalizePhone = (value: string) => value.replace(/\D/g, '')

    return registrations.filter((r) => {
      const nameHaystack = `${r.chineseName || ''} ${r.englishName || ''}`.toLowerCase()
      const phoneHaystackRaw = (r.contactNumber || '').toLowerCase()
      const phoneHaystackDigits = normalizePhone(r.contactNumber || '')

      const matchesName = nameHaystack.includes(q)
      const matchesPhoneRaw = phoneHaystackRaw.includes(q)
      const qDigits = normalizePhone(q)
      const matchesPhoneDigits = qDigits.length > 0 && phoneHaystackDigits.includes(qDigits)
      const matchesPhone = matchesPhoneRaw || matchesPhoneDigits
      return matchesName || matchesPhone
    })
  }, [registrations, searchQuery])

  useEffect(() => {
    if (isLoaded) {
      const role = user?.publicMetadata.role as string
      if (role !== 'superadmin') {
        redirect('/')
      }
    }
  }, [isLoaded, user])

  useEffect(() => {
    if (isLoaded && user?.publicMetadata.role === 'superadmin') {
      fetchRegistrations()
    }
  }, [isLoaded, user])

  const fetchRegistrations = async () => {
    try {
      const response = await fetch('/api/refuge-registration')
      if (response.ok) {
        const data = await response.json()
        const regs: RefugeRegistration[] = data.registrations || []
        setRegistrations(regs)
        // Update remarksDrafts to match fetched data, but preserve unsaved changes
        setRemarksDrafts((prev) => {
          const next = { ...prev }
          for (const r of regs) {
            // Only update if there's no unsaved draft (to preserve user's typing)
            // If the registration was just saved, it will be updated by handleSaveRemarks
            if (next[r._id] === undefined) {
              next[r._id] = r.remarks || ''
            }
          }
          return next
        })
      } else {
        console.error('Failed to fetch registrations:', response.status, response.statusText)
      }
    } catch (error) {
      console.error('Error fetching refuge registrations:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (registration: RefugeRegistration) => {
    setEditingRegistration(registration)
    setEditFormData({
      chineseName: registration.chineseName,
      englishName: registration.englishName,
      age: registration.age,
      dob: registration.dob,
      gender: registration.gender,
      contactNumber: registration.contactNumber,
      address: registration.address,
      remarks: registration.remarks || ''
    })
  }

  const handleSaveEdit = async () => {
    if (!editingRegistration) return

    try {
      const response = await fetch('/api/refuge-registration', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          registrationId: editingRegistration._id,
          ...editFormData
        })
      })

      if (response.ok) {
        await fetchRegistrations()
        setEditingRegistration(null)
        alert('更新成功 / Update successful')
      } else {
        alert('更新失败 / Update failed')
      }
    } catch (error) {
      console.error('Error updating refuge registration:', error)
      alert('更新失败 / Update failed')
    }
  }

  const handleSaveRemarks = async (registrationId: string) => {
    if (!isSuperadmin) return
    try {
      setSavingRemarksId(registrationId)
      const remarksValue = remarksDrafts[registrationId] ?? ''
      
      const response = await fetch('/api/refuge-registration', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          registrationId,
          remarks: remarksValue
        })
      })

      if (response.ok) {
        const result = await response.json()
        const updatedRegistration = result.registration
        
        if (updatedRegistration) {
          // Update the local state with the server response to ensure consistency
          setRegistrations((prev) =>
            prev.map((reg) =>
              reg._id === registrationId
                ? { ...reg, remarks: updatedRegistration.remarks || '' }
                : reg
            )
          )
          // Update remarksDrafts to match the saved value so the save button becomes disabled
          setRemarksDrafts((prev) => ({
            ...prev,
            [registrationId]: updatedRegistration.remarks || ''
          }))
        } else {
          // Fallback: update with the value we sent if server didn't return registration
          setRegistrations((prev) =>
            prev.map((reg) =>
              reg._id === registrationId
                ? { ...reg, remarks: remarksValue }
                : reg
            )
          )
          setRemarksDrafts((prev) => ({
            ...prev,
            [registrationId]: remarksValue
          }))
        }
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        console.error('Failed to save remarks:', errorData)
        alert(`备注保存失败 / Failed to save remarks: ${errorData.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error saving remarks:', error)
      alert(`备注保存失败 / Failed to save remarks: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setSavingRemarksId(null)
    }
  }

  const handleDelete = async () => {
    if (!deleteRegistrationId) return

    try {
      const response = await fetch(`/api/refuge-registration?id=${deleteRegistrationId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await fetchRegistrations()
        setDeleteRegistrationId(null)
        alert('删除成功 / Delete successful')
      } else {
        alert('删除失败 / Delete failed')
      }
    } catch (error) {
      console.error('Error deleting refuge registration:', error)
      alert('删除失败 / Delete failed')
    }
  }

  const exportToCSV = () => {
    const headers = [
      '中文姓名',
      '英文姓名',
      '年龄',
      '出生日期',
      '性别',
      '联系号码',
      '地址',
      '报名日期',
      '备注'
    ]

    const csvData = filteredRegistrations.map(registration => [
      registration.chineseName,
      registration.englishName,
      registration.age,
      registration.dob,
      registration.gender === 'male' ? '男众 Male' : '女众 Female',
      registration.contactNumber,
      registration.address,
      new Date(registration.createdAt).toLocaleDateString('zh-CN'),
      registration.remarks || ''
    ])

    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `refuge-registrations-${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (!isLoaded) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <div className="text-2xl">🪷</div>
          <p className="text-lg text-grey-600">加载中... / Loading...</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <div className="text-2xl">🪷</div>
          <p className="text-lg text-grey-600">加载中... / Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="wrapper my-8">
      <div className="mb-8">
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">🪷</div>
          <h1 className="text-3xl font-bold text-orange-800 mb-2">
            净土宗皈依报名管理
          </h1>
          <p className="text-grey-600">
            Pure Land Buddhism Taking Refuge Registration Management
          </p>
        </div>

        <div className="flex flex-col gap-3 mb-6 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <Badge variant="secondary" className="text-lg px-4 py-2">
              总报名数: {filteredRegistrations.length}
              {filteredRegistrations.length !== registrations.length ? ` / ${registrations.length}` : ''}
            </Badge>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="flex gap-2 items-center">
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="搜索姓名或电话... / Search name or phone..."
                  className="w-full sm:w-[420px]"
                />
                {searchQuery.trim().length > 0 && (
                  <Button variant="outline" onClick={() => setSearchQuery('')}>
                    清除 / Clear
                  </Button>
                )}
              </div>
            </div>
          </div>

          <Button onClick={exportToCSV} className="bg-orange-600 hover:bg-orange-700">
            导出 CSV / Export CSV ({filteredRegistrations.length})
          </Button>
        </div>
      </div>

      <Card className="p-6">
        {registrations.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">🌸</div>
            <p className="text-lg text-grey-600">暂无报名记录 / No registrations found</p>
          </div>
        ) : filteredRegistrations.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">🔎</div>
            <p className="text-lg text-grey-600">没有匹配结果 / No matching results</p>
            <p className="text-sm text-grey-500 mt-2">
              搜索: <span className="font-mono">{searchQuery.trim()}</span>
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>中文姓名</TableHead>
                  <TableHead>英文姓名</TableHead>
                  <TableHead>年龄</TableHead>
                  <TableHead>出生日期</TableHead>
                  <TableHead>性别</TableHead>
                  <TableHead>联系号码</TableHead>
                  <TableHead>地址</TableHead>
                  <TableHead>报名日期</TableHead>
                  {isSuperadmin && <TableHead>备注</TableHead>}
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRegistrations.map((registration) => (
                  <TableRow key={registration._id}>
                    <TableCell className="font-medium">
                      {registration.chineseName}
                    </TableCell>
                    <TableCell>
                      {registration.englishName}
                    </TableCell>
                    <TableCell>
                      {registration.age}
                    </TableCell>
                    <TableCell>
                      {registration.dob}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={registration.gender === 'male' ? 'default' : 'secondary'}
                        className={registration.gender === 'male' ? 'bg-blue-100 text-blue-800' : 'bg-pink-100 text-pink-800'}
                      >
                        {registration.gender === 'male' ? '男众 Male' : '女众 Female'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {registration.contactNumber}
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {registration.address}
                    </TableCell>
                    <TableCell>
                      {new Date(registration.createdAt).toLocaleDateString('zh-CN')}
                    </TableCell>
                    {isSuperadmin && (
                      <TableCell className="min-w-[260px]">
                        <div className="flex gap-2 items-center">
                          <Input
                            value={remarksDrafts[registration._id] ?? ''}
                            onChange={(e) =>
                              setRemarksDrafts((prev) => ({
                                ...prev,
                                [registration._id]: e.target.value
                              }))
                            }
                            placeholder="备注 / Remarks"
                            className="h-9"
                            disabled={savingRemarksId === registration._id}
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleSaveRemarks(registration._id)}
                            disabled={
                              savingRemarksId === registration._id ||
                              (remarksDrafts[registration._id] ?? '') === (registration.remarks || '')
                            }
                          >
                            {savingRemarksId === registration._id ? '保存中...' : '保存'}
                          </Button>
                        </div>
                      </TableCell>
                    )}
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(registration)}
                          className="hover:bg-orange-50"
                        >
                          <Pencil className="h-4 w-4 text-orange-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteRegistrationId(registration._id)}
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
      <Dialog open={!!editingRegistration} onOpenChange={() => setEditingRegistration(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>编辑报名信息 / Edit Registration</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="edit-chinese-name">中文姓名 Chinese Name *</Label>
              <Input
                id="edit-chinese-name"
                value={editFormData.chineseName}
                onChange={(e) => setEditFormData({ ...editFormData, chineseName: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-english-name">英文姓名 English Name *</Label>
              <Input
                id="edit-english-name"
                value={editFormData.englishName}
                onChange={(e) => setEditFormData({ ...editFormData, englishName: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-age">年龄 Age *</Label>
              <Input
                id="edit-age"
                type="number"
                value={editFormData.age}
                onChange={(e) => setEditFormData({ ...editFormData, age: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-dob">出生日期 DOB *</Label>
              <Input
                id="edit-dob"
                type="date"
                value={editFormData.dob}
                onChange={(e) => setEditFormData({ ...editFormData, dob: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-gender">性别 Gender *</Label>
              <Select value={editFormData.gender} onValueChange={(value) => setEditFormData({ ...editFormData, gender: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="请选择 / Please select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">男众 Male</SelectItem>
                  <SelectItem value="female">女众 Female</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-contact">联系号码 Contact Number *</Label>
              <Input
                id="edit-contact"
                value={editFormData.contactNumber}
                onChange={(e) => setEditFormData({ ...editFormData, contactNumber: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-address">地址 Address *</Label>
              <Input
                id="edit-address"
                value={editFormData.address}
                onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-remarks">备注 Remarks</Label>
              <Input
                id="edit-remarks"
                value={editFormData.remarks}
                onChange={(e) => setEditFormData({ ...editFormData, remarks: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingRegistration(null)}>
              取消 / Cancel
            </Button>
            <Button onClick={handleSaveEdit} className="bg-orange-600 hover:bg-orange-700">
              保存 / Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteRegistrationId} onOpenChange={() => setDeleteRegistrationId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除 / Confirm Delete</AlertDialogTitle>
            <AlertDialogDescription>
              您确定要删除这条报名记录吗？此操作无法撤销。
              <br />
              Are you sure you want to delete this registration? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消 / Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              删除 / Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

