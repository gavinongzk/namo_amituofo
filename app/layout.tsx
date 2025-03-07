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
  title: '净土宗报名系统 | Namo Amituofo Registration',
  description: '净土宗报名系统 | Namo Amituofo Registration is a platform for users to register for events.',
  icons: {
    icon: '/assets/images/logo.svg',
    apple: '/assets/images/amitabha_image.png',
    shortcut: '/assets/images/amitabha_image.png',
    other: {
      rel: 'apple-touch-icon',
      url: '/assets/images/amitabha_image.png'
    }
  },
  openGraph: {
    type: 'website',
    title: '净土宗报名系统 | Namo Amituofo Registration',
    description: '净土宗报名系统 | Namo Amituofo Registration is a platform for users to register for events.',
    siteName: '净土宗 | Namo Amituofo',
    images: [
      {
        url: '/assets/images/amitabha_image.png',
        width: 1200,
        height: 630,
        alt: '净土宗 | Namo Amituofo',
      }
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: '净土宗报名系统 | Namo Amituofo Registration',
    description: '净土宗报名系统 | Namo Amituofo Registration is a platform for users to register for events.',
    images: ['/assets/images/amitabha_image.png'],
  },
  appleWebApp: {
    title: '净土宗报名系统 | Namo Amituofo Registration',
    statusBarStyle: 'black-translucent',
    capable: true,
    startupImage: [
      '/assets/images/amitabha_image.png'
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
          <meta name="apple-mobile-web-app-title" content="净土宗 | Namo Amituofo" />
          <link rel="apple-touch-icon" href="/assets/images/logo.svg" />
          <link rel="apple-touch-icon-precomposed" href="/assets/images/logo.svg" />
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
