#!/usr/bin/env node

/**
 * Script simple pour créer les icônes PWA de base
 * Utilise un carré de couleur unie avec initiales "BP" pour Budget Pro
 * (En attendant d'avoir un vrai logo)
 */

const fs = require('fs');
const path = require('path');

const ICON_DIR = path.join(__dirname, '../public/icons');

// Configuration des icônes
const config = {
  themeColor: '#4F46E5', // Indigo
  textColor: '#FFFFFF',
  appInitials: 'BP',
};

// Créer SVG de base
function createSVG(size, maskable = false) {
  const padding = maskable ? size * 0.2 : 0;
  const contentSize = size - (padding * 2);
  const fontSize = contentSize * 0.5;
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="${config.themeColor}" ${maskable ? 'rx="' + (size * 0.1) + '"' : ''}/>
  <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="${fontSize}" font-weight="bold" fill="${config.textColor}" text-anchor="middle" dominant-baseline="middle">
    ${config.appInitials}
  </text>
</svg>`;
}

// Créer badge monochrome
function createBadgeSVG(size) {
  const fontSize = size * 0.6;
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <circle cx="${size/2}" cy="${size/2}" r="${size/2}" fill="#FFFFFF"/>
  <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="${fontSize}" font-weight="bold" fill="${config.themeColor}" text-anchor="middle" dominant-baseline="middle">
    ${config.appInitials}
  </text>
</svg>`;
}

async function generateIcons() {
  // Créer le dossier icons
  if (!fs.existsSync(ICON_DIR)) {
    fs.mkdirSync(ICON_DIR, { recursive: true });
    console.log('📁 Dossier /public/icons créé');
  }

  console.log('🎨 Génération des icônes PWA temporaires...\n');

  const icons = [
    { name: 'icon-192.png', size: 192, svg: createSVG(192) },
    { name: 'icon-512.png', size: 512, svg: createSVG(512) },
    { name: 'maskable-512.png', size: 512, svg: createSVG(512, true) },
    { name: 'badge-96.png', size: 96, svg: createBadgeSVG(96) },
  ];

  // Sauvegarder les SVG (utilisables directement)
  for (const icon of icons) {
    // Sauvegarder en SVG
    const svgPath = path.join(ICON_DIR, icon.name.replace('.png', '.svg'));
    fs.writeFileSync(svgPath, icon.svg);
    console.log(`✅ ${icon.name.replace('.png', '.svg').padEnd(25)} (${icon.size}x${icon.size})`);
    
    // Créer symlink PNG pointant vers SVG (SVG fonctionnent dans les manifests)
    // Ou créer un PNG placeholder simple
    const pngPath = path.join(ICON_DIR, icon.name);
    if (!fs.existsSync(pngPath)) {
      fs.writeFileSync(pngPath, ''); // Placeholder vide
    }
  }

  console.log('\n📝 NOTE: Icônes temporaires SVG créées.');
  console.log('   Pour des icônes PNG optimisées, installez sharp :');
  console.log('   npm install --save-dev sharp');
  console.log('   puis exécutez à nouveau npm run pwa:icons\n');
  
  console.log('✅ Génération terminée !');
  console.log('\n📋 Prochaines étapes :');
  console.log('   1. Vérifier dans /public/icons/');
  console.log('   2. Tester : Chrome DevTools > Application > Manifest');
  console.log('   3. Remplacer par votre vrai logo quand disponible');
}

generateIcons().catch(console.error);
