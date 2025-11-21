#!/bin/bash

# Script de Packaging TWA - Budget Pro
# Automatise la création de l'APK/AAB pour le Play Store

set -e  # Exit on error

echo "🚀 Budget Pro - TWA Packaging Script"
echo "======================================"
echo ""

# Couleurs pour output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Variables
KEYSTORE_FILE="android.keystore"
KEY_ALIAS="budget-key"
MANIFEST_URL="https://budget-app.web.app/manifest.webmanifest"
ASSETLINKS_URL="https://budget-app.web.app/.well-known/assetlinks.json"

# Fonction d'erreur
error() {
    echo -e "${RED}❌ Erreur: $1${NC}"
    exit 1
}

# Fonction de succès
success() {
    echo -e "${GREEN}✅ $1${NC}"
}

# Fonction d'info
info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Fonction d'avertissement
warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Vérifier les prérequis
echo "📋 Vérification des prérequis..."

# Check Node.js
if ! command -v node &> /dev/null; then
    error "Node.js n'est pas installé. Installer depuis https://nodejs.org"
fi
success "Node.js $(node -v) installé"

# Check Java
if ! command -v java &> /dev/null; then
    error "Java n'est pas installé. Installer JDK 17+ depuis https://adoptium.net"
fi
success "Java $(java -version 2>&1 | head -n 1 | cut -d'"' -f2) installé"

# Check Bubblewrap
if ! command -v bubblewrap &> /dev/null; then
    warning "Bubblewrap CLI n'est pas installé."
    read -p "Voulez-vous l'installer maintenant? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        npm install -g @bubblewrap/cli || error "Échec de l'installation de Bubblewrap"
        success "Bubblewrap CLI installé"
    else
        error "Bubblewrap CLI requis. Installer avec: npm install -g @bubblewrap/cli"
    fi
fi
success "Bubblewrap CLI installé"

echo ""
echo "🔐 Vérification du Keystore..."

# Check si keystore existe
if [ ! -f "$KEYSTORE_FILE" ]; then
    warning "Keystore Android introuvable: $KEYSTORE_FILE"
    read -p "Voulez-vous créer un nouveau keystore? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        info "Création du keystore..."
        keytool -genkey -v -keystore "$KEYSTORE_FILE" -alias "$KEY_ALIAS" \
            -keyalg RSA -keysize 2048 -validity 10000 || error "Échec de la création du keystore"
        success "Keystore créé: $KEYSTORE_FILE"
        
        # Extraire SHA256
        echo ""
        info "SHA-256 du certificat (à copier dans assetlinks.json):"
        keytool -list -v -keystore "$KEYSTORE_FILE" -alias "$KEY_ALIAS" | grep SHA256
        echo ""
        warning "⚠️  IMPORTANT: Sauvegarder ce keystore et son mot de passe!"
        warning "Si perdus, impossible de mettre à jour l'app sur le Play Store."
        read -p "Appuyez sur Entrée pour continuer..."
    else
        error "Keystore requis pour signer l'APK/AAB"
    fi
else
    success "Keystore trouvé: $KEYSTORE_FILE"
fi

echo ""
echo "🌐 Vérification de la configuration en ligne..."

# Vérifier manifest.webmanifest
if curl -f -s "$MANIFEST_URL" > /dev/null; then
    success "Manifest PWA accessible: $MANIFEST_URL"
else
    error "Manifest PWA non accessible. Déployer sur Firebase d'abord: firebase deploy --only hosting"
fi

# Vérifier assetlinks.json
if curl -f -s "$ASSETLINKS_URL" > /dev/null; then
    success "Digital Asset Links accessible: $ASSETLINKS_URL"
    
    # Vérifier si le SHA256 est configuré
    if curl -s "$ASSETLINKS_URL" | grep -q "PLACEHOLDER_SHA256_FINGERPRINT"; then
        warning "assetlinks.json contient encore le placeholder SHA256"
        echo "1. Extraire le SHA256 de votre keystore:"
        echo "   keytool -list -v -keystore $KEYSTORE_FILE -alias $KEY_ALIAS | grep SHA256"
        echo "2. Remplacer PLACEHOLDER_SHA256_FINGERPRINT dans public/.well-known/assetlinks.json"
        echo "3. Redéployer: firebase deploy --only hosting"
        read -p "Continuer quand même? (y/n) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            error "Veuillez configurer assetlinks.json avant de continuer"
        fi
    else
        success "assetlinks.json configuré avec SHA256"
    fi
else
    error "assetlinks.json non accessible. Vérifier public/.well-known/assetlinks.json et redéployer"
fi

echo ""
echo "📦 Options de build:"
echo "1) APK (pour tests, ~3-5 MB)"
echo "2) AAB (pour Play Store, ~2-3 MB)"
echo "3) Les deux"
read -p "Choisir une option (1/2/3): " BUILD_OPTION

# Build production web d'abord
echo ""
info "Building web assets..."
npm run build || error "Build échoué"
success "Build web terminé"

# Initialiser TWA si pas déjà fait
if [ ! -d "android" ]; then
    warning "Projet TWA non initialisé"
    read -p "Initialiser maintenant? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        info "Initialisation du projet TWA..."
        bubblewrap init --manifest "$MANIFEST_URL" || error "Échec de l'initialisation TWA"
        success "Projet TWA initialisé"
    else
        error "Projet TWA requis. Initialiser avec: bubblewrap init --manifest $MANIFEST_URL"
    fi
fi

# Build selon choix
case $BUILD_OPTION in
    1)
        info "Building APK..."
        bubblewrap build || error "Build APK échoué"
        APK_PATH=$(find android/app/build/outputs/apk -name "*.apk" | head -n 1)
        if [ -f "$APK_PATH" ]; then
            APK_SIZE=$(du -h "$APK_PATH" | cut -f1)
            success "APK créé: $APK_PATH ($APK_SIZE)"
            echo ""
            info "Pour installer sur un appareil Android:"
            echo "   adb install $APK_PATH"
        else
            error "APK non trouvé après build"
        fi
        ;;
    2)
        info "Building AAB..."
        bubblewrap build --skipPwaValidation || error "Build AAB échoué"
        AAB_PATH=$(find android/app/build/outputs/bundle -name "*.aab" | head -n 1)
        if [ -f "$AAB_PATH" ]; then
            AAB_SIZE=$(du -h "$AAB_PATH" | cut -f1)
            success "AAB créé: $AAB_PATH ($AAB_SIZE)"
            echo ""
            info "Pour publier sur Play Store:"
            echo "1. Se connecter à https://play.google.com/console"
            echo "2. Créer/sélectionner l'application"
            echo "3. Aller dans 'Version de production'"
            echo "4. Upload: $AAB_PATH"
        else
            error "AAB non trouvé après build"
        fi
        ;;
    3)
        info "Building APK et AAB..."
        
        # Build APK
        bubblewrap build || warning "Build APK échoué (continuant avec AAB)"
        APK_PATH=$(find android/app/build/outputs/apk -name "*.apk" | head -n 1)
        if [ -f "$APK_PATH" ]; then
            APK_SIZE=$(du -h "$APK_PATH" | cut -f1)
            success "APK créé: $APK_PATH ($APK_SIZE)"
        fi
        
        # Build AAB
        bubblewrap build --skipPwaValidation || error "Build AAB échoué"
        AAB_PATH=$(find android/app/build/outputs/bundle -name "*.aab" | head -n 1)
        if [ -f "$AAB_PATH" ]; then
            AAB_SIZE=$(du -h "$AAB_PATH" | cut -f1)
            success "AAB créé: $AAB_PATH ($AAB_SIZE)"
        fi
        ;;
    *)
        error "Option invalide"
        ;;
esac

echo ""
echo "🎉 Packaging TWA terminé avec succès!"
echo ""
echo "📋 Prochaines étapes:"
echo "1. Tester l'APK sur un appareil Android"
echo "2. Préparer les assets Play Store (screenshots, feature graphic)"
echo "3. Créer/se connecter à Google Play Console"
echo "4. Upload l'AAB et remplir la fiche du Store"
echo "5. Soumettre pour révision"
echo ""
echo "📚 Documentation complète: docs/TWA_PLAYSTORE_GUIDE.md"
