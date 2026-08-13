'use client'

import { createContext, useContext } from 'react'

export const ClerkEnabledContext = createContext(true)

export function useClerkEnabled() {
  return useContext(ClerkEnabledContext)
}

export function ClerkEnabledProvider({
  enabled,
  children,
}: {
  enabled: boolean
  children: React.ReactNode
}) {
  return (
    <ClerkEnabledContext.Provider value={enabled}>
      {children}
    </ClerkEnabledContext.Provider>
  )
}
