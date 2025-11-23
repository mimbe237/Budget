#!/bin/bash

# Script d'installation automatique du panel admin Next.js
# Usage: ./scripts/setup-admin-panel.sh

set -e

echo "🚀 Installation du Panel Admin React/Next.js pour Budget"
echo "=========================================================="
echo ""

# Vérifier qu'on est dans le bon répertoire
if [ ! -f "pubspec.yaml" ]; then
    echo "❌ Erreur: Ce script doit être exécuté depuis la racine du projet Flutter"
    exit 1
fi

# Créer le projet Next.js
echo "📦 Création du projet Next.js..."
npx create-next-app@latest admin_panel \
    --typescript \
    --eslint \
    --tailwind \
    --src-dir \
    --app \
    --no-import-alias

cd admin_panel

echo ""
echo "📦 Installation des dépendances..."

# Firebase
npm install firebase firebase-admin react-firebase-hooks

# UI Components
npm install @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-select @radix-ui/react-tabs

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

echo ""
echo "📁 Création de la structure des dossiers..."

mkdir -p src/lib
mkdir -p src/components/ui
mkdir -p src/app/admin/login
mkdir -p src/app/admin/dashboard
mkdir -p src/app/admin/users
mkdir -p scripts

echo ""
echo "✅ Installation terminée!"
echo ""
echo "📋 Prochaines étapes:"
echo ""
echo "1. Configurer Firebase:"
echo "   cd admin_panel"
echo "   cp .env.local.example .env.local"
echo "   # Éditer .env.local avec vos credentials Firebase"
echo ""
echo "2. Créer un compte admin:"
echo "   node scripts/create-admin.js admin@budget.com Password123"
echo ""
echo "3. Lancer le serveur de développement:"
echo "   npm run dev"
echo ""
echo "4. Ouvrir dans le navigateur:"
echo "   http://localhost:3000/admin/login"
echo ""
echo "📚 Documentation complète: ../ADMIN_PANEL_SETUP.md"
echo ""
