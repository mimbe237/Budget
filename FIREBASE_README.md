# Configuration Firebase - Guide de démarrage

## 🔥 Firebase est maintenant connecté !

Cette application est maintenant configurée pour utiliser Firebase avec :
- ✅ Authentication (Authentification)
- ✅ Firestore Database (Base de données)
- ✅ Firebase App Hosting

## 📁 Structure Firebase

```
src/firebase/
├── config.ts              # Configuration Firebase (variables d'environnement)
├── index.ts               # Initialisation Firebase client
├── admin.ts               # Firebase Admin SDK (côté serveur)
├── provider.tsx           # Provider React pour Firebase
├── client-provider.tsx    # Wrapper client pour le provider
├── test-connection.ts     # Utilitaires de test de connexion
└── firestore/
    ├── use-collection.tsx # Hook pour les collections Firestore
    └── use-doc.tsx        # Hook pour les documents Firestore
```

## 🔧 Configuration

### Variables d'environnement (.env.local)

Les variables d'environnement suivantes sont configurées :

```env
# Firebase Configuration (Client)
NEXT_PUBLIC_FIREBASE_API_KEY="votre_api_key"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="votre_project.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="votre_project_id"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=""
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="votre_sender_id"
NEXT_PUBLIC_FIREBASE_APP_ID="votre_app_id"
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=""

# Firebase Admin (Server)
GOOGLE_APPLICATION_CREDENTIALS='{"type":"service_account",...}'
```

### Règles de sécurité Firestore

Les règles Firestore sont configurées pour :
- ✅ Accès utilisateur uniquement à ses propres données
- ✅ Collections : users, expenses, categories, budgetGoals
- ✅ Sécurité basée sur l'authentification

## 🚀 Utilisation dans votre code

### 1. Hooks Firebase disponibles

```tsx
import { useUser, useFirebase, useAuth, useFirestore } from '@/firebase';

function MonComposant() {
  const { user, isUserLoading, userError } = useUser();
  const { firebaseApp, auth, firestore } = useFirebase();
  
  // Votre logique ici
}
```

### 2. Authentification

```tsx
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { useAuth } from '@/firebase';

function LoginComponent() {
  const auth = useAuth();
  
  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };
}
```

### 3. Firestore

```tsx
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useFirestore, useUser } from '@/firebase';

function DataComponent() {
  const firestore = useFirestore();
  const { user } = useUser();
  
  const saveData = async (data: any) => {
    if (user) {
      await setDoc(doc(firestore, `users/${user.uid}/expenses/expense1`), data);
    }
  };
}
```

## 🧪 Test de la connexion

Pour tester que Firebase fonctionne correctement :

1. Ouvrez la console du navigateur (F12)
2. Vous devriez voir les messages de connexion Firebase
3. Aucune erreur Firebase ne devrait apparaître

### Tests disponibles

Des fonctions de test sont disponibles dans `src/firebase/test-connection.ts` :

```tsx
import { testFirebaseConnection, testFirebaseAuth, testFirestore } from '@/firebase/test-connection';

// Test de connexion générale
const result = testFirebaseConnection();

// Test d'authentification
const authResult = await testFirebaseAuth();

// Test Firestore
const firestoreResult = await testFirestore();
```

## 📊 Structure des données Firestore

```
/users/{userId}
├── profile data (nom, email, etc.)
├── /expenses/{expenseId}
├── /categories/{categoryId}
└── /budgetGoals/{budgetGoalId}
```

## 🔒 Sécurité

- ✅ Variables d'environnement protégées (.env.local dans .gitignore)
- ✅ Règles Firestore restrictives (accès utilisateur uniquement)
- ✅ Authentification obligatoire pour accéder aux données
- ✅ Firebase Admin SDK pour les opérations serveur sécurisées

## 🚨 Prochaines étapes

1. **Configurer l'authentification** : Ajoutez les pages de login/signup
2. **Implémenter les CRUD** : Utilisez les hooks Firestore pour créer/lire/modifier/supprimer des données
3. **Ajouter le Storage** : Si vous avez besoin de stocker des fichiers
4. **Configurer les notifications** : Firebase Cloud Messaging si nécessaire

## 📞 Support

Si vous rencontrez des problèmes :
1. Vérifiez la console du navigateur pour les erreurs
2. Assurez-vous que les variables d'environnement sont correctes
3. Vérifiez que Firebase project est actif sur console.firebase.google.com

---

**🎉 Firebase est maintenant prêt à être utilisé dans votre application !**