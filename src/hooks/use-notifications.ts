'use client';

import { useEffect, useState } from 'react';
import { getMessaging, getToken, onMessage, Messaging } from 'firebase/messaging';
import { doc, updateDoc } from 'firebase/firestore';
import { useAuth, useFirestore, useUser } from '@/firebase';

/**
 * Hook pour gérer les notifications push Firebase Cloud Messaging
 */
export function useNotifications() {
  const [messaging, setMessaging] = useState<Messaging | null>(null);
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [error, setError] = useState<string | null>(null);
  const auth = useAuth();
  const firestore = useFirestore();
  const { user } = useUser();

  // Initialiser FCM
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const messagingInstance = getMessaging();
      setMessaging(messagingInstance);
      setPermission(Notification.permission);
    } catch (err) {
      console.error('Erreur lors de l\'initialisation de FCM:', err);
      setError('Impossible d\'initialiser les notifications');
    }
  }, []);

  // Demander la permission et obtenir le token
  const requestPermission = async () => {
    if (!messaging) {
      setError('Messaging non initialisé');
      return null;
    }

    try {
      // Demander la permission
      const permission = await Notification.requestPermission();
      setPermission(permission);

      if (permission !== 'granted') {
        setError('Permission refusée pour les notifications');
        return null;
      }

      // Obtenir le token FCM avec la clé VAPID
      const currentToken = await getToken(messaging, {
        vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY
      });

      if (currentToken) {
        setFcmToken(currentToken);
        
        // Sauvegarder le token dans Firestore pour l'utilisateur
        if (user && firestore) {
          await updateDoc(doc(firestore, 'users', user.uid), {
            fcmToken: currentToken,
            fcmTokenUpdatedAt: new Date(),
          });
        }

        return currentToken;
      } else {
        setError('Aucun token FCM disponible');
        return null;
      }
    } catch (err: any) {
      console.error('Erreur lors de la demande de permission:', err);
      setError(err.message || 'Erreur lors de la configuration des notifications');
      return null;
    }
  };

  // Écouter les messages en premier plan
  useEffect(() => {
    if (!messaging) return;

    const unsubscribe = onMessage(messaging, (payload) => {
      console.log('Message reçu en premier plan:', payload);

      // Afficher une notification locale
      if (payload.notification) {
        new Notification(payload.notification.title || 'Budget Pro', {
          body: payload.notification.body,
          icon: payload.notification.icon || '/icon-192.png',
          badge: '/icon-192.png',
          tag: payload.data?.tag || 'default',
          data: payload.data,
        });
      }
    });

    return () => unsubscribe();
  }, [messaging]);

  return {
    messaging,
    fcmToken,
    permission,
    error,
    requestPermission,
    isSupported: typeof window !== 'undefined' && 'Notification' in window,
  };
}
