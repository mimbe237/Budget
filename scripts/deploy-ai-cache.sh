#!/bin/bash

# 🚀 Script de déploiement optimisation cache IA
# Usage: ./scripts/deploy-ai-cache.sh

set -e # Arrêter si erreur

echo "══════════════════════════════════════════════════"
echo "🚀 Déploiement optimisation cache IA"
echo "══════════════════════════════════════════════════"
echo ""

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Fonction pour logger
log_info() {
    echo -e "${GREEN}✓${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

log_error() {
    echo -e "${RED}✗${NC} $1"
}

# 1. Vérifications préalables
echo "📋 Étape 1/6: Vérifications préalables"
echo "──────────────────────────────────────────────────"

# Vérifier que Firebase CLI est installé
if ! command -v firebase &> /dev/null; then
    log_error "Firebase CLI n'est pas installé"
    echo "Installation: npm install -g firebase-tools"
    exit 1
fi
log_info "Firebase CLI installé"

# Vérifier que l'utilisateur est connecté
if ! firebase projects:list &> /dev/null; then
    log_error "Pas connecté à Firebase"
    echo "Connexion: firebase login"
    exit 1
fi
log_info "Connecté à Firebase"

# Vérifier les variables d'environnement
if [ ! -f .env.local ]; then
    log_warning ".env.local n'existe pas"
else
    log_info ".env.local trouvé"
fi

echo ""

# 2. Tests locaux
echo "🧪 Étape 2/6: Tests locaux"
echo "──────────────────────────────────────────────────"

# Tester le script de cache
log_info "Exécution des tests de cache..."
node scripts/test-ai-cache.js > /dev/null 2>&1
if [ $? -eq 0 ]; then
    log_info "Tests de cache: OK"
else
    log_error "Tests de cache: ÉCHEC"
    exit 1
fi

# Build de l'application
log_info "Build de l'application..."
npm run build > /dev/null 2>&1
if [ $? -eq 0 ]; then
    log_info "Build: OK"
else
    log_error "Build: ÉCHEC"
    exit 1
fi

echo ""

# 3. Confirmation
echo "⚠️  Étape 3/6: Confirmation"
echo "──────────────────────────────────────────────────"
echo "Vous êtes sur le point de déployer:"
echo "  - Règles Firestore (collection aiInsights)"
echo "  - Application Next.js (avec cache IA)"
echo ""
read -p "Continuer? (y/N) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    log_warning "Déploiement annulé"
    exit 0
fi

echo ""

# 4. Déploiement des règles Firestore
echo "🔐 Étape 4/6: Déploiement règles Firestore"
echo "──────────────────────────────────────────────────"
firebase deploy --only firestore:rules
if [ $? -eq 0 ]; then
    log_info "Règles Firestore déployées"
else
    log_error "Échec du déploiement des règles"
    exit 1
fi

echo ""

# 5. Déploiement de l'application
echo "🌐 Étape 5/6: Déploiement application"
echo "──────────────────────────────────────────────────"
firebase deploy --only hosting
if [ $? -eq 0 ]; then
    log_info "Application déployée"
else
    log_error "Échec du déploiement de l'application"
    exit 1
fi

echo ""

# 6. Vérifications post-déploiement
echo "✅ Étape 6/6: Vérifications"
echo "──────────────────────────────────────────────────"
log_info "Déploiement terminé avec succès!"
echo ""
echo "Prochaines étapes:"
echo "  1. Ouvrir l'application en production"
echo "  2. Se connecter et charger /dashboard"
echo "  3. Vérifier les logs Firebase Console"
echo "  4. Vérifier la création du cache dans Firestore"
echo "  5. Monitorer les coûts API Gemini"
echo ""
echo "Documentation:"
echo "  - docs/AI_CACHE_DEPLOYMENT.md"
echo "  - docs/AI_CACHE_IMPLEMENTATION.md"
echo ""

echo "══════════════════════════════════════════════════"
echo "✅ Déploiement terminé!"
echo "══════════════════════════════════════════════════"
