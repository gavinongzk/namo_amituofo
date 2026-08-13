'use client'

import { Component, type ReactNode } from 'react'
import { ClerkProvider } from '@clerk/nextjs'
import { ClerkEnabledProvider } from './ClerkEnabledContext'

type Props = { children: ReactNode }

class ClerkErrorBoundary extends Component<Props, { hasError: boolean }> {
  state = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) {
      return (
        <ClerkEnabledProvider enabled={false}>
          {this.props.children}
        </ClerkEnabledProvider>
      )
    }

    return this.props.children
  }
}

export default function RootClerkProvider({ children }: Props) {
  return (
    <ClerkErrorBoundary>
      <ClerkEnabledProvider enabled>
        <ClerkProvider>{children}</ClerkProvider>
      </ClerkEnabledProvider>
    </ClerkErrorBoundary>
  )
}
