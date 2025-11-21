#!/bin/bash

# Script de déploiement des règles Firestore
# Usage: ./deploy_firestore_rules.sh

echo "🔥 Déploiement des règles Firestore..."

# Vérifier que Firebase CLI est installé
if ! command -v firebase &> /dev/null
then
    echo "❌ Firebase CLI n'est pas installé"
    echo "Installez-le avec: curl -sL https://firebase.tools | bash"
    exit 1
fi

# Vérifier que le fichier de règles existe
if [ ! -f "firestore.rules" ]; then
    echo "❌ Le fichier firestore.rules n'existe pas"
    exit 1
fi

# Déployer les règles
echo "📤 Déploiement en cours..."
firebase deploy --only firestore:rules

if [ $? -eq 0 ]; then
    echo "✅ Règles Firestore déployées avec succès!"
else
    echo "❌ Échec du déploiement"
    exit 1
fi
