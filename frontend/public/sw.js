self.addEventListener("install", (event) => {
    self.skipWaiting(); // Force the waiting service worker to become active
});

self.addEventListener("activate", (event) => {
    event.waitUntil(clients.claim()); // Become available to all pages immediately
});

self.addEventListener("message", (event) => {
    if (event.data && event.data.type === "SKIP_WAITING") {
        self.skipWaiting();
    }
});

self.addEventListener("push", function (event) {
    const data = event.data.json();
    const title = data.title || "Twikit Notification";
    const options = {
        body: data.body || "You have a new notification",
        icon: "/icon.png", // Ensure you have an icon here or use default
        badge: "/badge.png",
        data: {
            url: data.url || "/",
        },
    };

    event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", function (event) {
    event.notification.close();
    event.waitUntil(
        clients.matchAll({ type: "window" }).then(function (clientList) {
            if (clients.openWindow) {
                return clients.openWindow(event.notification.data.url);
            }
        })
    );
});

// Fetch handler (required for PWA installability)
self.addEventListener("fetch", (event) => {
    // Basic network-only strategy for now
    event.respondWith(fetch(event.request).catch(() => {
        // Fallback for offline if we had a cache
        return;
    }));
});
