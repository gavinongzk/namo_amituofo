import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Namo Amituofo Registration',
    short_name: 'Namo Amituofo',
    description: 'Namo Amituofo Registration is a platform for users to register for events.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#ffffff',
    icons: [
      {
        src: '/apple-touch-icon-57x57.png',
        sizes: '57x57',
        type: 'image/png'
      },
      {
        src: '/apple-touch-icon-72x72.png',
        sizes: '72x72',
        type: 'image/png'
      },
      {
        src: '/apple-touch-icon-76x76.png',
        sizes: '76x76',
        type: 'image/png'
      },
      {
        src: '/apple-touch-icon-114x114.png',
        sizes: '114x114',
        type: 'image/png'
      },
      {
        src: '/apple-touch-icon-120x120.png',
        sizes: '120x120',
        type: 'image/png'
      },
      {
        src: '/apple-touch-icon-144x144.png',
        sizes: '144x144',
        type: 'image/png'
      },
      {
        src: '/apple-touch-icon-152x152.png',
        sizes: '152x152',
        type: 'image/png'
      },
      {
        src: '/apple-touch-icon-180x180.png',
        sizes: '180x180',
        type: 'image/png'
      },
      {
        src: '/apple-touch-icon.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any maskable'
      },
      {
        src: '/assets/images/logo.svg',
        sizes: 'any',
        type: 'image/svg+xml'
      }
    ]
  }
} 