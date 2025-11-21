#!/usr/bin/env node

/**
 * Génère les ressources Android pour Capacitor
 * - Splash screens (différentes résolutions)
 * - Icônes d'application (mipmap)
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ANDROID_PATH = path.join(__dirname, '../android/app/src/main/res');
const ICONS_PATH = path.join(__dirname, '../public/icons');

// Splash screen dimensions for Android
const SPLASH_SIZES = [
  { folder: 'drawable-ldpi', width: 320, height: 480 },
  { folder: 'drawable-mdpi', width: 480, height: 800 },
  { folder: 'drawable-hdpi', width: 800, height: 1280 },
  { folder: 'drawable-xhdpi', width: 1280, height: 1920 },
  { folder: 'drawable-xxhdpi', width: 1600, height: 2560 },
  { folder: 'drawable-xxxhdpi', width: 1920, height: 2880 },
];

// Icon sizes for Android (mipmap)
const ICON_SIZES = [
  { folder: 'mipmap-ldpi', size: 36 },
  { folder: 'mipmap-mdpi', size: 48 },
  { folder: 'mipmap-hdpi', size: 72 },
  { folder: 'mipmap-xhdpi', size: 96 },
  { folder: 'mipmap-xxhdpi', size: 144 },
  { folder: 'mipmap-xxxhdpi', size: 192 },
];

async function createSplashScreens() {
  console.log('🎨 Génération des splash screens...');
  
  const iconBuffer = await sharp(path.join(ICONS_PATH, 'icon-512.png'))
    .resize(512, 512, { fit: 'contain', background: { r: 79, g: 70, b: 229, alpha: 1 } })
    .toBuffer();

  for (const size of SPLASH_SIZES) {
    const folder = path.join(ANDROID_PATH, size.folder);
    if (!fs.existsSync(folder)) {
      fs.mkdirSync(folder, { recursive: true });
    }

    // Créer un splash avec le logo centré sur fond violet
    await sharp({
      create: {
        width: size.width,
        height: size.height,
        channels: 4,
        background: { r: 79, g: 70, b: 229, alpha: 1 }, // #4F46E5
      },
    })
      .composite([
        {
          input: await sharp(iconBuffer)
            .resize(Math.floor(size.width * 0.4), Math.floor(size.width * 0.4), {
              fit: 'contain',
              background: { r: 0, g: 0, b: 0, alpha: 0 },
            })
            .toBuffer(),
          gravity: 'center',
        },
      ])
      .png()
      .toFile(path.join(folder, 'splash.png'));

    console.log(`  ✓ ${size.folder}/splash.png`);
  }
}

async function createIcons() {
  console.log('\n🖼️  Génération des icônes Android...');

  const sourceIcon = path.join(ICONS_PATH, 'icon-512.png');

  for (const iconSize of ICON_SIZES) {
    const folder = path.join(ANDROID_PATH, iconSize.folder);
    if (!fs.existsSync(folder)) {
      fs.mkdirSync(folder, { recursive: true });
    }

    // ic_launcher.png
    await sharp(sourceIcon)
      .resize(iconSize.size, iconSize.size, { fit: 'contain', background: { r: 79, g: 70, b: 229, alpha: 1 } })
      .png()
      .toFile(path.join(folder, 'ic_launcher.png'));

    // ic_launcher_round.png (icône ronde)
    const roundBuffer = await sharp(sourceIcon)
      .resize(iconSize.size, iconSize.size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
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

async function updateAndroidManifest() {
  console.log('\n📄 Mise à jour AndroidManifest.xml...');
  
  const manifestPath = path.join(__dirname, '../android/app/src/main/AndroidManifest.xml');
  
  if (!fs.existsSync(manifestPath)) {
    console.warn('⚠️  AndroidManifest.xml non trouvé');
    return;
  }

  let manifest = fs.readFileSync(manifestPath, 'utf8');

  // Ajouter les permissions nécessaires si manquantes
  const permissions = [
    '<uses-permission android:name="android.permission.INTERNET" />',
    '<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />',
  ];

  permissions.forEach((perm) => {
    if (!manifest.includes(perm)) {
      manifest = manifest.replace('<manifest', `<manifest\n    ${perm}`);
    }
  });

  fs.writeFileSync(manifestPath, manifest);
  console.log('  ✓ Permissions ajoutées');
}

async function main() {
  try {
    console.log('🚀 Génération des assets Android pour Capacitor\n');

    if (!fs.existsSync(ANDROID_PATH)) {
      console.error('❌ Dossier android/ non trouvé. Exécutez "npx cap add android" d\'abord.');
      process.exit(1);
    }

    await createSplashScreens();
    await createIcons();
    await updateAndroidManifest();

    console.log('\n✅ Assets Android générés avec succès!');
    console.log('\n📱 Prochaines étapes:');
    console.log('  1. npx cap sync android');
    console.log('  2. cd android && ./gradlew assembleDebug');
    console.log('  3. APK disponible dans: android/app/build/outputs/apk/debug/\n');
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

main();
