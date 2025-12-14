const CACHE_NAME = 'tds-calculator-v2';
const urlsToCache = [
  '/',
  '/index.html',
  '/style.css',
  '/script.js',
  '/manifest.json',
  '/assets/logo.svg',
  '/assets/logo.png',
  '/assets/logo.webp',
  '/assets/screenshots/screenshot.png',
  '/assets/icons/android/android-launchericon-192-192.png',
  '/assets/icons/android/android-launchericon-512-512.png',
  '/assets/icons/ios/180.png',
  '/assets/icons/ios/152.png',
  '/assets/icons/ios/144.png',
  '/assets/icons/ios/120.png',
  '/assets/icons/ios/32.png',
  '/assets/icons/ios/16.png'
];

// Install Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
  self.skipWaiting();
});

// Activate Service Worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch Strategy: Network First, fallback to Cache
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Clone the response
        const responseToCache = response.clone();
        
        // Cache the fetched response for future use
        caches.open(CACHE_NAME)
          .then((cache) => {
            cache.put(event.request, responseToCache);
          });
        
        return response;
      })
      .catch(() => {
        // If network fails, try cache
        return caches.match(event.request)
          .then((response) => {
            if (response) {
              return response;
            }
            
            // For CDN resources, return a friendly error
            if (event.request.url.includes('cdn.')) {
              return new Response('Offline - CDN resource not available', {
                status: 503,
                statusText: 'Service Unavailable'
              });
            }
            
            return caches.match('/index.html');
          });
      })
  );
});

// Background Sync (for future enhancement)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-bills') {
    event.waitUntil(syncBills());
  }
});

function syncBills() {
  // Placeholder for future background sync functionality
  return Promise.resolve();
}

// Push Notifications (for future enhancement)
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'New update available',
    icon: '/assets/icons/android/android-launchericon-192-192.png',
    badge: '/assets/icons/android/android-launchericon-72-72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    }
  };
  
  event.waitUntil(
    self.registration.showNotification('TDS Calculator', options)
  );
});
