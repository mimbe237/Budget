#!/bin/bash
# Script de déploiement pour le système d'authentification
# Usage: ./scripts/deploy-auth.sh [option]

set -e  # Exit on error

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Déploiement du Système d'Authentification${NC}\n"

# Fonction pour afficher les étapes
step() {
    echo -e "${YELLOW}▶ $1${NC}"
}

success() {
    echo -e "${GREEN}✅ $1${NC}\n"
}

error() {
    echo -e "${RED}❌ $1${NC}\n"
    exit 1
}

# Vérifier qu'on est dans le bon répertoire
if [ ! -f "package.json" ]; then
    error "Erreur: Exécuter depuis la racine du projet Budget"
fi

# Parse arguments
DEPLOY_ALL=false
DEPLOY_FUNCTIONS=false
DEPLOY_RULES=false
DEPLOY_HOSTING=false

if [ "$1" == "--all" ] || [ -z "$1" ]; then
    DEPLOY_ALL=true
elif [ "$1" == "--functions" ]; then
    DEPLOY_FUNCTIONS=true
elif [ "$1" == "--rules" ]; then
    DEPLOY_RULES=true
elif [ "$1" == "--hosting" ]; then
    DEPLOY_HOSTING=true
else
    echo "Usage: ./scripts/deploy-auth.sh [--all|--functions|--rules|--hosting]"
    exit 1
fi

# 1. Compiler les Cloud Functions
if [ "$DEPLOY_ALL" = true ] || [ "$DEPLOY_FUNCTIONS" = true ]; then
    step "Compilation des Cloud Functions..."
    cd functions
    npm run build || error "Échec de la compilation des functions"
    cd ..
    success "Functions compilées"
fi

# 2. Déployer Firestore Rules
if [ "$DEPLOY_ALL" = true ] || [ "$DEPLOY_RULES" = true ]; then
    step "Déploiement des règles Firestore..."
    firebase deploy --only firestore:rules || error "Échec du déploiement des règles"
    success "Règles Firestore déployées"
fi

# 3. Déployer Cloud Functions
if [ "$DEPLOY_ALL" = true ] || [ "$DEPLOY_FUNCTIONS" = true ]; then
    step "Déploiement des Cloud Functions d'authentification..."
    firebase deploy --only functions:onUserCreate,functions:approveUser,functions:rejectUser,functions:getPendingUsers \
        || error "Échec du déploiement des functions"
    success "Cloud Functions déployées"
fi

# 4. Build et déployer Hosting (si demandé)
if [ "$DEPLOY_ALL" = true ] || [ "$DEPLOY_HOSTING" = true ]; then
    step "Build de l'application Next.js..."
    npm run build || error "Échec du build"
    success "Build terminé"
    
    step "Déploiement sur Firebase Hosting..."
    firebase deploy --only hosting || error "Échec du déploiement hosting"
    success "Application déployée"
fi

# 5. Afficher le statut
echo -e "\n${GREEN}════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ Déploiement Terminé avec Succès !${NC}"
echo -e "${GREEN}════════════════════════════════════════${NC}\n"

echo "📋 Prochaines étapes manuelles :"
echo ""
echo "1. Activer Google Sign-In :"
echo "   → Firebase Console > Authentication > Sign-in method > Google"
echo "   → Email support: businessclubleader7@gmail.com"
echo ""
echo "2. Configurer Facebook Login :"
echo "   → Créer app sur developers.facebook.com"
echo "   → Firebase Console > Authentication > Facebook"
echo "   → Ajouter App ID et App Secret"
echo ""
echo "3. Tester le système :"
echo "   → Créer un compte test"
echo "   → Vérifier status=pending dans Firestore"
echo "   → Approuver depuis /admin/users/pending"
echo "   → Se connecter avec le compte approuvé"
echo ""
echo "📊 Console Firebase : https://console.firebase.google.com/project/studio-3821270625-cd276"
echo ""
