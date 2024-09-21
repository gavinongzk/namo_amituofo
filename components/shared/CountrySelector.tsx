"use client"

import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { updateUserCountry } from '@/lib/actions/user.actions'

const CountrySelector = () => {
  const { user } = useUser()
  const [country, setCountry] = useState('')
  const [flag, setFlag] = useState('')

  useEffect(() => {
    const fetchCountry = async () => {
      if (user) {
        const savedCountry = user.publicMetadata.country as string
        if (savedCountry) {
          setCountry(savedCountry)
          setFlag(getCountryFlag(savedCountry))
          return
        }
      }

      try {
        const response = await fetch('https://get.geojs.io/v1/ip/country.json')
        const data = await response.json()
        setCountry(data.name)
        setFlag(getCountryFlag(data.name))
        if (user) {
          await updateUserCountry(user.id, data.name)
        }
      } catch (error) {
        console.error('Error fetching country:', error)
      }
    }

    fetchCountry()
  }, [user])

  const handleCountryChange = async (newCountry: string) => {
    setCountry(newCountry)
    setFlag(getCountryFlag(newCountry))
    if (user) {
      await updateUserCountry(user.id, newCountry)
    }
  }

  const getCountryFlag = (countryName: string) => {
    const flags: { [key: string]: string } = {
      'Singapore': '🇸🇬',
      'Malaysia': '🇲🇾',
      // Add more countries and their flags as needed
    }
    return flags[countryName] || ''
  }

  return (
    <div className="flex items-center">
      {flag && <span className="mr-2 text-2xl">{flag}</span>}
      <select
        value={country}
        onChange={(e) => handleCountryChange(e.target.value)}
        className="select select-bordered max-w-xs"
      >
        <option value="">Select a country</option>
        <option value="Singapore">Singapore</option>
        <option value="Malaysia">Malaysia</option>
        {/* Add more countries as needed */}
      </select>
    </div>
  )
}

export default CountrySelector
