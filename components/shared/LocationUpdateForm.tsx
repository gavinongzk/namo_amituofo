'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { updateUserCountry } from '@/lib/actions/user.actions'
import { getUserById } from '@/lib/actions/user.actions'

const LocationUpdateForm = ({ userId }: { userId: string }) => {
  const [country, setCountry] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const fetchUserCountry = async () => {
      const user = await getUserById(userId)
      setCountry(user?.country || '')
    }
    fetchUserCountry()
  }, [userId])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    await updateUserCountry(userId, country)
    setIsLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col items-center gap-4">
      <select
        value={country}
        onChange={(e) => setCountry(e.target.value)}
        className="select select-bordered w-full max-w-xs"
      >
        <option value="">Select a country</option>
        <option value="Singapore">Singapore</option>
        <option value="Malaysia">Malaysia</option>
        {/* Add more countries as needed */}
      </select>
      <Button type="submit" disabled={isLoading}>
        {isLoading ? 'Updating...' : 'Update Country'}
      </Button>
    </form>
  )
}

export default LocationUpdateForm
