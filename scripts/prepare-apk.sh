#!/bin/bash

# 🚀 Script complet de préparation APK Budget Pro
# Génère toutes les ressources nécessaires pour l'APK Android

set -e

echo "🚀 PRÉPARATION APK BUDGET PRO"
echo "=============================="
echo ""

# Couleurs
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Étape 1: Générer les icônes
echo -e "${BLUE}📱 Étape 1/4: Génération des icônes${NC}"
npm run icons:all
echo -e "${GREEN}✅ Icônes générées${NC}"
echo ""

# Étape 2: Synchroniser Capacitor
echo -e "${BLUE}🔄 Étape 2/4: Synchronisation Capacitor${NC}"
npx cap sync android
echo -e "${GREEN}✅ Capacitor synchronisé${NC}"
echo ""

# Étape 3: Vérifier les ressources
echo -e "${BLUE}🔍 Étape 3/4: Vérification des ressources${NC}"

# Vérifier icônes Android
ICON_COUNT=$(find android/app/src/main/res/mipmap-* -name "ic_launcher*.png" 2>/dev/null | wc -l)
SPLASH_COUNT=$(find android/app/src/main/res/drawable-* -name "splash.png" 2>/dev/null | wc -l)

echo "  • Icônes Android: $ICON_COUNT fichiers"
echo "  • Splash screens: $SPLASH_COUNT fichiers"

if [ "$ICON_COUNT" -lt 12 ]; then
    echo -e "${YELLOW}⚠️  Attention: Nombre d'icônes Android insuffisant${NC}"
fi

if [ "$SPLASH_COUNT" -lt 6 ]; then
    echo -e "${YELLOW}⚠️  Attention: Nombre de splash screens insuffisant${NC}"
fi

# Vérifier keystore
if [ -f "android-keys/budget-app.keystore" ]; then
    echo "  • Keystore: ✅ Présent"
else
    echo -e "  • Keystore: ${YELLOW}❌ Manquant${NC}"
fi

echo -e "${GREEN}✅ Vérification terminée${NC}"
echo ""

# Étape 4: Instructions finales
echo -e "${BLUE}📋 Étape 4/4: Instructions PWABuilder${NC}"
echo ""
echo "┌─────────────────────────────────────────────────────────┐"
echo "│  🎯 GÉNÉRER L'APK AVEC PWABUILDER                      │"
echo "└─────────────────────────────────────────────────────────┘"
echo ""
echo "1️⃣  Visitez: ${BLUE}https://www.pwabuilder.com/${NC}"
echo ""
echo "2️⃣  Entrez l'URL: ${GREEN}https://studio-3821270625-cd276.web.app${NC}"
echo ""
echo "3️⃣  Configuration Android:"
echo "    • Package: ${GREEN}com.touchpointinsights.budget${NC}"
echo "    • App name: ${GREEN}Budget Pro${NC}"
echo "    • Version: ${GREEN}1.0.0${NC}"
echo "    • Host: ${GREEN}studio-3821270625-cd276.web.app${NC}"
echo ""
echo "4️⃣  Télécharger le package Android"
echo ""
echo "5️⃣  Signer avec notre keystore:"
echo "    ${YELLOW}jarsigner -verbose -sigalg SHA256withRSA \\${NC}"
echo "    ${YELLOW}  -digestalg SHA-256 \\${NC}"
echo "    ${YELLOW}  -keystore android-keys/budget-app.keystore \\${NC}"
echo "    ${YELLOW}  -signedjar budget-pro-signed.apk \\${NC}"
echo "    ${YELLOW}  app-release-unsigned.apk budget-release${NC}"
echo ""
echo "─────────────────────────────────────────────────────────"
echo ""
echo -e "${GREEN}✨ Préparation terminée!${NC}"
echo ""
echo "📦 Ressources disponibles:"
echo "  • SVG source: public/icons/budget-pro-icon.svg"
echo "  • Icônes PWA: public/icons/*.png"
echo "  • Icônes Android: android/app/src/main/res/mipmap-*/"
echo "  • Splash screens: android/app/src/main/res/drawable-*/"
echo "  • Keystore: android-keys/budget-app.keystore"
echo ""
echo "📖 Documentation:"
echo "  • Guide complet: docs/ICONS_GUIDE.md"
echo "  • Build Android: BUILD_ANDROID_GUIDE.md"
echo ""
echo "🔗 Liens utiles:"
echo "  • PWABuilder: https://www.pwabuilder.com/"
echo "  • Play Console: https://play.google.com/console"
echo "  • Firebase: https://console.firebase.google.com/"
echo ""
