import type { Metadata } from 'next'
import { Poppins } from 'next/font/google'
import { ClerkProvider } from '@clerk/nextjs'
import { Toaster } from 'react-hot-toast';
import { RouteWarmer } from '@/components/shared/RouteWarmer';

import './globals.css'

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-poppins',
})

export const metadata: Metadata = {
  title: 'Namo Amituofo Registration',
  description: 'Namo Amituofo Registration is a platform for users to register for events.',
  applicationName: 'Namo Amituofo',
  appleWebApp: {
    capable: true,
    title: 'Namo Amituofo',
    statusBarStyle: 'default'
  },
  manifest: '/manifest.json',
  themeColor: '#a2826c',
  icons: {
    icon: [
      { url: '/icons/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/icons/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/assets/images/logo.svg' }
    ],
    apple: [
      { url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }
    ]
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Add preload hints for critical resources
  const preloadResources = (
    <>
      <link 
        rel="preload" 
        href="/assets/images/logo.svg" 
        as="image" 
      />
      <link 
        rel="preconnect" 
        href="https://fonts.googleapis.com" 
      />
      <link 
        rel="preload"
        href="/api/events?country=Singapore"
        as="fetch"
        crossOrigin="anonymous"
      />
      <link 
        rel="preload"
        href="/api/events?country=Malaysia"
        as="fetch"
        crossOrigin="anonymous"
      />
    </>
  );

  return (
    <ClerkProvider>
      <html lang="en">
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
          <meta name="apple-mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-status-bar-style" content="default" />
          <meta name="apple-mobile-web-app-title" content="Namo Amituofo" />
          <link rel="manifest" href="/manifest.json" />
          {preloadResources}
        </head>
        <body className={poppins.variable}>
          <div className="context-container">
            {children}
          </div>
          <Toaster
            position="top-center"
            reverseOrder={false}
            gutter={8}
            containerStyle={{
              top: '50%',
              transform: 'translateY(-50%)',
            }}
            toastOptions={{
              duration: 5000,
              style: {
                background: '#fff',
                color: '#363636',
                padding: '16px',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
              },
            }}
          />
          <RouteWarmer />
        </body>
      </html>
    </ClerkProvider>
  )
}
