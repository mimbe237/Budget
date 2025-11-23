const admin = require('firebase-admin');

// Configuration Firebase Admin avec les credentials du projet
const serviceAccount = {
  "type": "service_account",
  "project_id": "budget-pro-8e46f",
  "private_key_id": "PLACEHOLDER",
  "private_key": "PLACEHOLDER",
  "client_email": "firebase-adminsdk@budget-pro-8e46f.iam.gserviceaccount.com",
  "client_id": "PLACEHOLDER",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
};

// Pour ce script simple, on utilise l'approche client-side
const { initializeApp } = require('firebase/app');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');
const { getFirestore, doc, setDoc } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: 'AIzaSyB1TtBmWvMUSlMLweCjQOrsxUermQM7TcU',
  authDomain: 'budget-pro-8e46f.firebaseapp.com',
  projectId: 'budget-pro-8e46f',
  storageBucket: 'budget-pro-8e46f.firebasestorage.app',
  messagingSenderId: '830482913404',
  appId: '1:830482913404:web:354d9ea847bd83526d51f9',
};

async function setupAdmin() {
  console.log('🔧 Configuration du compte admin...\n');

  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);

  const email = 'mimb.nout@gmail.com';
  const userId = 'PhsT3BguhkaqX7bR5Yr4wynY2Q93';

  try {
    // Créer le document dans Firestore
    console.log('📝 Création du document Firestore...');
    await setDoc(doc(db, 'users', userId), {
      email: email,
      displayName: 'Admin User',
      role: 'admin',
      isAdmin: true,
      status: 'active',
      createdAt: new Date().toISOString(),
      lastActive: new Date().toISOString(),
    });
    console.log('✅ Document Firestore créé avec succès!\n');

    console.log('⚠️  IMPORTANT:');
    console.log('Pour ajouter les Custom Claims admin, tu dois:');
    console.log('1. Aller sur Firebase Console');
    console.log('2. Extensions → Install Firebase Admin SDK Helper');
    console.log('3. Ou utiliser Cloud Functions\n');
    
    console.log('📧 Email: mimb.nout@gmail.com');
    console.log('🔑 Password: Bonjour67446--');
    console.log('\n✨ Tu peux maintenant te connecter sur http://localhost:3000/admin/login');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

setupAdmin();
