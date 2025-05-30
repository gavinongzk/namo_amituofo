import type { Metadata } from 'next'
import { Poppins } from 'next/font/google'
import { ClerkProvider } from '@clerk/nextjs'
import { Toaster } from 'react-hot-toast';
import dynamic from 'next/dynamic'
import Script from 'next/script'

import './globals.css'

// Dynamically import NetworkStatus with no SSR
const NetworkStatus = dynamic(() => import('@/components/shared/NetworkStatus'), {
  ssr: false
})

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-poppins',
  display: 'swap',
  preload: true,
  fallback: ['system-ui', 'Arial', 'sans-serif'],
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SERVER_URL || 'https://reg.plb-sea.org'), // Add this line
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
    // Keep title concise for WhatsApp preview
    title: 'Namo Amituofo Registration',
    // Truncate description to 80 characters for WhatsApp
    description: '净土宗报名系统 - A platform for registering Pure Land Buddhism events and activities.',
    siteName: 'Namo Amituofo',
    images: [
      {
        // Use absolute URL for image
        url: `${process.env.NEXT_PUBLIC_SERVER_URL || 'https://reg.plb-sea.org'}/assets/images/amitabha_image.png`,
        width: 1200,
        height: 630,
        alt: 'Namo Amituofo',
        type: 'image/png',
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
  },
  manifest: '/manifest.json'
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
        fetchPriority="high"
      />
      <link 
        rel="preconnect" 
        href="https://fonts.googleapis.com" 
        crossOrigin="anonymous"
      />
      <link 
        rel="preconnect" 
        href="https://fonts.gstatic.com"
        crossOrigin="anonymous" 
      />
      <link
        rel="preconnect"
        href="https://utfs.io"
        crossOrigin="anonymous"
      />
      <link
        rel="dns-prefetch"
        href="https://utfs.io"
      />
    </>
  );

  // Critical CSS to be inlined
  const inlineCriticalCss = `
    /* Critical path CSS for fast initial render */
    .wrapper {
      max-width: 80rem;
      margin-left: auto;
      margin-right: auto;
      padding-left: 1rem;
      padding-right: 1rem;
      width: 100%;
    }
    @media (min-width: 640px) {
      .wrapper {
        padding-left: 1.5rem;
        padding-right: 1.5rem;
      }
    }
    @media (min-width: 1024px) {
      .wrapper {
        padding-left: 2rem;
        padding-right: 2rem;
      }
    }
  `;

  // Script to unregister any existing service workers
  const unregisterServiceWorker = `
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(function(registrations) {
        for(let registration of registrations) {
          registration.unregister();
          console.log('Service worker unregistered');
        }
        // Clear caches
        if ('caches' in window) {
          caches.keys().then(function(cacheNames) {
            cacheNames.forEach(function(cacheName) {
              if (cacheName.startsWith('namo-amituofo-')) {
                caches.delete(cacheName);
                console.log('Cache deleted:', cacheName);
              }
            });
          });
        }
      });
    }
  `;

  return (
    <ClerkProvider>
      <html lang="en">
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
          <meta name="apple-mobile-web-app-title" content="净土宗 | Namo Amituofo" />
          <meta name="apple-mobile-web-app-capable" content="yes" />
          <meta name="mobile-web-app-capable" content="yes" />
          <link rel="apple-touch-icon" href="/assets/images/logo.svg" />
          <link rel="apple-touch-icon-precomposed" href="/assets/images/logo.svg" />
          {preloadResources}
          <style dangerouslySetInnerHTML={{ __html: inlineCriticalCss }} />
          <meta name="theme-color" content="#a2826c" />
          {/* unregisterServiceWorker script moved below */}
        </head>
        <body className={poppins.variable}>
          <Script
            id="unregister-service-worker"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{ __html: unregisterServiceWorker }}
          />
          <NetworkStatus />

          <main className="flex min-h-screen flex-col">
            {children}
          </main>
          
          <Toaster
            position="top-center"
            reverseOrder={false}
            gutter={12}
            containerClassName=""
            containerStyle={{
              top: 20,
              right: 20,
              left: 20
            }}
            toastOptions={{
              duration: 5000,
              style: {
                background: '#ffffff',
                color: '#333333',
                padding: '16px',
                borderRadius: '12px',
                fontSize: '16px',
                maxWidth: '500px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                border: '1px solid rgba(0, 0, 0, 0.05)',
              },
              success: {
                style: {
                  background: '#ecfdf5',
                  color: '#065f46',
                  border: '1px solid #059669',
                },
                iconTheme: {
                  primary: '#059669',
                  secondary: '#ffffff',
                },
              },
              error: {
                style: {
                  background: '#fef2f2',
                  color: '#991b1b',
                  border: '1px solid #dc2626',
                },
                iconTheme: {
                  primary: '#dc2626',
                  secondary: '#ffffff',
                },
              },
            }}
          />

          {/* Performance analytics script with proper loading strategy */}
          <Script
            strategy="afterInteractive"
            id="performance-analytics"
            dangerouslySetInnerHTML={{
              __html: `
                // Basic performance tracking
                window.addEventListener('load', function() {
                  setTimeout(function() {
                    const timing = performance.getEntriesByType('navigation')[0];
                    const paint = performance.getEntriesByType('paint');
                    console.log('Page load time:', timing.loadEventEnd - timing.startTime, 'ms');
                    paint.forEach(p => console.log(p.name + ':', p.startTime, 'ms'));
                  }, 0);
                });
              `
            }}
          />
        </body>
      </html>
    </ClerkProvider>
  )
}
