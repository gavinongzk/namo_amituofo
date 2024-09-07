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
      console.log('Fetching user...'); // Debug statement
      try {
        const user = await currentUser()
        console.log('User fetched:', user); // Debug statement
        if (user?.publicMetadata?.role === 'admin' || user?.publicMetadata?.role === 'superadmin') {
          setIsAdmin(true)
          console.log('User is admin or superadmin'); // Debug statement
        } else {
          console.log('User is not authorized, redirecting...'); // Debug statement
          router.push('/') // Redirect non-admin users to the home page
        }
      } catch (error) {
        console.error('Error fetching user:', error)
        setMessage('Failed to fetch user. Please try again later.')
      } finally {
        setLoading(false)
        console.log('Loading state set to false'); // Debug statement
      }
    }
    fetchUser()
  }, [router])

  if (loading) {
    console.log('Loading...'); // Debug statement
    return <div>Loading...</div>
  }

  if (!isAdmin) {
    console.log('Access denied, user is not admin'); // Debug statement
    return <div>You do not have access to this page.</div>
  }

  const handleMarkAttendance = async () => {
    console.log('Marking attendance for queue number:', queueNumber); // Debug statement
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
      console.log('Attendance marked successfully:', data); // Debug statement
    } else {
      setMessage(data.message)
      console.error('Error marking attendance:', data.message); // Debug statement
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