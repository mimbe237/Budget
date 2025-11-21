#!/usr/bin/env node

/**
 * Génère toutes les icônes nécessaires à partir du SVG principal
 * Utilise Sharp pour créer les PNG à différentes tailles
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const SVG_SOURCE = path.join(__dirname, '../public/icons/budget-pro-icon.svg');
const ICONS_DIR = path.join(__dirname, '../public/icons');
const ANDROID_RES_DIR = path.join(__dirname, '../android/app/src/main/res');

// Tailles nécessaires pour PWA
const PWA_SIZES = [
  { name: 'favicon-16x16.png', size: 16 },
  { name: 'favicon-32x32.png', size: 32 },
  { name: 'apple-touch-icon.png', size: 180 },
  { name: 'icon-192.png', size: 192 },
  { name: 'icon-512.png', size: 512 },
  { name: 'maskable-512.png', size: 512 },
];

// Tailles pour Android (mipmap)
const ANDROID_SIZES = [
  { folder: 'mipmap-ldpi', size: 36 },
  { folder: 'mipmap-mdpi', size: 48 },
  { folder: 'mipmap-hdpi', size: 72 },
  { folder: 'mipmap-xhdpi', size: 96 },
  { folder: 'mipmap-xxhdpi', size: 144 },
  { folder: 'mipmap-xxxhdpi', size: 192 },
];

// Tailles pour splash screens Android
const SPLASH_SIZES = [
  { folder: 'drawable-ldpi', width: 320, height: 480 },
  { folder: 'drawable-mdpi', width: 480, height: 800 },
  { folder: 'drawable-hdpi', width: 800, height: 1280 },
  { folder: 'drawable-xhdpi', width: 1280, height: 1920 },
  { folder: 'drawable-xxhdpi', width: 1600, height: 2560 },
  { folder: 'drawable-xxxhdpi', width: 1920, height: 2880 },
];

async function generatePWAIcons() {
  console.log('🎨 Génération des icônes PWA...');
  
  const svgBuffer = fs.readFileSync(SVG_SOURCE);

  for (const icon of PWA_SIZES) {
    const outputPath = path.join(ICONS_DIR, icon.name);
    
    await sharp(svgBuffer)
      .resize(icon.size, icon.size, {
        fit: 'contain',
        background: { r: 79, g: 70, b: 229, alpha: 1 },
      })
      .png()
      .toFile(outputPath);

    console.log(`  ✓ ${icon.name}`);
  }
}

async function generateAndroidIcons() {
  console.log('\n🤖 Génération des icônes Android...');
  
  if (!fs.existsSync(ANDROID_RES_DIR)) {
    console.log('  ⚠️  Dossier android/app/src/main/res non trouvé, ignoré.');
    return;
  }

  const svgBuffer = fs.readFileSync(SVG_SOURCE);

  for (const iconSize of ANDROID_SIZES) {
    const folder = path.join(ANDROID_RES_DIR, iconSize.folder);
    if (!fs.existsSync(folder)) {
      fs.mkdirSync(folder, { recursive: true });
    }

    // ic_launcher.png (icône carrée)
    await sharp(svgBuffer)
      .resize(iconSize.size, iconSize.size, {
        fit: 'contain',
        background: { r: 79, g: 70, b: 229, alpha: 1 },
      })
      .png()
      .toFile(path.join(folder, 'ic_launcher.png'));

    // ic_launcher_round.png (icône ronde)
    const roundBuffer = await sharp(svgBuffer)
      .resize(iconSize.size, iconSize.size, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .toBuffer();

    await sharp({
      create: {
        width: iconSize.size,
        height: iconSize.size,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      },
    })
      .composite([
        {
          input: Buffer.from(
            `<svg width="${iconSize.size}" height="${iconSize.size}">
              <circle cx="${iconSize.size / 2}" cy="${iconSize.size / 2}" r="${iconSize.size / 2}" fill="#4F46E5"/>
            </svg>`
          ),
        },
        {
          input: roundBuffer,
        },
      ])
      .png()
      .toFile(path.join(folder, 'ic_launcher_round.png'));

    console.log(`  ✓ ${iconSize.folder}/ic_launcher*.png`);
  }
}

async function generateAndroidSplashScreens() {
  console.log('\n📱 Génération des splash screens Android...');

  if (!fs.existsSync(ANDROID_RES_DIR)) {
    console.log('  ⚠️  Dossier android/app/src/main/res non trouvé, ignoré.');
    return;
  }

  const svgBuffer = fs.readFileSync(SVG_SOURCE);

  for (const size of SPLASH_SIZES) {
    const folder = path.join(ANDROID_RES_DIR, size.folder);
    if (!fs.existsSync(folder)) {
      fs.mkdirSync(folder, { recursive: true });
    }

    // Logo centré sur fond violet
    const logoSize = Math.floor(size.width * 0.4);
    
    const logoBuffer = await sharp(svgBuffer)
      .resize(logoSize, logoSize, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .toBuffer();

    await sharp({
      create: {
        width: size.width,
        height: size.height,
        channels: 4,
        background: { r: 79, g: 70, b: 229, alpha: 1 },
      },
    })
      .composite([
        {
          input: logoBuffer,
          gravity: 'center',
        },
      ])
      .png()
      .toFile(path.join(folder, 'splash.png'));

    console.log(`  ✓ ${size.folder}/splash.png`);
  }
}

async function generateFavicon() {
  console.log('\n🌐 Génération du favicon.ico...');
  
  const svgBuffer = fs.readFileSync(SVG_SOURCE);
  const faviconPath = path.join(__dirname, '../public/favicon.ico');

  // Générer plusieurs tailles pour le favicon.ico (16, 32, 48)
  const sizes = [16, 32, 48];
  const buffers = [];

  for (const size of sizes) {
    const buffer = await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toBuffer();
    buffers.push(buffer);
  }

  // Sharp ne supporte pas directement .ico, on crée juste le 32x32 en .ico
  await sharp(svgBuffer)
    .resize(32, 32)
    .png()
    .toFile(faviconPath.replace('.ico', '-32x32.png'));

  console.log('  ✓ favicon-32x32.png généré');
  console.log('  ℹ️  Utilisez un outil en ligne pour convertir en .ico si nécessaire');
}

async function main() {
  try {
    console.log('🚀 Génération de toutes les icônes à partir du SVG\n');
    console.log(`📄 Source: ${SVG_SOURCE}\n`);

    if (!fs.existsSync(SVG_SOURCE)) {
      console.error('❌ Fichier SVG source non trouvé!');
      console.error(`   Créez d'abord: ${SVG_SOURCE}`);
      process.exit(1);
    }

    await generatePWAIcons();
    await generateAndroidIcons();
    await generateAndroidSplashScreens();
    await generateFavicon();

    console.log('\n✅ Toutes les icônes ont été générées avec succès!');
    console.log('\n📊 Résumé:');
    console.log(`  • Icônes PWA: ${PWA_SIZES.length} fichiers dans public/icons/`);
    console.log(`  • Icônes Android: ${ANDROID_SIZES.length * 2} fichiers (ic_launcher + round)`);
    console.log(`  • Splash screens: ${SPLASH_SIZES.length} fichiers`);
    console.log(`  • Favicon: favicon-32x32.png\n`);

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

main();
