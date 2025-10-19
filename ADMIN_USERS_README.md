# Page Admin "Utilisateurs" - Documentation

## 🎯 Vue d'ensemble

Cette page admin complète permet la gestion centralisée des utilisateurs de la plateforme Budget avec :

- **Tableau de bord KPI** : statistiques globales avec graphiques interactifs
- **Tableau utilisateurs** : recherche, filtres, tri, pagination
- **Fiches utilisateur détaillées** : transactions, objectifs, actions admin
- **Exports** : CSV/Excel des données filtrées
- **Actions administratives** : suspend/active, modifie, supprime

## 📁 Structure des fichiers

```
src/app/admin/users/
├── page.tsx                     # Page principale (Server Component)
├── components/
│   ├── AdminUsersClient.tsx     # Composant client principal
│   ├── KpiCards.tsx            # Cartes KPI + mini-charts
│   ├── FiltersBar.tsx          # Barre de recherche et filtres
│   ├── UsersTable.tsx          # Tableau avec tri/pagination
│   ├── UserDrawer.tsx          # Slide-over détails utilisateur
│   └── ExportButtons.tsx       # Boutons d'export CSV/Excel
└── actions/
    ├── exportUsers.ts          # Server Actions pour exports
    └── userMutations.ts        # Server Actions pour mutations

src/lib/
├── adminAuth.ts                # Guards et auth admin
├── analyticsAdmin.ts           # Agrégations et calculs
├── format.ts                   # Formatage et export Excel/CSV
└── adminUtils.ts               # Utilitaires promotion admin

src/app/api/admin/users/export/
├── csv/route.ts                # Endpoint export CSV
└── xlsx/route.ts               # Endpoint export Excel
```

## 🚀 Fonctionnalités

### KPIs et Analytics
- Total utilisateurs, nouveaux ce mois, actifs
- Total transactions plateforme
- Solde global plateforme (somme des soldes)
- Graphiques : répartition par sexe, pays (top 6), langues (top 5)

### Recherche et Filtrage
- **Recherche** : nom, email, pays
- **Filtres** : pays, sexe, langue, période d'inscription, statut
- **Tri** : date, solde, transactions, nom, pays
- **Pagination** : 10/25/50 par page

### Tableau Utilisateurs
Colonnes affichées :
- Nom + Email (avec avatar initiales)
- Pays (avec drapeau)
- Sexe (H/F)
- Langue préférée
- Téléphone formaté
- Nombre de transactions
- Solde actuel (avec couleur)
- Date d'inscription
- Statut (Actif/Suspendu)
- Actions (dropdown)

### Fiche Utilisateur Détaillée
- **Infos personnelles** : email, téléphone, pays, langue, inscription
- **Stats financières** : revenus totaux, dépenses totales, solde
- **5 dernières transactions** avec détails
- **Objectifs actifs** avec barres de progression
- **Actions** : modifier, suspendre/activer, supprimer

### Actions Administratives
- **Suspendre/Activer** : change le statut utilisateur
- **Modifier** : édite les informations (pays, langue, téléphone)
- **Supprimer** : suppression complète avec confirmation email
- **Réinitialiser mot de passe** : envoie un email de reset

### Exports
- **CSV** : format léger pour import/analyse
- **Excel** : formatage riche avec colonnes ajustées
- **Filtrage** : exporte uniquement les utilisateurs filtrés
- **Sécurisé** : vérification admin côté serveur

## 🔐 Sécurité

### Authentification Admin
3 méthodes supportées pour identifier un admin :

1. **Custom Claims** (recommandé)
```javascript
{ "admin": true, "role": "admin" }
```

2. **Champ Firestore**
```javascript
users/{uid}: { role: "admin" }
```

3. **Combinaison** des deux

### Firestore Rules
Les règles sont mises à jour pour permettre :
- **Admins** : accès complet lecture/écriture sur tous les utilisateurs
- **Utilisateurs** : accès limité à leurs propres données
- **Collection admin_logs** : journalisation des actions admin

### Server Actions
Toutes les actions sensibles :
- Vérification admin avec `requireAdmin()`
- Validation Zod des entrées
- Transactions Firestore pour cohérence
- Logging des actions pour audit

## 🛠️ Installation et Configuration

### 1. Dépendances
```bash
npm install xlsx recharts date-fns zod
```

### 2. Configuration Admin
Pour promouvoir un utilisateur en admin :

**Option 1 - Console Firebase :**
1. Aller sur Firebase Console → Authentication → Users
2. Cliquer sur un utilisateur
3. Custom Claims : `{ "admin": true, "role": "admin" }`

**Option 2 - Script CLI :**
```javascript
// scripts/set-admin.js
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const uid = process.argv[2];
admin.auth().setCustomUserClaims(uid, { admin: true, role: 'admin' })
  .then(() => console.log('✅ Admin défini'))
  .catch(console.error);
```

Usage : `node scripts/set-admin.js USER_UID`

### 3. Firestore Rules
Les règles sont automatiquement mises à jour pour supporter :
- Accès admin sur `/users/{userId}`
- Accès admin sur collections utilisateur
- Collection `/admin_logs` pour audit

### 4. Variables d'environnement
S'assurer que les credentials Firebase Admin sont configurés :
```env
GOOGLE_APPLICATION_CREDENTIALS=...
# ou
FIREBASE_CONFIG=...
```

## 📊 Utilisation

### Accès à la page
URL : `/admin/users`

⚠️ **Important** : L'utilisateur doit être authentifié ET avoir le rôle admin.

### Navigation typique
1. **Vue d'ensemble** : consulter les KPIs
2. **Filtrage** : rechercher/filtrer utilisateurs
3. **Détails** : cliquer sur un utilisateur pour voir sa fiche
4. **Actions** : suspendre, modifier, ou supprimer
5. **Export** : télécharger les données filtrées

### Cas d'usage fréquents
- **Modération** : suspendre des comptes problématiques
- **Support** : consulter l'historique d'un utilisateur
- **Analytics** : exporter pour analyse externe
- **Maintenance** : nettoyer des comptes inactifs

## 🎨 Design et UX

### Composants ShadCN utilisés
- `Card`, `Table`, `Sheet`, `Dialog`, `AlertDialog`
- `Button`, `Badge`, `Avatar`, `Input`, `Select`
- `Calendar`, `Popover`, `DropdownMenu`

### Responsive Design
- **Mobile** : 1 colonne, drawer plein écran
- **Tablet** : 2-3 colonnes, drawer 80%
- **Desktop** : grille complète, drawer 50%

### États de chargement
- **Skeletons** : pour tous les composants en chargement
- **Progressive** : KPIs → Filtres → Tableau
- **Optimiste** : actions avec rollback si erreur

### Micro-animations
- **Hover** : sur boutons et lignes tableau
- **Loading** : spinners pendant actions
- **Toast** : notifications succès/erreur

## 🧪 Tests et Validation

### Tests suggérés
```javascript
// Tests unitaires
- validateAdmin() pour différents scénarios auth
- formatUsersForExcel() formatage correct
- AdminUserFilters validation

// Tests d'intégration  
- Exports CSV/Excel avec données réelles
- Actions admin (suspend/delete) via API
- Pagination et tri avec gros dataset

// Tests E2E
- Workflow complet admin : login → filter → view → action
- Sécurité : non-admin ne peut pas accéder
- Responsive : mobile/desktop
```

### Validation en développement
1. Créer un utilisateur test
2. Le promouvoir admin via console
3. Se connecter et tester toutes les fonctions
4. Vérifier les exports générés
5. Tester sur mobile

## 📈 Performance

### Optimisations implémentées
- **Lazy loading** : recharts et xlsx importés dynamiquement
- **Pagination** : limite 25/50 utilisateurs par page
- **Server Components** : KPIs calculés côté serveur
- **Memoization** : filtres et tri via useState
- **Progressive loading** : KPIs → Table séparément

### Recommandations production
- **CDN** : servir assets statiques
- **Caching** : KPIs en cache Redis (5-15min)
- **Indexation** : index Firestore sur country, gender, language
- **Monitoring** : logs des actions admin sensibles

## 🔧 Extension et Personnalisation

### Ajouter une colonne au tableau
1. Modifier `AdminUserData` dans `analyticsAdmin.ts`
2. Ajouter calcul dans `getAllUsersWithStats()`
3. Ajouter colonne dans `UsersTable.tsx`
4. Mettre à jour `formatUsersForExcel()` pour exports

### Ajouter un filtre
1. Ajouter champ à `AdminUserFilters`
2. Implémenter dans `FiltersBar.tsx`
3. Appliquer dans `getAllUsersWithStats()`

### Ajouter une action admin
1. Créer Server Action dans `userMutations.ts`
2. Ajouter bouton dans `UserDrawer.tsx`
3. Implémenter handler dans `AdminUsersClient.tsx`

### Nouveaux KPIs
1. Calculer dans `getAdminKPIs()`
2. Afficher dans `KpiCards.tsx`
3. Optionnel : ajouter graphique avec Recharts

## 🎛️ Configuration avancée

### Personnalisation des exports
```typescript
// Dans format.ts
const EXPORT_CONFIG = {
  excel: {
    sheetName: 'Utilisateurs',
    columnWidths: { name: 25, email: 30 },
    formatting: { currency: 'EUR', locale: 'fr-FR' }
  },
  csv: {
    delimiter: ',',
    encoding: 'utf-8',
    bom: true // Pour Excel
  }
};
```

### Pagination personnalisée
```typescript
// Dans AdminUsersClient.tsx
const PAGE_SIZES = [10, 25, 50, 100];
const DEFAULT_PAGE_SIZE = 25;
const MAX_EXPORT_SIZE = 10000;
```

### Graphiques personnalisés
```typescript
// Dans KpiCards.tsx
const CHART_COLORS = ['#0ea5e9', '#10b981', '#f59e0b', '#ef4444'];
const CHART_CONFIG = {
  pie: { innerRadius: 40, outerRadius: 80 },
  bar: { margin: { top: 5, right: 30, left: 20, bottom: 5 } }
};
```

---

## 🆘 Dépannage

### Erreurs courantes

**"Utilisateur non admin"**
- Vérifier les Custom Claims dans Firebase Console
- S'assurer que l'utilisateur s'est reconnecté après promotion
- Vérifier les Firestore Rules

**"Impossible de charger les utilisateurs"**
- Vérifier les permissions Firestore Rules
- S'assurer que Firebase Admin SDK est configuré
- Vérifier les index Firestore si erreur composite queries

**"Export échoue"**
- Vérifier que `xlsx` est installé
- S'assurer que les données ne sont pas trop volumineuses
- Tester avec un petit dataset d'abord

**"Graphiques ne s'affichent pas"**
- Vérifier que `recharts` est installé
- Tester le lazy loading des composants
- Vérifier les données dans les KPIs

### Logs utiles
```javascript
// Debug auth admin
console.log('User claims:', await user.getIdTokenResult())

// Debug data loading  
console.log('Users loaded:', users.length)
console.log('KPIs:', kpis)

// Debug exports
console.log('Export data:', exportData.slice(0, 2))
```

Cette documentation complète vous permet d'utiliser, maintenir et étendre la page admin utilisateurs. La solution est robuste, sécurisée et prête pour la production ! 🚀