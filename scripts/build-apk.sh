#!/bin/bash

# Script de génération APK Budget Pro pour Android
# Utilise Capacitor pour créer une app native pointant vers Firebase Hosting

set -e

echo "🚀 Génération APK Budget Pro"
echo "============================"
echo ""

# Couleurs
GREEN='\033[0.32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Étape 1: Vérifier Java 17
echo "📋 Étape 1/5: Vérification Java..."
export JAVA_HOME=/Library/Java/JavaVirtualMachines/temurin-17.jdk/Contents/Home
if [ ! -d "$JAVA_HOME" ]; then
    echo -e "${RED}❌ Java 17 non trouvé!${NC}"
    echo "Installez Java 17: https://adoptium.net/temurin/releases/?version=17"
    exit 1
fi
echo -e "${GREEN}✓ Java 17 configuré${NC}"
echo "  JAVA_HOME=$JAVA_HOME"
echo ""

# Étape 2: Synchroniser Capacitor
echo "📱 Étape 2/5: Synchronisation Capacitor..."
npx cap sync android > /dev/null 2>&1
echo -e "${GREEN}✓ Capacitor synchronisé${NC}"
echo ""

# Étape 3: Clean Gradle
echo "🧹 Étape 3/5: Nettoyage Gradle..."
cd android
./gradlew clean > /dev/null 2>&1
echo -e "${GREEN}✓ Build cache nettoyé${NC}"
cd ..
echo ""

# Étape 4: Build APK Release
echo "🔨 Étape 4/5: Build APK release..."
echo "  (Cela peut prendre plusieurs minutes...)"
cd android
./gradlew assembleRelease
cd ..

# Vérifier si l'APK a été créé
APK_PATH="android/app/build/outputs/apk/release/app-release.apk"
if [ -f "$APK_PATH" ]; then
    echo -e "${GREEN}✅ APK généré avec succès!${NC}"
    echo ""
    
    # Étape 5: Copier vers playstore-assets
    echo "📦 Étape 5/5: Copie vers playstore-assets..."
    mkdir -p playstore-assets
    cp "$APK_PATH" playstore-assets/budget-pro-v1.0.0.apk
    
    # Afficher les détails
    APK_SIZE=$(ls -lh playstore-assets/budget-pro-v1.0.0.apk | awk '{print $5}')
    echo -e "${GREEN}✓ APK copié${NC}"
    echo ""
    echo "📊 Résumé"
    echo "========"
    echo "  Fichier : playstore-assets/budget-pro-v1.0.0.apk"
    echo "  Taille  : $APK_SIZE"
    echo "  Package : com.touchpointinsights.budget"
    echo "  Version : 1.0 (code: 1)"
    echo ""
    echo "🎯 Prochaines étapes"
    echo "==================="
    echo "  1. Tester l'APK sur un appareil:"
    echo "     adb install playstore-assets/budget-pro-v1.0.0.apk"
    echo ""
    echo "  2. Vérifier la signature:"
    echo "     keytool -printcert -jarfile playstore-assets/budget-pro-v1.0.0.apk"
    echo ""
    echo "  3. Upload sur Play Console:"
    echo "     https://play.google.com/console"
    echo ""
else
    echo -e "${RED}❌ Erreur: APK non trouvé${NC}"
    echo "Vérifiez les logs ci-dessus pour plus de détails."
    exit 1
fi
