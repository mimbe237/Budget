# Notifications Push avec Firebase Cloud Messaging (FCM)

## Vue d'ensemble

Les notifications push permettent d'envoyer des alertes en temps réel aux utilisateurs sur:
- Budgets dépassés (90% et 100%)
- Objectifs d'épargne atteints
- Transactions importantes (>100€)
- Rapports hebdomadaires et mensuels

## Architecture

### Frontend (Next.js)
- **Service Worker**: `/public/firebase-messaging-sw.js`
- **Hook React**: `/src/hooks/use-notifications.ts`
- **Composant UI**: `/src/components/notifications/notification-settings.tsx`

### Backend (Cloud Functions)
- **Fichier**: `/functions/src/notifications.ts`
- **Triggers**: Firestore onCreate/onUpdate, Scheduled (cron)

## Configuration Requise

### 1. Générer une clé VAPID

Les clés VAPID (Voluntary Application Server Identification) sont nécessaires pour les notifications web push.

**Étapes:**

1. Allez sur [Firebase Console](https://console.firebase.google.com/)
2. Sélectionnez votre projet
3. **Project Settings** → **Cloud Messaging**
4. Section **Web Push certificates**
5. **Generate key pair**
6. Copiez la clé générée (commence par `B...`)

**Ajoutez la clé dans `.env.local`:**

```bash
NEXT_PUBLIC_FIREBASE_VAPID_KEY="VOTRE_CLE_VAPID_ICI"
```

### 2. Activer Firebase Cloud Messaging

1. Firebase Console → **Cloud Messaging**
2. Vérifiez que l'API est activée
3. Aucune configuration supplémentaire nécessaire (déjà géré par Firebase)

### 3. Configuration du Service Worker

Le Service Worker est déjà créé dans `/public/firebase-messaging-sw.js` et contient:
- Configuration Firebase
- Gestion des notifications en arrière-plan
- Gestion des clics sur les notifications
- Routage vers les bonnes pages

**Aucune action requise** - Le fichier est automatiquement servi par Next.js.

## Utilisation

### Dans l'application (Frontend)

#### 1. Hook `useNotifications`

```typescript
import { useNotifications } from '@/hooks/use-notifications';

function MyComponent() {
  const { 
    fcmToken,           // Token FCM actuel
    permission,         // 'default' | 'granted' | 'denied'
    error,             // Message d'erreur éventuel
    requestPermission, // Fonction pour demander la permission
    isSupported        // true si le navigateur supporte les notifications
  } = useNotifications();

  // Demander la permission
  const handleEnable = async () => {
    const token = await requestPermission();
    if (token) {
      console.log('Notifications activées:', token);
    }
  };

  return (
    <button onClick={handleEnable}>
      Activer les notifications
    </button>
  );
}
```

#### 2. Composant `NotificationSettings`

Déjà intégré dans `/app/settings/page.tsx`:

```typescript
import { NotificationSettings } from '@/components/notifications/notification-settings';

<NotificationSettings />
```

**Fonctionnalités:**
- ✅ Bouton d'activation avec états (loading, erreur, succès)
- ✅ Préférences de notification (5 types)
- ✅ Sauvegarde automatique du token FCM dans Firestore
- ✅ Gestion des permissions du navigateur
- ✅ Messages d'erreur localisés

### Cloud Functions (Backend)

#### Installation des dépendances

```bash
cd functions
npm install firebase-functions firebase-admin
```

#### Déploiement

```bash
# Déployer toutes les functions
firebase deploy --only functions

# Ou déployer une fonction spécifique
firebase deploy --only functions:onBudgetExceeded
firebase deploy --only functions:onGoalAchieved
firebase deploy --only functions:onLargeTransaction
firebase deploy --only functions:sendWeeklyReport
```

## Types de Notifications

### 1. Budget Dépassé (`onBudgetExceeded`)

**Trigger:** Création d'une transaction de type expense
**Condition:** Budget atteint à 90% ou 100%

**Payload:**
```javascript
{
  notification: {
    title: '🚨 Budget dépassé !',
    body: 'Vous avez dépensé 95% de votre budget Alimentation'
  },
  data: {
    type: 'budget_exceeded',
    category: 'Alimentation',
    percentUsed: '95',
    url: '/categories'
  }
}
```

**Test manuel:**
```bash
# Ajouter une transaction qui dépasse le budget
```

---

### 2. Objectif Atteint (`onGoalAchieved`)

**Trigger:** Mise à jour d'un objectif (acquiredAmount >= targetAmount)
**Condition:** L'objectif vient juste d'être atteint

**Payload:**
```javascript
{
  notification: {
    title: '🎉 Objectif atteint !',
    body: 'Félicitations ! Vous avez atteint votre objectif "Vacances d\'été"'
  },
  data: {
    type: 'goal_achieved',
    goalId: 'abc123',
    goalName: 'Vacances d\'été',
    url: '/goals',
    requireInteraction: 'true' // Notification persistante
  }
}
```

---

### 3. Transaction Importante (`onLargeTransaction`)

**Trigger:** Création d'une transaction de type expense
**Condition:** Montant > 100€ (10000 centimes)

**Payload:**
```javascript
{
  notification: {
    title: '💰 Transaction importante',
    body: 'Dépense de 150.00 EUR enregistrée dans Shopping'
  },
  data: {
    type: 'transaction_added',
    transactionId: 'xyz789',
    category: 'Shopping',
    amount: '15000',
    url: '/transactions'
  }
}
```

**Personnalisation du seuil:**
```typescript
// Dans functions/src/notifications.ts, ligne 145
const LARGE_AMOUNT_THRESHOLD = 10000; // Modifiez cette valeur
```

---

### 4. Rapport Hebdomadaire (`sendWeeklyReport`)

**Trigger:** Scheduled function (cron)
**Fréquence:** Chaque dimanche à 18h (Europe/Paris)

**Payload:**
```javascript
{
  notification: {
    title: '📊 Votre rapport hebdomadaire',
    body: 'Cette semaine, vous avez dépensé 245.50 EUR'
  },
  data: {
    type: 'report_ready',
    reportType: 'weekly',
    totalSpent: '24550',
    url: '/reports'
  }
}
```

**Modifier la fréquence:**
```typescript
// Dans functions/src/notifications.ts, ligne 199
.schedule('0 18 * * 0') // Format cron
// Syntaxe: minute heure jour mois jour_semaine
// Exemples:
// '0 18 * * 0' = Dimanche 18h
// '0 9 1 * *'  = 1er du mois 9h
// '0 12 * * 1' = Lundi 12h
```

## Gestion des Clics

Le Service Worker gère automatiquement les clics sur les notifications:

```javascript
// Dans firebase-messaging-sw.js
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  // Routage basé sur le type
  let urlToOpen = '/';
  
  if (data.type === 'budget_exceeded') urlToOpen = '/categories';
  if (data.type === 'goal_achieved') urlToOpen = '/goals';
  if (data.type === 'transaction_added') urlToOpen = '/transactions';
  if (data.type === 'report_ready') urlToOpen = '/reports';
  
  // Ouvrir ou focaliser l'onglet
  clients.openWindow(urlToOpen);
});
```

## Personnalisation

### Ajouter un nouveau type de notification

**1. Créer la Cloud Function:**

```typescript
// functions/src/notifications.ts
export const onCustomEvent = functions.firestore
  .document('users/{userId}/events/{eventId}')
  .onCreate(async (snapshot, context) => {
    const { userId } = context.params;
    const event = snapshot.data();
    
    const userDoc = await admin.firestore()
      .collection('users')
      .doc(userId)
      .get();
    
    const fcmToken = userDoc.data()?.fcmToken;
    if (!fcmToken) return;
    
    const message = {
      notification: {
        title: '🔔 Événement personnalisé',
        body: 'Description de l\'événement'
      },
      data: {
        type: 'custom_event',
        eventId: context.params.eventId,
        url: '/custom-page'
      },
      token: fcmToken
    };
    
    await admin.messaging().send(message);
  });
```

**2. Ajouter le routage dans le Service Worker:**

```javascript
// public/firebase-messaging-sw.js
if (data.type === 'custom_event') {
  urlToOpen = '/custom-page';
}
```

**3. Déployer:**

```bash
firebase deploy --only functions:onCustomEvent
```

## Tests

### Test en local

1. **Lancer le serveur de développement:**
```bash
npm run dev
```

2. **Ouvrir l'application:**
```
http://localhost:9002/settings
```

3. **Activer les notifications:**
- Cliquer sur "Activer les notifications"
- Accepter la permission du navigateur
- Vérifier que le token FCM est sauvegardé

4. **Tester une notification manuelle:**

Utilisez la Firebase Console ou curl:

```bash
curl -X POST https://fcm.googleapis.com/fcm/send \
  -H "Authorization: key=VOTRE_SERVER_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "notification": {
      "title": "Test Notification",
      "body": "Ceci est un test",
      "icon": "/icon-192.png"
    },
    "data": {
      "type": "test",
      "url": "/"
    },
    "to": "VOTRE_FCM_TOKEN"
  }'
```

**Obtenir la Server Key:**
- Firebase Console → Project Settings → Cloud Messaging → Server key

### Test des Cloud Functions

**Émulateur local:**

```bash
cd functions
npm run serve

# Dans un autre terminal
firebase emulators:start
```

**Test en production:**

1. Déployer les functions
2. Créer une transaction/objectif dans l'app
3. Vérifier les logs Firebase Console → Functions

## Debugging

### Logs des notifications

**Frontend (Console navigateur):**
```javascript
// Les logs apparaissent dans la console
console.log('[firebase-messaging-sw.js] Message reçu:', payload);
```

**Backend (Firebase Console):**
- Functions → Logs
- Filtrer par nom de fonction
- Chercher les erreurs

### Problèmes courants

#### 1. "Notifications non supportées"

**Cause:** Navigateur ne supporte pas l'API Notification

**Solution:** Utiliser Chrome, Firefox, Edge, Safari (>16.4)

#### 2. "Permission refusée"

**Cause:** L'utilisateur a bloqué les notifications

**Solution:**
1. Chrome: Paramètres → Confidentialité → Paramètres du site → Notifications
2. Supprimer le site de la liste des sites bloqués
3. Recharger la page

#### 3. "Token non sauvegardé"

**Cause:** Erreur Firestore ou règles de sécurité

**Solution:**
- Vérifier les règles Firestore (users/{userId} update)
- Vérifier la console pour les erreurs
- Vérifier que l'utilisateur est authentifié

#### 4. "Service Worker non enregistré"

**Cause:** Chemin incorrect ou HTTPS requis

**Solution:**
- Service Worker doit être à `/firebase-messaging-sw.js`
- HTTPS requis en production (OK pour localhost)
- Vérifier dans DevTools → Application → Service Workers

#### 5. "Notification ne s'affiche pas"

**Cause:** Multiple possibles

**Checklist:**
- ✅ Permission accordée ?
- ✅ Token FCM sauvegardé dans Firestore ?
- ✅ Cloud Function déployée et exécutée ?
- ✅ Logs Firebase Functions sans erreur ?
- ✅ Service Worker actif ?
- ✅ Navigateur ouvert (pour foreground) ou fermé (pour background) ?

## Bonnes Pratiques

### 1. Fréquence des notifications

❌ **Ne pas faire:**
- Envoyer des notifications pour chaque petite transaction
- Spammer l'utilisateur plusieurs fois par jour

✅ **À faire:**
- Grouper les notifications similaires
- Respecter les préférences utilisateur
- Limiter à 2-3 notifications max par jour

### 2. Contenu des notifications

❌ **Ne pas faire:**
- Texte trop long (>100 caractères)
- Informations sensibles (montants exacts dans le titre)

✅ **À faire:**
- Titre court et accrocheur
- Body informatif mais concis
- Emoji pour attirer l'attention (avec modération)

### 3. Actions sur les notifications

✅ **Implémenter:**
- Routage vers la page pertinente
- Actions directes (ex: "Voir détails", "Ignorer")

```javascript
// Exemple avec actions
const message = {
  notification: {
    title: 'Budget dépassé',
    body: 'Alimentation: 105% utilisé'
  },
  data: {
    actions: JSON.stringify([
      { action: 'view', title: 'Voir détails' },
      { action: 'ignore', title: 'Ignorer' }
    ])
  }
};
```

### 4. Sécurité

✅ **Toujours:**
- Vérifier que l'utilisateur est authentifié
- Valider les données avant d'envoyer
- Ne jamais exposer les tokens FCM côté client
- Supprimer les tokens expirés/invalides

## Production

### Checklist avant déploiement

- [ ] Clé VAPID générée et ajoutée
- [ ] Service Worker en place
- [ ] Cloud Functions déployées
- [ ] Tests effectués sur tous les types
- [ ] HTTPS configuré (obligatoire en production)
- [ ] Permissions demandées au bon moment (pas au chargement initial)
- [ ] Préférences utilisateur respectées
- [ ] Icônes de notification créées (/icon-192.png)

### Monitoring

**Métriques à surveiller:**
- Taux d'activation des notifications
- Taux de clic sur les notifications
- Tokens FCM expirés
- Erreurs d'envoi (via Firebase Console)

**Firebase Analytics:**
```typescript
// Logger les interactions
import { logEvent } from 'firebase/analytics';

logEvent(analytics, 'notification_permission_granted');
logEvent(analytics, 'notification_clicked', { type: 'budget_exceeded' });
```

## Coûts

### Firebase Cloud Messaging

- **Gratuit:** Illimité pour les notifications

### Cloud Functions

- **Gratuit:** 2M invocations/mois
- **Payant:** 0.40$ par million après
- **Scheduled Functions:** Comptent comme des invocations

**Estimation pour 1000 utilisateurs actifs:**
- 4 types de notifications
- ~10 notifications/utilisateur/mois
- Total: ~40K invocations/mois = **GRATUIT** ✅

## Support

**Documentation officielle:**
- [Firebase Cloud Messaging](https://firebase.google.com/docs/cloud-messaging)
- [Web Push Protocol](https://developers.google.com/web/fundamentals/push-notifications)
- [Service Workers](https://developer.mozilla.org/fr/docs/Web/API/Service_Worker_API)

**Résumé:**
✅ Notifications push complètement implémentées
✅ 4 types de notifications automatiques
✅ Interface utilisateur dans Settings
✅ Cloud Functions prêtes à déployer
✅ Documentation complète
