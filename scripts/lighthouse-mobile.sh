#!/bin/bash

# Lighthouse Audit Mobile - Phase 3.7
# Audit complet PWA + Performance + Accessibility + Best Practices + SEO

echo "🚀 Lancement Lighthouse Audit Mobile..."
echo "📱 Configuration: Mobile (Moto G4), Slow 4G, CPU 4x slowdown"
echo ""

# Vérifier que lighthouse est installé
if ! command -v npx &> /dev/null
then
    echo "❌ npx n'est pas disponible"
    exit 1
fi

# URL à auditer (dev server ou production)
URL="${1:-http://localhost:9002/dashboard}"
OUTPUT_PATH="./lighthouse-reports"

# Créer le dossier de rapports
mkdir -p "$OUTPUT_PATH"

echo "🎯 URL auditée: $URL"
echo "📂 Rapports: $OUTPUT_PATH"
echo ""

# Audit avec configuration mobile
npx lighthouse "$URL" \
  --preset=desktop \
  --emulated-form-factor=mobile \
  --throttling-method=simulate \
  --throttling.cpuSlowdownMultiplier=4 \
  --output=html \
  --output=json \
  --output-path="$OUTPUT_PATH/report-$(date +%Y%m%d-%H%M%S)" \
  --chrome-flags="--headless --no-sandbox --disable-gpu" \
  --only-categories=performance,pwa,accessibility,best-practices,seo \
  --view

echo ""
echo "✅ Audit terminé!"
echo "📊 Ouvrir: $OUTPUT_PATH/report-*.html"
