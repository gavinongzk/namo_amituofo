"use client"

import { AccessibleLayout } from "@/components/layouts/accessible-layout"

export default function EventLookupLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AccessibleLayout 
      showBackButton 
      backButtonLabel="Return to events page"
      className="relative"
    >
      {children}
    </AccessibleLayout>
  )
} 