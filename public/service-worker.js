self.addEventListener("push", (event) => {
  if (!event.data) return;

  const payload = event.data.json();
  const { title, body, url } = payload;

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      data: { url },
      icon: "/icon-192.png",
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";
  event.waitUntil(self.clients.openWindow(url));
});
