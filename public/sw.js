// Service worker version - this will be updated by the version.js file
let CACHE_VERSION = '3'; 

// Try to get the version from the query parameter in the service worker URL
const urlParams = new URL(self.location).searchParams;
const versionParam = urlParams.get('v');

if (versionParam) {
  CACHE_VERSION = versionParam;
  console.log(`Using version from URL parameter: ${CACHE_VERSION}`);
} else {
  console.log(`Using default version: ${CACHE_VERSION}`);
}

const CACHE_NAME = `namo-amituofo-v${CACHE_VERSION}`;
const API_CACHE_NAME = `namo-amituofo-api-v${CACHE_VERSION}`;

// Assets to cache immediately on SW install
const STATIC_ASSETS = [
  '/',
  '/version.js', // Add version.js to static assets
  '/assets/images/logo.svg',
  '/assets/icons/admin.png',
  // Add other static assets here
];

// Runtime caching routes
const API_ROUTES = [
  '/api/events',
  '/api/categories',
];

// Pages that should never be cached
const NEVER_CACHE_ROUTES = [
  '/event-lookup',
  '/profile',
  '/',
  '/register', // Add register page to never cache list
];

// Listen for messages from the main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('install', (event) => {
  console.log(`Installing new service worker v${CACHE_VERSION}`);
  
  // Skip waiting to activate immediately
  self.skipWaiting();
  
  event.waitUntil(
    Promise.all([
      // Cache static assets
      caches.open(CACHE_NAME).then((cache) => {
        return cache.addAll(STATIC_ASSETS);
      }),
      // Cache API responses
      caches.open(API_CACHE_NAME)
    ])
  );
});

self.addEventListener('activate', (event) => {
  console.log(`Activating new service worker v${CACHE_VERSION}`);
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name.startsWith('namo-amituofo-'))
          .filter((name) => name !== CACHE_NAME && name !== API_CACHE_NAME)
          .map((name) => {
            console.log(`Deleting old cache: ${name}`);
            return caches.delete(name);
          })
      );
    }).then(() => {
      // Claim clients so the new service worker takes effect immediately
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Skip caching for navigation pages and pages that should never be cached
  if (NEVER_CACHE_ROUTES.some(route => url.pathname === route || url.pathname.startsWith(route))) {
    event.respondWith(fetch(event.request));
    return;
  }
  
  // Handle API requests
  if (API_ROUTES.some(route => url.pathname.startsWith(route))) {
    event.respondWith(
      caches.open(API_CACHE_NAME).then((cache) => {
        return fetch(event.request)
          .then((response) => {
            // Clone the response before caching
            const clonedResponse = response.clone();
            
            // Only cache successful responses
            if (response.ok) {
              cache.put(event.request, clonedResponse);
            }
            
            return response;
          })
          .catch(() => {
            // Return cached response if available
            return cache.match(event.request);
          });
      })
    );
    return;
  }

  // Handle static assets
  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        return response;
      }

      // Clone the request
      const fetchRequest = event.request.clone();

      return fetch(fetchRequest).then((response) => {
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        // Clone the response
        const responseToCache = response.clone();

        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return response;
      });
    })
  );
}); 