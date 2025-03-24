"use client"

import * as React from "react"
import { usePathname, useSearchParams } from "next/navigation"
import { cn } from "@/lib/utils"

export function NavigationProgress() {
  const [isNavigating, setIsNavigating] = React.useState(false)
  const pathname = usePathname()
  const searchParams = useSearchParams()

  React.useEffect(() => {
    setIsNavigating(true)
    const timeout = setTimeout(() => setIsNavigating(false), 500)
    return () => clearTimeout(timeout)
  }, [pathname, searchParams])

  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={isNavigating ? 100 : 0}
      className={cn(
        "fixed top-0 left-0 right-0 h-1 bg-primary transition-all duration-300 ease-in-out",
        isNavigating ? "opacity-100" : "opacity-0"
      )}
    />
  )
} 