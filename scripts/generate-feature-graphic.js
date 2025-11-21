'use strict';
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

async function ensureDir(dir) {
  await fs.promises.mkdir(dir, { recursive: true });
}

function buildSvg({ width, height, theme = 'dark' }) {
  const bg = theme === 'dark' ? '#0B1220' : '#FFFFFF';
  const fg = theme === 'dark' ? '#E5E7EB' : '#111827';
  const accent = '#4F46E5';
  const accent2 = '#22D3EE';

  return `<?xml version="1.0" encoding="UTF-8"?>
  <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <defs>
      <linearGradient id="g1" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${accent}" stop-opacity="0.9"/>
        <stop offset="100%" stop-color="${accent2}" stop-opacity="0.85"/>
      </linearGradient>
      <filter id="blur"><feGaussianBlur stdDeviation="40"/></filter>
    </defs>

    <rect width="100%" height="100%" fill="${bg}"/>

    <!-- abstract shapes -->
    <circle cx="${width * 0.85}" cy="${height * 0.2}" r="160" fill="url(#g1)" filter="url(#blur)" opacity="0.55"/>
    <circle cx="${width * 0.2}" cy="${height * 0.85}" r="180" fill="url(#g1)" filter="url(#blur)" opacity="0.45"/>
    <rect x="${width * 0.55}" y="${height * 0.55}" width="260" height="260" rx="28" fill="url(#g1)" opacity="0.25"/>

    <!-- title -->
    <text x="56" y="${height * 0.42}" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', 'Liberation Sans', sans-serif" font-size="86" font-weight="800" letter-spacing="0.5" fill="${fg}">Budget Pro</text>

    <!-- tagline -->
    <text x="56" y="${height * 0.58}" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', 'Liberation Sans', sans-serif" font-size="34" font-weight="500" fill="${fg}" opacity="0.9">Clarté financière. Mobile. Rapide. Offline.</text>

    <!-- chip -->
    <rect x="56" y="${height * 0.68}" rx="14" ry="14" width="380" height="64" fill="url(#g1)"/>
    <text x="82" y="${height * 0.68 + 42}" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', 'Liberation Sans', sans-serif" font-size="28" font-weight="700" fill="#FFFFFF">Suivi • Budgets • Objectifs</text>
  </svg>`;
}

async function generate() {
  const outDir = path.join(process.cwd(), 'playstore-assets');
  await ensureDir(outDir);

  const width = 1024;
  const height = 500;

  for (const theme of ['dark', 'light']) {
    const svg = buildSvg({ width, height, theme });
    const outPath = path.join(outDir, `feature-graphic-${theme}-1024x500.png`);
    await sharp(Buffer.from(svg)).png().toFile(outPath);
    console.log(`✅ Generated: ${outPath}`);
  }
}

generate().catch((err) => {
  console.error('❌ Erreur génération feature graphic:', err);
  process.exit(1);
});
