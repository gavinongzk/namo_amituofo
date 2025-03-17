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
      />
    </>
  );

  // Add Service Worker registration script
  const swRegistration = `
    // Service worker version - update this when you deploy new changes
    const SW_VERSION = '3';
    
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js?v=' + SW_VERSION).then(registration => {
          console.log('SW registered:', registration.scope);
          
          // Check for updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            console.log('New service worker installing...');
            
            newWorker.addEventListener('statechange', () => {
              console.log('Service worker state:', newWorker.state);
              
              if (newWorker.state === 'installed') {
                if (navigator.serviceWorker.controller) {
                  // New content is available, show refresh UI
                  console.log('New version available! Refreshing...');
                  
                  // Create a refresh notification
                  const refreshNotification = document.createElement('div');
                  refreshNotification.style.position = 'fixed';
                  refreshNotification.style.bottom = '20px';
                  refreshNotification.style.left = '50%';
                  refreshNotification.style.transform = 'translateX(-50%)';
                  refreshNotification.style.backgroundColor = '#4CAF50';
                  refreshNotification.style.color = 'white';
                  refreshNotification.style.padding = '10px 20px';
                  refreshNotification.style.borderRadius = '5px';
                  refreshNotification.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
                  refreshNotification.style.zIndex = '9999';
                  refreshNotification.style.display = 'flex';
                  refreshNotification.style.alignItems = 'center';
                  refreshNotification.style.justifyContent = 'space-between';
                  refreshNotification.style.gap = '10px';
                  refreshNotification.innerHTML = '<span>New version available! Click to update.</span>';
                  
                  // Add refresh button
                  const refreshButton = document.createElement('button');
                  refreshButton.textContent = 'Update Now';
                  refreshButton.style.backgroundColor = 'white';
                  refreshButton.style.color = '#4CAF50';
                  refreshButton.style.border = 'none';
                  refreshButton.style.padding = '5px 10px';
                  refreshButton.style.borderRadius = '3px';
                  refreshButton.style.cursor = 'pointer';
                  
                  refreshButton.addEventListener('click', () => {
                    // Tell the service worker to skipWaiting
                    newWorker.postMessage({ type: 'SKIP_WAITING' });
                    document.body.removeChild(refreshNotification);
                  });
                  
                  refreshNotification.appendChild(refreshButton);
                  document.body.appendChild(refreshNotification);
                } else {
                  // At this point, everything has been precached
                  console.log('Content is cached for offline use.');
                }
              }
              
              if (newWorker.state === 'activated') {
                // Force refresh the page to ensure latest content is shown
                window.location.reload();
              }
            });
          });
          
          // Check for updates every 5 minutes
          setInterval(() => {
            registration.update();
            console.log('Checking for service worker updates...');
          }, 5 * 60 * 1000);
          
          // Also check for updates immediately
          registration.update();
        }).catch(error => {
          console.log('SW registration failed:', error);
        });
      });
      
      // Listen for controlling service worker changes
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('New service worker activated, reloading page...');
        window.location.reload();
      });
    }
  `;

  return (
    <ClerkProvider>
      <html lang="en">
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
          <meta name="apple-mobile-web-app-title" content="净土宗 | Namo Amituofo" />
          <meta name="apple-mobile-web-app-capable" content="yes" />
          <link rel="apple-touch-icon" href="/assets/images/logo.svg" />
          <link rel="apple-touch-icon-precomposed" href="/assets/images/logo.svg" />
          {preloadResources}
          <script src="/version.js" />
          <script dangerouslySetInnerHTML={{ __html: swRegistration }} />
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
