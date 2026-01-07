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
