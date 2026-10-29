// ==============================================================================
// SERVICE WORKER - SỔ TAY BÉO WEB PUSH NOTIFICATIONS & BACKGROUND REMINDERS
// ==============================================================================

const SW_VERSION = 'v1.0.0';

// 1. Cài đặt Service Worker
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// 2. Kích hoạt & kiểm soát ngay các client
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// 3. Lắng nghe sự kiện Push từ Web Push API hoặc Firebase Cloud Messaging (FCM)
self.addEventListener('push', (event) => {
  let data = {};

  try {
    if (event.data) {
      data = event.data.json();
    }
  } catch (e) {
    data = {
      title: 'Nhắc nhở Sổ Tay Béo',
      body: event.data ? event.data.text() : 'Bạn có thông báo mới.',
    };
  }

  // Chuẩn hóa payload từ FCM hoặc Web Push thông thường
  const notificationTitle =
    data.notification?.title || data.title || 'Nhắc Nhở Lịch Dạy Học';

  const notificationOptions = {
    body:
      data.notification?.body ||
      data.body ||
      'Đến giờ lên lớp hoặc có cập nhật lịch mới.',
    icon: data.notification?.icon || data.icon || '/icon.png',
    badge: data.badge || '/icon.png',
    tag: data.tag || `so-tay-beo-reminder-${Date.now()}`,
    vibrate: [200, 100, 200],
    data: {
      url: data.data?.url || data.url || '/?tab=teaching_schedule',
      timestamp: Date.now(),
      ...data.data,
    },
    actions: data.actions || [
      { action: 'open', title: 'Xem chi tiết' },
      { action: 'dismiss', title: 'Đóng' },
    ],
    requireInteraction: data.requireInteraction !== undefined ? data.requireInteraction : true,
  };

  event.waitUntil(
    self.registration.showNotification(notificationTitle, notificationOptions)
  );
});

// 4. Lắng nghe khi người dùng bấm vào thông báo
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  const targetUrl = event.notification.data?.url || '/?tab=teaching_schedule';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Nếu đã có cửa sổ ứng dụng đang mở, chuyển tiêu điểm tới đó và điều hướng
      for (const client of windowClients) {
        if ('focus' in client) {
          if (client.url.includes(self.location.origin)) {
            client.postMessage({
              type: 'NOTIFICATION_CLICKED',
              url: targetUrl,
              data: event.notification.data,
            });
            client.navigate(targetUrl);
            return client.focus();
          }
        }
      }

      // Nếu chưa có cửa sổ nào đang mở, mở cửa sổ mới
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});

// 5. Lắng nghe tin nhắn từ trang giao diện (Client -> Service Worker)
// Giúp gửi thông báo thử nghiệm trực tiếp từ giao diện người dùng
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const { title, options } = event.data;
    const finalOptions = {
      icon: '/icon.png',
      badge: '/icon.png',
      vibrate: [150, 80, 150],
      requireInteraction: false,
      data: { url: '/?tab=teaching_schedule' },
      ...options,
    };
    self.registration.showNotification(title || 'Sổ Tay Béo', finalOptions);
  }
});
