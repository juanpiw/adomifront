/* eslint-disable no-undef */
importScripts('https://www.gstatic.com/firebasejs/10.13.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.13.1/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: 'AIzaSyA_AjqYAWsHbYPydVfV0NHXfQKv1RSrbn8',
  authDomain: 'adomiapp-notificaciones.firebaseapp.com',
  projectId: 'adomiapp-notificaciones',
  storageBucket: 'adomiapp-notificaciones.firebasestorage.app',
  messagingSenderId: '584385142195',
  appId: '1:584385142195:web:9de53f99549d9fefb2bfc6'
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const notificationTitle = payload.notification?.title || 'Adomi';
  const notificationOptions = {
    body: payload.notification?.body || '',
    icon: payload.notification?.icon || '/assets/icon-192x192.png',
    badge: payload.notification?.badge || '/assets/badge-72x72.png',
    data: {
      ...payload.data,
      click_action: payload.fcmOptions?.link || '/' 
    }
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification?.data?.click_action || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          client.postMessage({ type: 'notification-click', data: event.notification.data || {} });
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
      return undefined;
    })
  );
});

