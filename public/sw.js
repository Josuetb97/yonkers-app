/* Yonkers Service Worker — notificaciones push */
self.addEventListener("install",  () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(clients.claim()));

self.addEventListener("push", (e) => {
  const data = e.data?.json() ?? {};
  e.waitUntil(
    self.registration.showNotification(data.title || "Yonkers", {
      body:    data.body  || "",
      icon:    "/logo-yonkers.png",
      badge:   "/logo-yonkers.png",
      vibrate: [100, 50, 100],
      data:    { url: data.url || "/" },
    })
  );
});

self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const url = e.notification.data?.url || "/";
  e.waitUntil(clients.openWindow(url));
});
