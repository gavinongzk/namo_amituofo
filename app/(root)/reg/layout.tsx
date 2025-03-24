"use client"

import { AccessibleLayout } from "@/components/layouts/accessible-layout"

export default function RegistrationLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AccessibleLayout 
      showBackButton 
      backButtonLabel="Return to event details"
      className="relative"
    >
      {children}
    </AccessibleLayout>
  )
} 