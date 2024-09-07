'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { currentUser } from '@clerk/nextjs'

const AttendancePage = () => {
  const [queueNumber, setQueueNumber] = useState('')
  const [message, setMessage] = useState('')
  const router = useRouter()
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const user = await currentUser()
        if (user?.publicMetadata?.role === 'admin' || user?.publicMetadata?.role === 'superadmin') {
          setIsAdmin(true)
        } else {
          router.push('/') // Redirect non-admin users to the home page
        }
      } catch (error) {
        console.error('Error fetching user:', error)
        setMessage('Failed to fetch user. Please try again later.')
      } finally {
        setLoading(false)
      }
    }
    fetchUser()
  }, [router])

  if (loading) {
    return <div>Loading...</div>
  }

  if (!isAdmin) {
    return <div>You do not have access to this page.</div>
  }

  const handleMarkAttendance = async () => {
    const res = await fetch('/api/attendance', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ queueNumber }),
    })

    const data = await res.json()
    if (res.ok) {
      setMessage(`Attendance marked for ${data.order.buyer.firstName} ${data.order.buyer.lastName}`)
    } else {
      setMessage(data.message)
    }
  }

  return (
    <div className="wrapper my-8">
      <section className="bg-primary-50 bg-dotted-pattern bg-cover bg-center py-5 md:py-10">
        <h3 className="wrapper h3-bold text-center sm:text-left">Mark Attendance</h3>
      </section>

      <div className="wrapper my-8">
        <Input
          placeholder="Enter Queue Number"
          value={queueNumber}
          onChange={(e) => setQueueNumber(e.target.value)}
          className="input-field"
        />
        <Button onClick={handleMarkAttendance} className="button mt-4">
          Mark Attendance
        </Button>
        {message && <p className="mt-4">{message}</p>}
      </div>
    </div>
  )
}

export default AttendancePage