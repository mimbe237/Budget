# ⚙️ Système de Paramètres Globaux - Admin Panel

## 📋 Vue d'ensemble

Nouveau système permettant aux administrateurs de configurer dynamiquement les informations de contact (WhatsApp, Email, Site Web) depuis le panneau admin, sans recompiler l'application.

---

## 🆕 Fonctionnalités Ajoutées

### 1. **Page Admin "Paramètres"**
📍 **Fichier** : `/admin_panel/src/app/admin/settings/page.tsx`

**Champs configurables** :
- 📱 **Contact WhatsApp** : Numéro au format international (+XXX...)
- 📧 **Email Support** : Adresse email du support
- 🌐 **Site Web** : URL du site de l'entreprise

**Validations en temps réel** :
- ✅ WhatsApp : Format international vérifié (regex : `^\+\d{1,3}\d{6,15}$`)
- ✅ Email : Format email standard
- ✅ URL : Format URL valide
- ✅ Aperçu du lien WhatsApp généré

**Fonctionnalités** :
- Sauvegarde dans Firebase Firestore (`appSettings/global`)
- Timestamp et auteur de la dernière modification
- Messages de feedback (succès/erreur)
- Instructions détaillées intégrées

---

### 2. **Service Flutter AppSettingsService**
📍 **Fichier** : `/lib/services/app_settings_service.dart`

**Singleton Pattern** :
```dart
final settingsService = AppSettingsService();
```

**Méthodes** :
- `loadSettings()` : Charge les paramètres depuis Firebase (une seule fois)
- `watchSettings()` : Stream en temps réel pour écouter les changements
- Getters : `whatsappNumber`, `supportEmail`, `websiteUrl`, `whatsappUrl`

**Valeurs par défaut** :
- WhatsApp : `+237612345678`
- Email : `support@budgetpro.app`
- Site Web : `https://www.beonweb.cm`

**Gestion des erreurs** :
- En cas d'échec Firebase, utilise les valeurs par défaut
- Pas de crash si Firebase inaccessible

---

### 3. **Intégration dans l'Application Flutter**

#### **Écran Support** (`support_screen.dart`)
- ✅ Chargement automatique des paramètres au démarrage
- ✅ Affichage dynamique du numéro WhatsApp
- ✅ Génération automatique du lien WhatsApp
- ✅ Email et Site Web configurables

#### **Écran Authentification** (`auth_screen.dart`)
- ✅ Footer avec contacts dynamiques
- ✅ Chips WhatsApp et Email mis à jour
- ✅ Lien BEONWEB dynamique
- ✅ Chargement des paramètres au `initState()`

---

### 4. **Règles de Sécurité Firestore**
📍 **Fichier** : `/firestore.rules`

```javascript
match /appSettings/{settingId} {
  // Lecture publique pour tous les utilisateurs authentifiés
  allow read: if isAuthenticated();
  // Écriture réservée aux admins uniquement
  allow write: if isAdmin();
}
```

**Sécurité** :
- 🔒 Lecture : Tous les utilisateurs authentifiés
- 🔐 Écriture : Admins uniquement (via custom claims)
- ⚠️ Pas d'accès public anonyme

---

### 5. **Ajout dans la Sidebar Admin**
📍 **Fichier** : `/admin_panel/src/components/Sidebar.tsx`

Nouveau menu :
```tsx
{ href: '/admin/settings', label: 'Paramètres', icon: Settings }
```

Position : Après "Traductions", avant la section statut/déconnexion

---

## 🗂️ Structure Firebase

### Collection : `appSettings`
### Document : `global`

```json
{
  "whatsappNumber": "+237612345678",
  "supportEmail": "support@budgetpro.app",
  "websiteUrl": "https://www.beonweb.cm",
  "updatedAt": "2025-12-03T10:30:00.000Z",
  "updatedBy": "admin@budgetpro.app"
}
```

---

## 🚀 Utilisation

### Pour les Administrateurs

1. **Accéder aux paramètres** :
   - Connexion au panneau admin
   - Menu "Paramètres" dans la sidebar
   
2. **Modifier le WhatsApp** :
   - Saisir le numéro au format international : `+237612345678`
   - Vérifier l'aperçu du lien généré
   - Cliquer sur "Enregistrer"

3. **Vérifier** :
   - Les utilisateurs verront les nouveaux contacts immédiatement
   - Pas besoin de redéployer l'application

### Pour les Développeurs

1. **Accéder aux paramètres dans Flutter** :
```dart
final settingsService = AppSettingsService();
await settingsService.loadSettings();

// Accès aux valeurs
final whatsapp = settingsService.whatsappNumber;
final email = settingsService.supportEmail;
final whatsappUrl = settingsService.whatsappUrl;
```

2. **Écouter les changements en temps réel** :
```dart
settingsService.watchSettings().listen((settings) {
  print('WhatsApp: ${settings['whatsappNumber']}');
  print('URL: ${settings['whatsappUrl']}');
});
```

---

## 📱 Format WhatsApp

### Format Accepté
✅ `+237612345678` (sans espaces)  
✅ `+33612345678`  
✅ `+1234567890`

### Format Refusé
❌ `237612345678` (sans +)  
❌ `+237 6 12 34 56 78` (avec espaces)  
❌ `06 12 34 56 78` (format local)

### Génération du Lien
Input : `+237612345678`  
Output : `https://wa.me/237612345678?text=Bonjour`

---

## ✅ Avantages

1. **Flexibilité** : Modification sans recompilation
2. **Centralisation** : Une seule source de vérité
3. **Temps réel** : Changements instantanés
4. **Sécurité** : Accès admin uniquement en écriture
5. **Fallback** : Valeurs par défaut si Firebase inaccessible
6. **Multi-écran** : Support, Auth, futurs écrans

---

## 🔧 Configuration Initiale

### 1. Créer le document Firebase (une seule fois)

Via Firebase Console ou script :
```javascript
// Firestore Console
Collection: appSettings
Document ID: global
Champs:
  - whatsappNumber: "+237612345678"
  - supportEmail: "support@budgetpro.app"
  - websiteUrl: "https://www.beonweb.cm"
```

### 2. Déployer les règles Firestore
```bash
firebase deploy --only firestore:rules
```

### 3. Compiler et déployer Flutter
```bash
flutter build web --release
firebase deploy --only hosting
```

### 4. Compiler et déployer Admin Panel
```bash
cd admin_panel
npm run build
vercel --prod
```

---

## 🧪 Tests

### Test 1 : Validation Format WhatsApp
1. Admin → Paramètres
2. Entrer `237612345678` (sans +)
3. Vérifier message d'erreur rouge
4. Entrer `+237612345678`
5. Vérifier aperçu lien vert

### Test 2 : Sauvegarde et Lecture
1. Admin → Modifier WhatsApp
2. Enregistrer
3. Flutter → Support → Vérifier nouveau numéro
4. Flutter → Auth Footer → Vérifier chip WhatsApp

### Test 3 : Temps Réel
1. Admin → Modifier paramètres
2. Flutter → Ne pas fermer l'app
3. Vérifier mise à jour automatique (si stream activé)

### Test 4 : Fallback
1. Désactiver WiFi
2. Ouvrir app Flutter
3. Vérifier valeurs par défaut affichées

---

## 📊 Statistiques

- **1 nouvelle page admin** : Settings
- **1 nouveau service Flutter** : AppSettingsService
- **2 écrans Flutter modifiés** : Support, Auth
- **1 collection Firestore** : appSettings
- **~450 lignes de code** ajoutées
- **3 validations** : WhatsApp, Email, URL

---

## 🔮 Évolutions Futures

1. **Plus de paramètres** :
   - Nom de l'application
   - Logo URL
   - Couleurs du thème
   - Messages système

2. **Multi-langue** :
   - Paramètres par langue
   - Messages personnalisés

3. **Notifications** :
   - Email de confirmation lors de changement
   - Log d'audit des modifications

4. **Version Mobile** :
   - Tests sur iOS/Android
   - Deep links WhatsApp

---

**Date de création** : 3 décembre 2025  
**Version** : Budget Pro Premium 1.1  
**Admin Panel** : https://budget-admin-xxxx.vercel.app/admin/settings
