#!/bin/bash

# 🔍 Script de diagnostic pour la connexion admin
# Usage: ./scripts/test-admin-config.sh

set -e

echo "═══════════════════════════════════════════════════"
echo "🔍 Diagnostic de configuration admin"
echo "═══════════════════════════════════════════════════"
echo ""

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

success() {
    echo -e "${GREEN}✓${NC} $1"
}

warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

error() {
    echo -e "${RED}✗${NC} $1"
}

# 1. Vérifier .env.local
echo "📋 Étape 1: Vérification .env.local"
echo "──────────────────────────────────────────────────"

if [ ! -f .env.local ]; then
    error ".env.local n'existe pas"
    echo "Créer le fichier .env.local à partir de .env.example"
    exit 1
fi
success ".env.local trouvé"

# Vérifier ADMIN_EMAILS
if grep -q "ADMIN_EMAILS=" .env.local; then
    ADMIN_EMAILS=$(grep "ADMIN_EMAILS=" .env.local | head -1 | cut -d'=' -f2 | tr -d '"' | tr -d "'")
    if [ -z "$ADMIN_EMAILS" ]; then
        error "ADMIN_EMAILS est vide"
    else
        success "ADMIN_EMAILS configuré: $ADMIN_EMAILS"
    fi
else
    error "ADMIN_EMAILS manquant dans .env.local"
fi

# Vérifier NEXT_PUBLIC_ADMIN_EMAILS
if grep -q "NEXT_PUBLIC_ADMIN_EMAILS=" .env.local; then
    PUBLIC_ADMIN_EMAILS=$(grep "NEXT_PUBLIC_ADMIN_EMAILS=" .env.local | head -1 | cut -d'=' -f2 | tr -d '"' | tr -d "'")
    if [ -z "$PUBLIC_ADMIN_EMAILS" ]; then
        error "NEXT_PUBLIC_ADMIN_EMAILS est vide"
    else
        success "NEXT_PUBLIC_ADMIN_EMAILS configuré: $PUBLIC_ADMIN_EMAILS"
    fi
else
    error "NEXT_PUBLIC_ADMIN_EMAILS manquant dans .env.local"
fi

echo ""

# 2. Vérifier Firebase credentials
echo "🔥 Étape 2: Vérification credentials Firebase"
echo "──────────────────────────────────────────────────"

if grep -q "NEXT_PUBLIC_FIREBASE_API_KEY=" .env.local; then
    success "NEXT_PUBLIC_FIREBASE_API_KEY configuré"
else
    error "NEXT_PUBLIC_FIREBASE_API_KEY manquant"
fi

if grep -q "NEXT_PUBLIC_FIREBASE_PROJECT_ID=" .env.local; then
    success "NEXT_PUBLIC_FIREBASE_PROJECT_ID configuré"
else
    error "NEXT_PUBLIC_FIREBASE_PROJECT_ID manquant"
fi

if grep -q "FIREBASE_PROJECT_ID=" .env.local; then
    success "FIREBASE_PROJECT_ID configuré (Admin SDK)"
else
    warning "FIREBASE_PROJECT_ID manquant (Admin SDK)"
fi

echo ""

# 3. Vérifier les scripts admin
echo "📜 Étape 3: Vérification scripts admin"
echo "──────────────────────────────────────────────────"

if [ -f scripts/create-admin.js ]; then
    success "create-admin.js disponible"
else
    error "create-admin.js manquant"
fi

if [ -f scripts/set-admin.js ]; then
    success "set-admin.js disponible"
else
    warning "set-admin.js manquant"
fi

echo ""

# 4. Vérifier la page admin
echo "📄 Étape 4: Vérification page admin"
echo "──────────────────────────────────────────────────"

if [ -f src/app/admin/page.tsx ]; then
    success "Page admin trouvée"
    
    # Vérifier que le fix est appliqué
    if grep -q "document.cookie" src/app/admin/page.tsx; then
        success "Fix du token cookie appliqué"
    else
        warning "Fix du token cookie non appliqué"
    fi
else
    error "Page admin manquante"
fi

echo ""

# 5. Recommandations
echo "💡 Étape 5: Recommandations"
echo "──────────────────────────────────────────────────"

echo ""
echo "Pour créer un compte admin:"
echo "  node scripts/create-admin.js email@domain.com Password123! First Last"
echo ""
echo "Pour promouvoir un utilisateur existant:"
echo "  node scripts/set-admin.js email@domain.com true"
echo ""
echo "Pour tester la connexion:"
echo "  1. npm run dev"
echo "  2. Ouvrir http://localhost:3000/admin"
echo "  3. Se connecter avec les identifiants admin"
echo ""

echo "═══════════════════════════════════════════════════"
echo "✅ Diagnostic terminé"
echo "═══════════════════════════════════════════════════"
