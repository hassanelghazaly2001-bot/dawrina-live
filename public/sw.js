self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  try {
    const data = event.data ? event.data.json() : { title: "DAWRINA", body: "New update", url: "/" };
    const title = data.title || "DAWRINA";
    const options = {
      body: data.body || "",
      icon: "/favicon.ico",
      badge: "/favicon.ico",
      data: { url: data.url || "/" },
    };
    event.waitUntil(self.registration.showNotification(title, options));
  } catch (e) {
    // ignore
  }
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/";
  event.waitUntil(clients.openWindow(url));
});
