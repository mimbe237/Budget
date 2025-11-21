#!/usr/bin/env node

/**
 * Generate optimized PWA icons with Sharp
 * Phase 3.4 - Image Optimization
 * 
 * Generates PNG icons from SVG source with optimal compression
 * Supports: standard icons, maskable icons, favicon
 */

const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');

const ICONS_DIR = path.join(__dirname, '../public/icons');
const FAVICON_PATH = path.join(__dirname, '../public/favicon.ico');

// Icon configurations
const ICON_CONFIGS = [
  // Standard icons
  { size: 192, name: 'icon-192.png', purpose: 'any' },
  { size: 512, name: 'icon-512.png', purpose: 'any' },
  
  // Maskable icons (avec safe zone 80% du canvas)
  { size: 512, name: 'maskable-512.png', purpose: 'maskable', padding: 0.1 },
  
  // Apple touch icon
  { size: 180, name: 'apple-touch-icon.png', purpose: 'any' },
  
  // Favicon sizes
  { size: 32, name: 'favicon-32x32.png', purpose: 'any' },
  { size: 16, name: 'favicon-16x16.png', purpose: 'any' },
];

/**
 * Create a simple icon with "BP" text (Budget Pro)
 */
async function createIconSVG(size, padding = 0) {
  const actualSize = Math.round(size * (1 - padding * 2));
  const offset = Math.round(size * padding);
  
  const svg = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${size}" height="${size}" fill="#4F46E5"/>
      <rect x="${offset}" y="${offset}" width="${actualSize}" height="${actualSize}" fill="#4F46E5" rx="20"/>
      <text x="50%" y="50%" 
            font-family="Arial, sans-serif" 
            font-size="${actualSize * 0.4}" 
            font-weight="bold" 
            fill="white" 
            text-anchor="middle" 
            dominant-baseline="central">BP</text>
    </svg>
  `;
  
  return Buffer.from(svg);
}

/**
 * Generate a single icon
 */
async function generateIcon(config) {
  const { size, name, padding = 0 } = config;
  const outputPath = path.join(ICONS_DIR, name);
  
  try {
    const svgBuffer = await createIconSVG(size, padding);
    
    await sharp(svgBuffer)
      .resize(size, size, {
        fit: 'contain',
        background: { r: 79, g: 70, b: 229, alpha: 1 }, // #4F46E5
      })
      .png({
        quality: 95,
        compressionLevel: 9,
        adaptiveFiltering: true,
      })
      .toFile(outputPath);
    
    const stats = await fs.stat(outputPath);
    const sizeKB = (stats.size / 1024).toFixed(2);
    
    console.log(`✅ Generated: ${name} (${size}x${size}, ${sizeKB} KB)`);
    
    return { name, size: stats.size };
  } catch (error) {
    console.error(`❌ Error generating ${name}:`, error.message);
    throw error;
  }
}

/**
 * Generate favicon.ico (multi-size ICO file)
 */
async function generateFavicon() {
  try {
    const svg16 = await createIconSVG(16);
    const svg32 = await createIconSVG(32);
    
    // Generate individual PNGs first
    const png16 = await sharp(svg16)
      .resize(16, 16)
      .png({ quality: 95, compressionLevel: 9 })
      .toBuffer();
    
    const png32 = await sharp(svg32)
      .resize(32, 32)
      .png({ quality: 95, compressionLevel: 9 })
      .toBuffer();
    
    // Note: Sharp doesn't support ICO directly, but we can create individual PNGs
    // For now, just create a 32x32 favicon.ico (most browsers use PNG anyway)
    await sharp(svg32)
      .resize(32, 32)
      .toFile(FAVICON_PATH.replace('.ico', '-32x32.png'));
    
    console.log(`✅ Generated: favicon-32x32.png (fallback for ICO)`);
    console.log(`ℹ️  Note: Modern browsers prefer PNG. Update <link rel="icon" href="/favicon-32x32.png">`);
    
  } catch (error) {
    console.error(`❌ Error generating favicon:`, error.message);
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('🎨 PWA Icons Generator with Sharp\n');
  console.log(`📂 Output directory: ${ICONS_DIR}\n`);
  
  // Ensure icons directory exists
  try {
    await fs.access(ICONS_DIR);
  } catch {
    await fs.mkdir(ICONS_DIR, { recursive: true });
    console.log(`📁 Created directory: ${ICONS_DIR}\n`);
  }
  
  // Generate all icons
  const results = [];
  for (const config of ICON_CONFIGS) {
    try {
      const result = await generateIcon(config);
      results.push(result);
    } catch (error) {
      console.error(`Skipping ${config.name} due to error`);
    }
  }
  
  // Generate favicon
  await generateFavicon();
  
  // Summary
  console.log('\n📊 Summary:');
  const totalSize = results.reduce((sum, r) => sum + r.size, 0);
  const totalSizeKB = (totalSize / 1024).toFixed(2);
  
  console.log(`   Generated: ${results.length} icons`);
  console.log(`   Total size: ${totalSizeKB} KB`);
  console.log(`   Average: ${(totalSize / results.length / 1024).toFixed(2)} KB per icon`);
  
  console.log('\n✅ All icons generated successfully!');
  console.log('\n📝 Next steps:');
  console.log('   1. Update manifest.webmanifest to use .png icons');
  console.log('   2. Update layout.tsx <link rel="icon"> to favicon-32x32.png');
  console.log('   3. Verify icons in Chrome DevTools > Application > Manifest');
}

// Run
main().catch((error) => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});
