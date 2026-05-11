// ====================================
// Hip Va'a - Push Notification Handler
// Version: 1.0.0 Hip Va'a - 2026-05-11
// ====================================

const SW_VERSION = '1.0.0';
const SW_BUILD_DATE = '2026-05-11T00:00:00Z';

// Log version on script load
console.log(`[SW-Push v${SW_VERSION}] Script loaded at ${new Date().toISOString()}`);
console.log(`[SW-Push v${SW_VERSION}] Build date: ${SW_BUILD_DATE}`);

self.addEventListener('push', (event) => {
  const timestamp = new Date().toISOString();
  console.log(`[SW-Push v${SW_VERSION}] Push received at ${timestamp}`);

  // Log permission status
  console.log(`[SW-Push v${SW_VERSION}] Notification permission: ${Notification.permission}`);

  const hasData = !!event.data;
  console.log(`[SW-Push v${SW_VERSION}] Has data payload: ${hasData}`);

  let payload = null;
  let isFallback = false;

  if (hasData) {
    // Log raw data for debugging
    const rawData = event.data.text();
    console.log(`[SW-Push v${SW_VERSION}] Raw payload:`, rawData);

    try {
      payload = JSON.parse(rawData);
      console.log(`[SW-Push v${SW_VERSION}] Parsed payload:`, JSON.stringify(payload, null, 2));
    } catch (parseError) {
      console.error(`[SW-Push v${SW_VERSION}] Failed to parse payload:`, parseError);
      // Fallback: try to show notification with raw text
      payload = {
        title: "Hip Va'a",
        body: rawData.substring(0, 200)
      };
      isFallback = true;
      console.log(`[SW-Push v${SW_VERSION}] Using fallback payload (parse error)`);
    }
  } else {
    // NO DATA - show fallback notification to confirm push arrived
    payload = {
      title: "Hip Va'a (Diagnóstico)",
      body: `Push recebido sem payload - ${timestamp}`
    };
    isFallback = true;
    console.log(`[SW-Push v${SW_VERSION}] Using fallback payload (no data)`);
  }

  const options = {
    body: payload.body || 'Nova notificação',
    icon: payload.icon || '/pwa-192x192.png',
    badge: payload.badge || '/pwa-192x192.png',
    vibrate: [100, 50, 100],
    data: {
      url: payload.url || '/',
      receivedAt: timestamp,
      swVersion: SW_VERSION,
      isFallback,
      ...payload.data,
    },
    actions: payload.actions || [],
    tag: payload.tag || `notification-${Date.now()}`,
    renotify: true,
    requireInteraction: false,
    silent: false,
  };

  console.log(`[SW-Push v${SW_VERSION}] Notification options:`, JSON.stringify(options, null, 2));
  console.log(`[SW-Push v${SW_VERSION}] Calling showNotification with title: "${payload.title || "Hip Va'a"}"`);

  const notificationPromise = self.registration.showNotification(
    payload.title || "Hip Va'a",
    options
  ).then(() => {
    console.log(`[SW-Push v${SW_VERSION}] ✅ showNotification succeeded at ${new Date().toISOString()}`);
  }).catch((error) => {
    console.error(`[SW-Push v${SW_VERSION}] ❌ showNotification failed:`, error);
    console.error(`[SW-Push v${SW_VERSION}] Error name:`, error.name);
    console.error(`[SW-Push v${SW_VERSION}] Error message:`, error.message);
  });

  event.waitUntil(notificationPromise);
});

// Notification click handler with logging
self.addEventListener('notificationclick', (event) => {
  console.log(`[SW-Push v${SW_VERSION}] Notification clicked at ${new Date().toISOString()}`);
  console.log(`[SW-Push v${SW_VERSION}] Notification data:`, event.notification.data);

  event.notification.close();

  const url = event.notification.data?.url || '/';
  console.log(`[SW-Push v${SW_VERSION}] Navigating to: ${url}`);

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      console.log(`[SW-Push v${SW_VERSION}] Found ${windowClients.length} window clients`);

      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          console.log(`[SW-Push v${SW_VERSION}] Focusing existing window`);
          client.navigate(url);
          return client.focus();
        }
      }

      console.log(`[SW-Push v${SW_VERSION}] Opening new window`);
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});

// Notification close handler
self.addEventListener('notificationclose', (event) => {
  console.log(`[SW-Push v${SW_VERSION}] Notification closed:`, event.notification.tag);
});

// Log when SW activates
self.addEventListener('activate', (event) => {
  console.log(`[SW-Push v${SW_VERSION}] ⚡ Service Worker activated at ${new Date().toISOString()}`);
  // Claim all clients immediately
  event.waitUntil(clients.claim());
});

// Force immediate activation
self.addEventListener('install', (event) => {
  console.log(`[SW-Push v${SW_VERSION}] 📦 Service Worker installing at ${new Date().toISOString()}`);
  self.skipWaiting();
});
