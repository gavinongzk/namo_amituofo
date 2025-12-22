 "use client"

import { useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { RefugeRegistrationForm } from '@/components/shared/RefugeRegistrationForm'

export default function RefugeRegistrationPage() {
  const searchParams = useSearchParams()

  const initialValues = useMemo(() => {
    const englishName = searchParams?.get('englishName') || ''
    const contactNumber = searchParams?.get('contactNumber') || ''
    return { englishName, contactNumber }
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

