'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { currentUser } from '@clerk/nextjs'

// Define a type for registered users
type User = {
  id: string;
  name: string;
  queueNumber: string;
}

const AttendancePage = () => {
  const [registeredUsers, setRegisteredUsers] = useState<User[]>([])
  const [queueNumber, setQueueNumber] = useState('')
  const [message, setMessage] = useState('')
  const router = useRouter()
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    const fetchUser = async () => {
      const user = await currentUser()
      if (user?.publicMetadata?.role === 'admin' || user?.publicMetadata?.role === 'superadmin') {
        setIsAdmin(true)
        fetchRegisteredUsers() // Fetch registered users if admin
      } else {
        router.push('/') // Redirect non-admin users to the home page
      }
    }
    fetchUser()
  }, [router])

  const fetchRegisteredUsers = async () => {
    try {
      const res = await fetch('/api/registered-users') // Adjust the API endpoint as needed
      const data = await res.json()
      setRegisteredUsers(data)
    } catch (error) {
      console.error('Error fetching registered users:', error)
      setMessage('Failed to fetch registered users.')
    }
  }

  const handleMarkAttendance = async () => {
    const res = await fetch('/api/attendance', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ queueNumber }),
    });

    const data = await res.json();
    if (res.ok) {
      setMessage(`Attendance marked for ${data.order.buyer.firstName} ${data.order.buyer.lastName}`);
      // Optionally, you can also notify about the registration
      setMessage(prev => `${prev} - ${data.message}`);
    } else {
      setMessage(data.message);
    }
  }

  const handleCheckboxChange = async (userId: string) => { // Specify userId type
    // Logic to mark attendance for the user
    // You can send a request to the server to update the attendance status
    console.log(`Marking attendance for user ID: ${userId}`)
  }

  if (!isAdmin) {
    return <div>You do not have access to this page.</div>
  }

  return (
    <div className="wrapper my-8">
      <section className="bg-primary-50 bg-dotted-pattern bg-cover bg-center py-5 md:py-10">
        <h3 className="wrapper h3-bold text-center sm:text-left">Mark Attendance</h3>
      </section>

      <div className="wrapper my-8">
        <h4>Registered Users</h4>
        <ul>
          {registeredUsers.map((user: User) => ( // Specify User type
            <li key={user.id}>
              <label>
                <input
                  type="checkbox"
                  onChange={() => handleCheckboxChange(user.id)}
                />
                {user.name} - {user.queueNumber}
              </label>
            </li>
          ))}
        </ul>

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