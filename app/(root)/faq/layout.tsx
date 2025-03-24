"use client"

import { AccessibleLayout } from "@/components/layouts/accessible-layout"

export default function FAQLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AccessibleLayout 
      showBackButton 
      backButtonLabel="Return to home page"
      className="relative"
    >
      {children}
    </AccessibleLayout>
  )
} 