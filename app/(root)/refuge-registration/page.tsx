 "use client"

import { useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { RefugeRegistrationForm } from '@/components/shared/RefugeRegistrationForm'

export default function RefugeRegistrationPage() {
  const searchParams = useSearchParams()

  const initialValues = useMemo(() => {
    return {
      chineseName: searchParams?.get('chineseName') || '',
      englishName: searchParams?.get('englishName') || '',
      age: searchParams?.get('age') || '',
      dob: searchParams?.get('dob') || '',
      gender: searchParams?.get('gender') || '',
      contactNumber: searchParams?.get('contactNumber') || '',
      address: searchParams?.get('address') || '',
    }
  }, [searchParams])

  const autoFocusEnglishName = (searchParams?.get('autofocus') || '') === '1'

  return (
    <RefugeRegistrationForm
      variant="page"
      initialValues={initialValues}
      autoFocusEnglishName={autoFocusEnglishName}
    />
  )
}

