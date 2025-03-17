import type { Metadata } from 'next'
import { Poppins } from 'next/font/google'
import { ClerkProvider } from '@clerk/nextjs'
import { Toaster } from 'react-hot-toast';
import { RouteWarmer } from '@/components/shared/RouteWarmer';

import './globals.css'

// Optimize font loading with display swap
const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-poppins',
  display: 'swap',
  preload: true,
  fallback: ['system-ui', 'sans-serif'],
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
        rel="dns-prefetch"
        href="https://fonts.googleapis.com"
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

  // Script for performance optimization
  const performanceOptimization = `
    // Optimize resource loading
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        // Log slow resources for debugging
        if (entry.duration > 300) {
          console.warn('Slow resource:', entry.name, 'Duration:', entry.duration);
        }
      });
    });
    
    // Observe resource timing
    observer.observe({ entryTypes: ['resource'] });
    
    // Optimize image loading
    if ('loading' in HTMLImageElement.prototype) {
      document.querySelectorAll('img[loading="lazy"]').forEach(img => {
        img.loading = 'lazy';
      });
    }
    
    // Optimize third-party scripts
    const deferThirdPartyScripts = () => {
      // Identify non-critical scripts and defer them
      document.querySelectorAll('script[data-type="third-party"]').forEach(script => {
        script.setAttribute('defer', '');
      });
    };
    
    // Execute after page load
    if (document.readyState === 'complete') {
      deferThirdPartyScripts();
    } else {
      window.addEventListener('load', deferThirdPartyScripts);
    }
  `;

  return (
    <ClerkProvider>
      <html lang="en">
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
          <meta name="apple-mobile-web-app-title" content="净土宗 | Namo Amituofo" />
          <meta name="mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-capable" content="yes" />
          <link rel="apple-touch-icon" href="/assets/images/logo.svg" />
          <link rel="apple-touch-icon-precomposed" href="/assets/images/logo.svg" />
          {preloadResources}
          <script dangerouslySetInnerHTML={{ __html: unregisterServiceWorker }} />
          <script dangerouslySetInnerHTML={{ __html: performanceOptimization }} />
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
