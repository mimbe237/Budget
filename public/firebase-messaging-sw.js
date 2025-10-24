// Firebase Cloud Messaging Service Worker
// Ce fichier doit être à la racine du dossier public pour fonctionner correctement

importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Configuration Firebase (à partir des variables d'environnement)
const firebaseConfig = {
  apiKey: "AIzaSyAWXdkN1Lr2oFhg-4CR_4VN1vmNp5DAn9E",
  authDomain: "studio-3821270625-cd276.firebaseapp.com",
  projectId: "studio-3821270625-cd276",
  storageBucket: "studio-3821270625-cd276.firebasestorage.app",
  messagingSenderId: "961816213503",
  appId: "1:961816213503:web:13f880d3a00d50a31419ca",
};

// Initialiser Firebase dans le Service Worker
firebase.initializeApp(firebaseConfig);

// Récupérer l'instance de messaging
const messaging = firebase.messaging();

// Gérer les notifications en arrière-plan
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Message reçu en arrière-plan:', payload);

  const notificationTitle = payload.notification?.title || 'BudgetWise';
  const notificationOptions = {
    body: payload.notification?.body || 'Vous avez une nouvelle notification',
    icon: payload.notification?.icon || '/icon-192.png',
    badge: '/icon-192.png',
    tag: payload.data?.tag || 'default',
    data: payload.data,
    requireInteraction: payload.data?.requireInteraction === 'true',
    vibrate: [200, 100, 200],
    actions: payload.data?.actions ? JSON.parse(payload.data.actions) : []
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Gérer le clic sur la notification
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification cliquée:', event);
  
  event.notification.close();

  // Déterminer l'URL à ouvrir en fonction du type de notification
  let urlToOpen = '/';
  
  if (event.notification.data) {
    const data = event.notification.data;
    
    if (data.url) {
      urlToOpen = data.url;
    } else if (data.type === 'budget_exceeded') {
      urlToOpen = '/categories';
    } else if (data.type === 'goal_achieved') {
      urlToOpen = '/goals';
    } else if (data.type === 'transaction_added') {
      urlToOpen = '/transactions';
    } else if (data.type === 'report_ready') {
      urlToOpen = '/reports';
    }
  }

  // Ouvrir ou focaliser l'application
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Chercher une fenêtre déjà ouverte
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            return client.focus().then(() => client.navigate(urlToOpen));
          }
        }
        // Ouvrir une nouvelle fenêtre si aucune n'est ouverte
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});
