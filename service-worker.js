/**
 * ========================================
 * HABIT TRACKER 2026 - SERVICE WORKER
 * Enables offline functionality & caching
 * ========================================
 */

// Cache version - increment this when updating cached files
const CACHE_VERSION = 'v1.0.0';
const CACHE_NAME = `habit-tracker-${CACHE_VERSION}`;

// Core assets to cache for offline use
const CORE_ASSETS = [
    '/',
    '/index.html',
    '/style.css',
    '/script.js',
    '/manifest.json'
];

// Optional assets to cache (nice to have, but not critical)
const OPTIONAL_ASSETS = [
    '/admin.html',
    '/supabase.js'
];

// External resources to cache (fonts, CDN scripts)
const EXTERNAL_ASSETS = [
    'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap',
    'https://cdn.jsdelivr.net/npm/chart.js'
];

/**
 * INSTALL EVENT
 * Triggered when service worker is first installed
 * Pre-caches all core assets for offline use
 */
self.addEventListener('install', (event) => {
    console.log('[SW] Installing Service Worker...');
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[SW] Caching core assets...');
                
                // Cache core assets (required for app to work)
                return cache.addAll(CORE_ASSETS)
                    .then(() => {
                        console.log('[SW] Core assets cached successfully');
                        
                        // Try to cache optional assets (don't fail if these don't work)
                        return Promise.allSettled([
                            ...OPTIONAL_ASSETS.map(url => 
                                cache.add(url).catch(err => 
                                    console.log(`[SW] Optional asset skipped: ${url}`)
                                )
                            ),
                            ...EXTERNAL_ASSETS.map(url => 
                                cache.add(url).catch(err => 
                                    console.log(`[SW] External asset skipped: ${url}`)
                                )
                            )
                        ]);
                    });
            })
            .then(() => {
                // Force activation without waiting for tabs to close
                return self.skipWaiting();
            })
            .catch((error) => {
                console.error('[SW] Cache installation failed:', error);
            })
    );
});

/**
 * ACTIVATE EVENT
 * Triggered when service worker becomes active
 * Cleans up old caches from previous versions
 */
self.addEventListener('activate', (event) => {
    console.log('[SW] Activating Service Worker...');
    
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames
                        .filter((name) => {
                            // Delete caches that don't match current version
                            return name.startsWith('habit-tracker-') && name !== CACHE_NAME;
                        })
                        .map((name) => {
                            console.log(`[SW] Deleting old cache: ${name}`);
                            return caches.delete(name);
                        })
                );
            })
            .then(() => {
                console.log('[SW] Service Worker activated successfully');
                // Take control of all pages immediately
                return self.clients.claim();
            })
    );
});

/**
 * FETCH EVENT
 * Intercepts all network requests
 * Strategy: Cache First, then Network (with fallback)
 */
self.addEventListener('fetch', (event) => {
    const request = event.request;
    const url = new URL(request.url);
    
    // Skip non-GET requests (POST, PUT, DELETE, etc.)
    if (request.method !== 'GET') {
        return;
    }
    
    // Skip Supabase API requests - these should always go to network
    if (url.hostname.includes('supabase.co')) {
        return;
    }
    
    // Skip Chrome extension requests
    if (url.protocol === 'chrome-extension:') {
        return;
    }
    
    // Handle navigation requests (HTML pages)
    if (request.mode === 'navigate') {
        event.respondWith(
            networkFirstWithCache(request)
        );
        return;
    }
    
    // Handle static assets (CSS, JS, images)
    event.respondWith(
        cacheFirstWithNetwork(request)
    );
});

/**
 * Cache First Strategy
 * Best for static assets that don't change often
 * 1. Check cache first
 * 2. If not in cache, fetch from network and cache it
 * 3. Return cached or network response
 */
async function cacheFirstWithNetwork(request) {
    try {
        // Try cache first
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            // Return cached response, but update cache in background
            updateCacheInBackground(request);
            return cachedResponse;
        }
        
        // Not in cache, fetch from network
        const networkResponse = await fetch(request);
        
        // Cache the response for future use (only if successful)
        if (networkResponse.ok) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        // Network failed, try cache as fallback
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        
        // Nothing available, return error response
        console.error('[SW] Fetch failed:', request.url, error);
        return new Response('Offline - Resource not available', {
            status: 503,
            statusText: 'Service Unavailable'
        });
    }
}

/**
 * Network First Strategy
 * Best for HTML pages that may update
 * 1. Try network first (get fresh content)
 * 2. If network fails, fall back to cache
 * 3. Cache successful responses for offline use
 */
async function networkFirstWithCache(request) {
    try {
        // Try network first
        const networkResponse = await fetch(request);
        
        // Cache the fresh response
        if (networkResponse.ok) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        // Network failed, try cache
        console.log('[SW] Network failed, trying cache for:', request.url);
        
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        
        // Try to return cached index.html as fallback for navigation
        const fallbackResponse = await caches.match('/index.html');
        if (fallbackResponse) {
            return fallbackResponse;
        }
        
        // Nothing available
        return new Response('Offline - Page not available', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: { 'Content-Type': 'text/html' }
        });
    }
}

/**
 * Update cache in background (Stale While Revalidate)
 * Serves cached content immediately, but fetches fresh content in background
 */
async function updateCacheInBackground(request) {
    try {
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
            const cache = await caches.open(CACHE_NAME);
            await cache.put(request, networkResponse);
        }
    } catch (error) {
        // Silently fail - we already served cached content
    }
}

/**
 * MESSAGE EVENT
 * Handle messages from the main app
 * Useful for cache management and updates
 */
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    
    if (event.data && event.data.type === 'CLEAR_CACHE') {
        caches.delete(CACHE_NAME).then(() => {
            console.log('[SW] Cache cleared');
        });
    }
});

/**
 * NOTIFICATION CLICK EVENT
 * Handle clicks on push notifications
 * Opens the app and focuses the window
 */
self.addEventListener('notificationclick', (event) => {
    console.log('[SW] Notification clicked');
    
    // Close the notification
    event.notification.close();
    
    // Get the URL to open (from notification data or default)
    const urlToOpen = event.notification.data?.url || '/';
    
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then((clientList) => {
                // Check if app is already open
                for (const client of clientList) {
                    if (client.url.includes(self.registration.scope) && 'focus' in client) {
                        return client.focus();
                    }
                }
                // If not open, open a new window
                if (clients.openWindow) {
                    return clients.openWindow(urlToOpen);
                }
            })
    );
});

console.log('[SW] Service Worker script loaded');
