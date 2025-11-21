'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { testFirebaseConnection, testFirebaseAuth, testFirestore } from '@/firebase/test-connection';
import { useUser } from '@/firebase';

interface TestResult {
  success: boolean;
  message: string;
  details?: any;
}

export function FirebaseTestComponent() {
  const [connectionResult, setConnectionResult] = useState<TestResult | null>(null);
  const [authResult, setAuthResult] = useState<TestResult | null>(null);
  const [firestoreResult, setFirestoreResult] = useState<TestResult | null>(null);
  const { user, isUserLoading, userError } = useUser();

  const runConnectionTest = () => {
    console.log('🧪 Test de connexion Firebase...');
    const result = testFirebaseConnection();
    
    if (result.success) {
      setConnectionResult({
        success: true,
        message: 'Firebase connecté avec succès !',
        details: {
          projectId: result.firebaseApp?.options.projectId,
          appId: result.firebaseApp?.options.appId
        }
      });
    } else {
      setConnectionResult({
        success: false,
        message: 'Erreur de connexion Firebase',
        details: result.error
      });
    }
  };

  const runAuthTest = async () => {
    console.log('🧪 Test d\'authentification...');
    const result = await testFirebaseAuth();
    
    setAuthResult({
      success: result.success,
      message: result.success 
        ? `Auth OK - Utilisateur: ${result.user?.email || 'Non connecté'}` 
        : 'Erreur d\'authentification',
      details: result.success ? result.user : result.error
    });
  };

  const runFirestoreTest = async () => {
    console.log('🧪 Test de Firestore...');
    const result = await testFirestore();
    
    setFirestoreResult({
      success: result.success,
      message: result.success ? 'Firestore prêt !' : 'Erreur Firestore',
      details: result.success ? 'Connexion établie' : result.error
    });
  };

  const runAllTests = () => {
    runConnectionTest();
    runAuthTest();
    runFirestoreTest();
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🔥 Test de connexion Firebase
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* État du hook useUser */}
        <div className="p-3 bg-blue-50 rounded-lg">
          <h3 className="font-semibold mb-2">État de l'utilisateur (useUser hook):</h3>
          <p>Chargement: {isUserLoading ? '⏳ Oui' : '✅ Non'}</p>
          <p>Utilisateur: {user ? `👤 ${user.email}` : '❌ Non connecté'}</p>
          {userError && <p className="text-red-600">Erreur: {userError.message}</p>}
        </div>

        {/* Boutons de test */}
        <div className="flex flex-wrap gap-2">
          <Button onClick={runAllTests} variant="default">
            🧪 Tous les tests
          </Button>
          <Button onClick={runConnectionTest} variant="outline">
            🔗 Connexion
          </Button>
          <Button onClick={runAuthTest} variant="outline">
            🔐 Auth
          </Button>
          <Button onClick={runFirestoreTest} variant="outline">
            📊 Firestore
          </Button>
        </div>

        {/* Résultats */}
        {connectionResult && (
          <TestResultDisplay title="Connexion" result={connectionResult} />
        )}
        {authResult && (
          <TestResultDisplay title="Authentification" result={authResult} />
        )}
        {firestoreResult && (
          <TestResultDisplay title="Firestore" result={firestoreResult} />
        )}
      </CardContent>
    </Card>
  );
}

function TestResultDisplay({ title, result }: { title: string; result: TestResult }) {
  return (
    <div className={`p-3 rounded-lg ${result.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'} border`}>
      <h3 className="font-semibold mb-2">
        {result.success ? '✅' : '❌'} {title}
      </h3>
      <p className="text-sm">{result.message}</p>
      {result.details && (
        <pre className="text-xs mt-2 p-2 bg-gray-100 rounded overflow-auto">
          {typeof result.details === 'string' 
            ? result.details 
            : JSON.stringify(result.details, null, 2)
          }
        </pre>
      )}
    </div>
  );
}