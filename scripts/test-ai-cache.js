#!/usr/bin/env node

/**
 * Script de test du système de cache AI
 * 
 * Ce script permet de tester les fonctions de cache sans avoir à charger
 * toute l'application.
 * 
 * Usage:
 *   node scripts/test-ai-cache.js [userId]
 */

const crypto = require('crypto');

// Simuler les fonctions de cache
function generateDataHash(data) {
  const content = JSON.stringify({
    txIds: data.transactionIds.sort(),
    budgetIds: data.budgetIds.sort(),
    txCount: data.transactionCount,
    budgetCount: data.budgetCount,
  });
  
  return crypto.createHash('sha256').update(content).digest('hex');
}

function testHashConsistency() {
  console.log('🧪 Test 1: Consistance du hash');
  console.log('─'.repeat(50));
  
  const data1 = {
    transactionIds: ['tx1', 'tx2', 'tx3'],
    budgetIds: ['b1', 'b2'],
    transactionCount: 3,
    budgetCount: 2,
  };
  
  const data2 = {
    transactionIds: ['tx3', 'tx1', 'tx2'], // Ordre différent
    budgetIds: ['b2', 'b1'], // Ordre différent
    transactionCount: 3,
    budgetCount: 2,
  };
  
  const hash1 = generateDataHash(data1);
  const hash2 = generateDataHash(data2);
  
  console.log(`Hash 1: ${hash1}`);
  console.log(`Hash 2: ${hash2}`);
  console.log(`✅ Même hash malgré ordre différent: ${hash1 === hash2 ? 'OUI' : 'NON'}`);
  console.log();
}

function testHashChangeDetection() {
  console.log('🧪 Test 2: Détection de changement');
  console.log('─'.repeat(50));
  
  const originalData = {
    transactionIds: ['tx1', 'tx2', 'tx3'],
    budgetIds: ['b1', 'b2'],
    transactionCount: 3,
    budgetCount: 2,
  };
  
  const modifiedData = {
    transactionIds: ['tx1', 'tx2', 'tx3', 'tx4'], // Transaction ajoutée
    budgetIds: ['b1', 'b2'],
    transactionCount: 4,
    budgetCount: 2,
  };
  
  const hashOriginal = generateDataHash(originalData);
  const hashModified = generateDataHash(modifiedData);
  
  console.log(`Hash original: ${hashOriginal}`);
  console.log(`Hash modifié:  ${hashModified}`);
  console.log(`✅ Hash différent après ajout: ${hashOriginal !== hashModified ? 'OUI' : 'NON'}`);
  console.log();
}

function testCacheExpiration() {
  console.log('🧪 Test 3: Expiration du cache');
  console.log('─'.repeat(50));
  
  const now = Date.now();
  const generatedAt = now - (23 * 60 * 60 * 1000); // Il y a 23h
  const expiresAt = generatedAt + (24 * 60 * 60 * 1000); // +24h
  
  const isExpired = expiresAt <= now;
  const remainingMs = expiresAt - now;
  const remainingHours = Math.round(remainingMs / (60 * 60 * 1000));
  
  console.log(`Généré à: ${new Date(generatedAt).toISOString()}`);
  console.log(`Expire à: ${new Date(expiresAt).toISOString()}`);
  console.log(`Maintenant: ${new Date(now).toISOString()}`);
  console.log(`Expiré: ${isExpired ? 'OUI' : 'NON'}`);
  console.log(`Temps restant: ${remainingHours}h`);
  console.log();
}

function testCacheSize() {
  console.log('🧪 Test 4: Taille du cache');
  console.log('─'.repeat(50));
  
  // Simuler un cache typique
  const cache = {
    id: 'latest',
    userId: 'user123',
    insights: 'Votre taux d\'épargne de 15% est bon mais pourrait être amélioré. Les dépenses en "Alimentation" ont augmenté de 23% ce mois.',
    recommendations: '1. Réduire les dépenses alimentaires de 200 € en privilégiant les repas maison\n2. Augmenter l\'épargne mensuelle de 100 €',
    generatedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    dataHash: '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    transactionCount: 50,
    budgetCount: 8,
    modelVersion: 'gemini-2.5-flash-v1',
  };
  
  const sizeInBytes = JSON.stringify(cache).length;
  const sizeInKB = (sizeInBytes / 1024).toFixed(2);
  
  console.log(`Taille du cache: ${sizeInBytes} bytes (${sizeInKB} KB)`);
  console.log(`✅ Taille raisonnable: ${sizeInBytes < 10000 ? 'OUI' : 'NON (>10KB)'}`);
  console.log();
}

function testCostCalculation() {
  console.log('💰 Test 5: Calcul des économies');
  console.log('─'.repeat(50));
  
  const COST_PER_REQUEST = 0.003; // $0.003 par requête
  const USERS = [100, 500, 1000, 5000];
  const REQUESTS_PER_DAY_WITHOUT_CACHE = 3; // 3 pages avec AI
  const REQUESTS_PER_DAY_WITH_CACHE = 0.5; // 1 requête tous les 2 jours
  
  console.log('Coût par requête: $0.003');
  console.log();
  
  USERS.forEach(userCount => {
    const monthlyRequestsWithoutCache = userCount * REQUESTS_PER_DAY_WITHOUT_CACHE * 30;
    const monthlyRequestsWithCache = userCount * REQUESTS_PER_DAY_WITH_CACHE * 30;
    
    const costWithoutCache = monthlyRequestsWithoutCache * COST_PER_REQUEST;
    const costWithCache = monthlyRequestsWithCache * COST_PER_REQUEST;
    const savings = costWithoutCache - costWithCache;
    const savingsPercent = ((savings / costWithoutCache) * 100).toFixed(0);
    
    console.log(`${userCount} utilisateurs actifs:`);
    console.log(`  Sans cache: ${monthlyRequestsWithoutCache} req/mois = $${costWithoutCache.toFixed(2)}/mois`);
    console.log(`  Avec cache: ${monthlyRequestsWithCache} req/mois = $${costWithCache.toFixed(2)}/mois`);
    console.log(`  💰 Économie: $${savings.toFixed(2)}/mois (${savingsPercent}%)`);
    console.log();
  });
}

// Exécuter tous les tests
console.log('═'.repeat(50));
console.log('🚀 Tests du système de cache AI');
console.log('═'.repeat(50));
console.log();

testHashConsistency();
testHashChangeDetection();
testCacheExpiration();
testCacheSize();
testCostCalculation();

console.log('═'.repeat(50));
console.log('✅ Tous les tests terminés');
console.log('═'.repeat(50));
