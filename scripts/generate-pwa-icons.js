const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const ICON_DIR = path.join(__dirname, '../public/icons');
const SOURCE_ICON = path.join(__dirname, '../public/logo.svg');

// Fallback si pas de logo.svg
const FALLBACK_ICON = path.join(__dirname, '../public/favicon.ico');

const SIZES = [
  { size: 192, name: 'icon-192.png', purpose: 'any' },
  { size: 512, name: 'icon-512.png', purpose: 'any' },
  { size: 512, name: 'maskable-512.png', purpose: 'maskable', padding: 0.1 },
  { size: 96, name: 'badge-96.png', purpose: 'monochrome' },
];

const THEME_COLOR = { r: 79, g: 70, b: 229, alpha: 1 }; // #4F46E5

async function generateIcons() {
  // Créer le dossier icons si nécessaire
  if (!fs.existsSync(ICON_DIR)) {
    fs.mkdirSync(ICON_DIR, { recursive: true });
    console.log('📁 Dossier /public/icons créé');
  }

  // Vérifier si la source existe
  let sourceFile = SOURCE_ICON;
  if (!fs.existsSync(SOURCE_ICON)) {
    console.warn('⚠️  logo.svg introuvable, tentative avec favicon.ico...');
    if (!fs.existsSync(FALLBACK_ICON)) {
      console.error('❌ Aucune source d\'icône trouvée. Veuillez placer un logo.svg ou favicon.ico dans /public');
      process.exit(1);
    }
    sourceFile = FALLBACK_ICON;
  }

  console.log(`🎨 Génération des icônes PWA depuis ${path.basename(sourceFile)}...\n`);

  for (const config of SIZES) {
    try {
      const outputPath = path.join(ICON_DIR, config.name);
      
      let pipeline = sharp(sourceFile).resize(config.size, config.size, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 0 }
      });
      
      // Ajouter padding pour maskable (safe zone)
      if (config.padding) {
        const padSize = Math.round(config.size * config.padding);
        pipeline = pipeline.extend({
          top: padSize,
          bottom: padSize,
          left: padSize,
          right: padSize,
          background: THEME_COLOR,
        }).resize(config.size, config.size);
      }
      
      // Convertir en monochrome pour badge
      if (config.purpose === 'monochrome') {
        pipeline = pipeline.greyscale();
      }
      
      await pipeline.png().toFile(outputPath);
      
      const stats = fs.statSync(outputPath);
      const sizeKB = (stats.size / 1024).toFixed(2);
      console.log(`✅ ${config.name.padEnd(20)} (${sizeKB} KB) - ${config.purpose}`);
      
    } catch (error) {
      console.error(`❌ Erreur génération ${config.name}:`, error.message);
    }
  }

  console.log('\n🎉 Génération terminée !');
  console.log('\n📋 Prochaines étapes :');
  console.log('   1. Vérifier les icônes dans /public/icons/');
  console.log('   2. Tester le manifest : Chrome DevTools > Application > Manifest');
  console.log('   3. Installer la PWA depuis Chrome (icône + dans la barre d\'adresse)');
}

// Gestion des erreurs
process.on('unhandledRejection', (error) => {
  console.error('❌ Erreur non gérée:', error);
  process.exit(1);
});

// Exécution
generateIcons().catch((error) => {
  console.error('❌ Échec de la génération:', error);
  process.exit(1);
});
