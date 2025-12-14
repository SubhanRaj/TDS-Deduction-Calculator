const CACHE_NAME = 'tds-calculator-v4';
const urlsToCache = [
  '/',
  '/index.html',
  '/style.css',
  '/script.js',
  '/manifest.json',
  '/assets/logo.svg',
  '/assets/logo.png',
  '/assets/logo.webp',
  '/assets/screenshots/1920x1080.png',
  '/assets/screenshots/iPhone 14 Pro Max Potrait.png',
  '/assets/screenshots/Samsung Galaxy S20 Ultra Potrait.png',
  '/assets/screenshots/iPad Pro Landscape.png',
  '/assets/icons/android/android-launchericon-192-192.png',
  '/assets/icons/android/android-launchericon-512-512.png',
  '/assets/icons/ios/180.png',
  '/assets/icons/ios/152.png',
  '/assets/icons/ios/144.png',
  '/assets/icons/ios/120.png',
  '/assets/icons/ios/32.png',
  '/assets/icons/ios/16.png',
  // CDN Resources - Cloudflare
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/7.0.1/css/all.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/7.0.1/js/all.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.8/css/bootstrap.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.8/js/bootstrap.bundle.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jquery/3.7.1/jquery.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/toastr.js/2.1.4/toastr.css',
  'https://cdnjs.cloudflare.com/ajax/libs/toastr.js/2.1.4/toastr.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/sweetalert2/11.23.0/sweetalert2.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/sweetalert2/11.23.0/sweetalert2.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/3.0.3/jspdf.umd.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/5.0.2/jspdf.plugin.autotable.min.js'
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

// Fetch Strategy: Cache First (Offline First) for all resources
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        // If found in cache, return it immediately
        if (cachedResponse) {
          return cachedResponse;
        }
        
        // If not in cache, fetch from network and cache it
        return fetch(event.request)
          .then((response) => {
            // Check if valid response
            if (!response || response.status !== 200 || response.type === 'error') {
              return response;
            }
            
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
            // If both cache and network fail, return offline fallback
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
