import { Suspense } from 'react'
import RefugeRegistrationClient from './RefugeRegistrationClient'

export default function RefugeRegistrationPage() {
  return (
    <Suspense fallback={null}>
      <RefugeRegistrationClient />
    </Suspense>
  )
}
