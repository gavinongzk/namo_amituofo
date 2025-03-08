const CACHE_NAME = 'namo-amituofo-v1';
const API_CACHE_NAME = 'namo-amituofo-api-v1';

// Assets to cache immediately on SW install
const STATIC_ASSETS = [
  '/',
  '/assets/images/logo.svg',
  '/assets/icons/admin.png',
  // Add other static assets here
];

// Runtime caching routes
const API_ROUTES = [
  '/api/events',
  '/api/categories',
];

self.addEventListener('install', (event) => {
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
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name.startsWith('namo-amituofo-'))
          .filter((name) => name !== CACHE_NAME && name !== API_CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
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