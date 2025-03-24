"use client"

import * as React from "react"
import { NavigationProgress } from "@/components/ui/navigation-progress"
import { BackButton } from "@/components/ui/back-button"

interface AccessibleLayoutProps {
  children: React.ReactNode
  showBackButton?: boolean
  backButtonLabel?: string
  className?: string
}

export function AccessibleLayout({
  children,
  showBackButton = false,
  backButtonLabel,
  className,
}: AccessibleLayoutProps) {
  return (
    <div className={className}>
      <NavigationProgress />
      {showBackButton && (
        <div className="fixed top-4 left-4 z-50">
          <BackButton label={backButtonLabel} />
        </div>
      )}
      <main
        role="main"
        className="min-h-screen pt-16"
        tabIndex={-1}
      >
        {children}
      </main>
    </div>
  )
} 