# 🚀 Setup Panel Admin React/Next.js pour Budget App

## 📋 Vue d'ensemble

Ce guide vous aidera à créer un panel d'administration React/Next.js qui partage le même backend Firebase que votre application Flutter.

## 🏗️ Architecture

```
Budget Project/
├── flutter_app/              ← Application Flutter (actuelle)
│   ├── lib/
│   ├── android/
│   ├── ios/
│   └── web/
│
├── admin_panel/              ← Panel Admin Next.js (à créer)
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   ├── lib/
│   │   └── types/
│   ├── public/
│   └── package.json
│
└── firebase/                 ← Config Firebase partagée
    ├── firestore.rules
    ├── firestore.indexes.json
    └── firebase.json
```

## 🛠️ Étape 1 : Créer le projet Next.js

```bash
# Depuis le dossier racine de votre projet
npx create-next-app@latest admin_panel

# Répondre aux questions :
# ✔ Would you like to use TypeScript? … Yes
# ✔ Would you like to use ESLint? … Yes
# ✔ Would you like to use Tailwind CSS? … Yes
# ✔ Would you like to use `src/` directory? … Yes
# ✔ Would you like to use App Router? … Yes
# ✔ Would you like to customize the default import alias? … No

cd admin_panel
```

## 📦 Étape 2 : Installer les dépendances

```bash
# Firebase
npm install firebase firebase-admin react-firebase-hooks

# UI Components (shadcn/ui)
npx shadcn-ui@latest init

# Charts et Data
npm install recharts date-fns

# Export Excel/CSV
npm install xlsx

# Form Validation
npm install zod react-hook-form @hookform/resolvers

# Icons
npm install lucide-react

# Utils
npm install clsx tailwind-merge
```

## 🔥 Étape 3 : Configuration Firebase

### 3.1 Créer le fichier de configuration

Créer `admin_panel/.env.local` :

```env
# Firebase Client (Web)
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Admin Emails (liste séparée par virgules)
NEXT_PUBLIC_ADMIN_EMAILS=admin@budget.com,admin2@budget.com

# Firebase Admin SDK (Server-side)
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=your_service_account_email
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

### 3.2 Obtenir les credentials Firebase

**Pour le Client (NEXT_PUBLIC_*) :**
1. Firebase Console → Project Settings → General
2. Scroll vers "Your apps" → Web app
3. Copier les valeurs de `firebaseConfig`

**Pour l'Admin SDK (FIREBASE_*) :**
1. Firebase Console → Project Settings → Service Accounts
2. Cliquer "Generate new private key"
3. Télécharger le fichier JSON
4. Extraire `project_id`, `client_email`, `private_key`

### 3.3 Copier les Firestore Rules

```bash
# Copier depuis votre projet Flutter
cp ../firestore.rules ./
cp ../firestore.indexes.json ./
```

## 📂 Étape 4 : Structure du code

### 4.1 Configuration Firebase Client

Créer `admin_panel/src/lib/firebase.ts` :

```typescript
import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase (évite la réinitialisation)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;
```

### 4.2 Configuration Firebase Admin

Créer `admin_panel/src/lib/firebaseAdmin.ts` :

```typescript
import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

export const adminAuth = admin.auth();
export const adminDb = admin.firestore();
export default admin;
```

### 4.3 Auth Guard

Créer `admin_panel/src/lib/adminAuth.ts` :

```typescript
import { auth } from './firebase';
import { User } from 'firebase/auth';

const ADMIN_EMAILS = process.env.NEXT_PUBLIC_ADMIN_EMAILS?.split(',').map(e => e.trim()) || [];

export async function isUserAdmin(user: User | null): Promise<boolean> {
  if (!user || !user.email) return false;
  
  // Vérifier l'email
  if (!ADMIN_EMAILS.includes(user.email.toLowerCase())) {
    return false;
  }
  
  // Vérifier les custom claims
  const tokenResult = await user.getIdTokenResult();
  return tokenResult.claims.admin === true || tokenResult.claims.role === 'admin';
}

export async function requireAdmin() {
  const currentUser = auth.currentUser;
  
  if (!currentUser) {
    throw new Error('Non authentifié');
  }
  
  const isAdmin = await isUserAdmin(currentUser);
  
  if (!isAdmin) {
    throw new Error('Accès refusé : droits administrateur requis');
  }
  
  return currentUser;
}
```

## 🎨 Étape 5 : Pages principales

### 5.1 Page de login admin

Créer `admin_panel/src/app/admin/login/page.tsx` :

```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { isUserAdmin } from '@/lib/adminAuth';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // Vérifier si l'utilisateur est admin
      const isAdmin = await isUserAdmin(userCredential.user);
      
      if (!isAdmin) {
        setError("Vous n'avez pas les droits administrateur");
        await auth.signOut();
        setLoading(false);
        return;
      }

      // Stocker le token
      const idToken = await userCredential.user.getIdToken();
      document.cookie = `firebaseIdToken=${idToken}; path=/; max-age=3600; SameSite=Strict`;
      
      // Rediriger vers le dashboard
      router.push('/admin/dashboard');
      
    } catch (error: any) {
      console.error('Erreur de connexion:', error);
      
      if (error.code === 'auth/invalid-credential') {
        setError('Email ou mot de passe incorrect');
      } else if (error.code === 'auth/too-many-requests') {
        setError('Trop de tentatives. Réessayez plus tard.');
      } else {
        setError('Erreur de connexion. Veuillez réessayer.');
      }
      
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-2xl font-bold text-center mb-6">
          Budget - Admin Panel
        </h1>
        
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Mot de passe
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>
          
          {error && (
            <div className="text-red-600 text-sm bg-red-50 p-3 rounded">
              {error}
            </div>
          )}
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>
      </div>
    </div>
  );
}
```

### 5.2 Dashboard admin

Créer `admin_panel/src/app/admin/dashboard/page.tsx` :

```typescript
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/lib/firebase';
import { isUserAdmin } from '@/lib/adminAuth';
import { collection, query, getDocs, where } from 'firebase/firestore';

export default function AdminDashboardPage() {
  const [user, loading] = useAuthState(auth);
  const [isAdmin, setIsAdmin] = useState(false);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalTransactions: 0,
    platformBalance: 0,
  });
  const router = useRouter();

  useEffect(() => {
    async function checkAdmin() {
      if (!loading && !user) {
        router.push('/admin/login');
        return;
      }

      if (user) {
        const adminStatus = await isUserAdmin(user);
        if (!adminStatus) {
          router.push('/admin/login');
        } else {
          setIsAdmin(true);
          loadStats();
        }
      }
    }

    checkAdmin();
  }, [user, loading, router]);

  async function loadStats() {
    try {
      // Total users
      const usersSnap = await getDocs(collection(db, 'users'));
      const totalUsers = usersSnap.size;
      
      // Active users (derniers 30 jours)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const activeUsersQuery = query(
        collection(db, 'users'),
        where('lastActive', '>=', thirtyDaysAgo)
      );
      const activeUsersSnap = await getDocs(activeUsersQuery);
      const activeUsers = activeUsersSnap.size;
      
      // Total transactions (approximatif)
      const transactionsSnap = await getDocs(collection(db, 'transactions'));
      const totalTransactions = transactionsSnap.size;
      
      // Platform balance (somme des soldes)
      let platformBalance = 0;
      usersSnap.forEach((doc) => {
        const data = doc.data();
        platformBalance += data.balance || 0;
      });
      
      setStats({
        totalUsers,
        activeUsers,
        totalTransactions,
        platformBalance,
      });
    } catch (error) {
      console.error('Erreur chargement stats:', error);
    }
  }

  if (loading || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">
              Budget - Admin Dashboard
            </h1>
            <button
              onClick={() => auth.signOut()}
              className="text-red-600 hover:text-red-800"
            >
              Déconnexion
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Utilisateurs Total"
            value={stats.totalUsers}
            icon="👥"
          />
          <StatCard
            title="Utilisateurs Actifs"
            value={stats.activeUsers}
            icon="✅"
          />
          <StatCard
            title="Transactions"
            value={stats.totalTransactions}
            icon="💳"
          />
          <StatCard
            title="Solde Plateforme"
            value={`${stats.platformBalance.toFixed(2)} €`}
            icon="💰"
          />
        </div>

        {/* Navigation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <NavCard
            title="Gestion Utilisateurs"
            description="Voir, modifier, suspendre les utilisateurs"
            icon="👤"
            href="/admin/users"
          />
          <NavCard
            title="Transactions"
            description="Consulter l'historique des transactions"
            icon="💸"
            href="/admin/transactions"
          />
          <NavCard
            title="Analytics"
            description="Rapports et statistiques détaillées"
            icon="📊"
            href="/admin/analytics"
          />
        </div>
      </main>
    </div>
  );
}

function StatCard({ title, value, icon }: { title: string; value: string | number; icon: string }) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
        </div>
        <div className="text-4xl">{icon}</div>
      </div>
    </div>
  );
}

function NavCard({ title, description, icon, href }: { title: string; description: string; icon: string; href: string }) {
  const router = useRouter();
  
  return (
    <button
      onClick={() => router.push(href)}
      className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow text-left"
    >
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-gray-600">{description}</p>
    </button>
  );
}
```

## 🚀 Étape 6 : Lancer le panel admin

```bash
cd admin_panel
npm run dev
```

Ouvrir : http://localhost:3000/admin/login

## 🔐 Étape 7 : Créer un compte admin

### Option 1 : Via script Node.js

Créer `admin_panel/scripts/create-admin.js` :

```javascript
const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const email = process.argv[2];
const password = process.argv[3];
const displayName = process.argv[4] || 'Admin';

if (!email || !password) {
  console.error('Usage: node create-admin.js <email> <password> [displayName]');
  process.exit(1);
}

async function createAdmin() {
  try {
    // Créer l'utilisateur
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName,
    });
    
    console.log('✅ Utilisateur créé:', userRecord.uid);
    
    // Définir les custom claims
    await admin.auth().setCustomUserClaims(userRecord.uid, {
      admin: true,
      role: 'admin',
    });
    
    console.log('✅ Custom claims définis');
    
    // Créer le document Firestore
    await admin.firestore().collection('users').doc(userRecord.uid).set({
      email,
      displayName,
      role: 'admin',
      isAdmin: true,
      status: 'active',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    
    console.log('✅ Document Firestore créé');
    console.log(`\n🎉 Admin créé avec succès!`);
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    console.log(`\nVous pouvez maintenant vous connecter sur http://localhost:3000/admin/login`);
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    process.exit();
  }
}

createAdmin();
```

Utilisation :
```bash
node scripts/create-admin.js admin@budget.com MySecurePass123 "Super Admin"
```

## 📚 Ressources et Next Steps

### Documentation complète créée :
- `ADMIN_USERS_README.md` - Gestion des utilisateurs
- `ADMIN_LOGIN_FIXED.md` - Guide du login admin
- `docs/admin-debugging.md` - Troubleshooting

### Fonctionnalités à ajouter :

1. **Page Utilisateurs** (`/admin/users`)
   - Liste avec recherche et filtres
   - Édition inline
   - Actions bulk (suspend, delete)
   - Export CSV/Excel

2. **Page Transactions** (`/admin/transactions`)
   - Historique complet
   - Filtres avancés
   - Graphiques

3. **Page Analytics** (`/admin/analytics`)
   - KPIs détaillés
   - Graphiques interactifs
   - Rapports téléchargeables

4. **Logs d'audit**
   - Tracer toutes les actions admin
   - Collection `admin_logs` dans Firestore

### Firestore Rules à mettre à jour :

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper function pour vérifier si admin
    function isAdmin() {
      return request.auth != null && 
             (request.auth.token.admin == true || 
              request.auth.token.role == 'admin');
    }
    
    // Users collection - admins ont accès complet
    match /users/{userId} {
      allow read: if isAdmin() || request.auth.uid == userId;
      allow write: if isAdmin() || request.auth.uid == userId;
    }
    
    // Transactions - admins peuvent tout lire
    match /transactions/{transactionId} {
      allow read: if isAdmin() || resource.data.userId == request.auth.uid;
      allow write: if resource.data.userId == request.auth.uid;
    }
    
    // Admin logs - seulement admin peut écrire
    match /admin_logs/{logId} {
      allow read: if isAdmin();
      allow write: if isAdmin();
    }
  }
}
```

## 🎯 Résumé

Vous avez maintenant :

✅ **Flutter App** - Application mobile/web utilisateurs  
✅ **Next.js Admin Panel** - Interface d'administration web  
✅ **Firebase Backend** - Partagé entre les deux  
✅ **Authentication** - Système admin sécurisé  
✅ **Dashboard** - Vue d'ensemble des stats  

Les deux applications fonctionnent ensemble via Firebase et peuvent être déployées indépendamment !

---

**Besoin d'aide ?** Consultez la documentation complète dans `/docs/` ou créez une issue sur GitHub.
