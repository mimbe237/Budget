#!/bin/bash
# Commandes de Déploiement Rapide - Système d'Authentification
# Copier-coller ces commandes dans le terminal

echo "🚀 DÉPLOIEMENT SYSTÈME D'AUTHENTIFICATION"
echo "=========================================="
echo ""

# Naviguer vers le projet
cd /Users/macbook/Touch-Point-Insights/Finance/Budget

# 1. DÉPLOYER LES CLOUD FUNCTIONS
echo "📦 Étape 1/3 : Déploiement Cloud Functions..."
cd functions
npm run build
cd ..
firebase deploy --only functions:onUserCreate,functions:approveUser,functions:rejectUser,functions:getPendingUsers

# 2. VÉRIFIER LE DÉPLOIEMENT
echo ""
echo "✅ Étape 2/3 : Vérification..."
firebase functions:list | grep -E "onUserCreate|approveUser|rejectUser|getPendingUsers"

# 3. INSTRUCTIONS FIREBASE CONSOLE
echo ""
echo "🔧 Étape 3/3 : Configuration Firebase Console"
echo ""
echo ">>> GOOGLE SIGN-IN (2 min) <<<"
echo "1. Ouvrir : https://console.firebase.google.com/project/studio-3821270625-cd276/authentication/providers"
echo "2. Cliquer sur 'Google'"
echo "3. Activer le toggle"
echo "4. Email support : businessclubleader7@gmail.com"
echo "5. Enregistrer"
echo ""
echo ">>> FACEBOOK LOGIN (10 min) <<<"
echo "1. Créer app sur : https://developers.facebook.com/apps/create/"
echo "2. Nom : Budget Pro"
echo "3. Ajouter 'Facebook Login'"
echo "4. URL : https://studio-3821270625-cd276.web.app"
echo "5. Copier App ID & App Secret"
echo "6. Firebase Console → Authentication → Facebook"
echo "7. Coller credentials"
echo "8. Copier OAuth Redirect URI"
echo "9. Facebook App → Valid OAuth Redirect URIs"
echo ""
echo "✅ DÉPLOIEMENT TERMINÉ !"
echo ""
echo "📊 Console Firebase : https://console.firebase.google.com/project/studio-3821270625-cd276"
echo "📧 Support : contact@beonweb.cm"
