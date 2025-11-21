'use strict';
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

async function ensureDir(dir) {
  await fs.promises.mkdir(dir, { recursive: true });
}

function buildSvg({ width, height, title, subtitle }) {
  const bg = '#0B1220';
  const fg = '#E5E7EB';
  const muted = '#94A3B8';
  const accent = '#4F46E5';
  return `<?xml version="1.0" encoding="UTF-8"?>
  <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <defs>
      <linearGradient id="g1" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${accent}" stop-opacity="0.9"/>
        <stop offset="100%" stop-color="#22D3EE" stop-opacity="0.85"/>
      </linearGradient>
      <filter id="blur"><feGaussianBlur stdDeviation="80"/></filter>
    </defs>
    <rect width="100%" height="100%" fill="${bg}"/>
    <circle cx="${width * 0.8}" cy="${height * 0.2}" r="220" fill="url(#g1)" filter="url(#blur)" opacity="0.5"/>
    <circle cx="${width * 0.15}" cy="${height * 0.85}" r="260" fill="url(#g1)" filter="url(#blur)" opacity="0.35"/>

    <text x="64" y="${height * 0.2}" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', 'Liberation Sans', sans-serif" font-size="58" font-weight="800" fill="${fg}">Budget Pro</text>

    <text x="64" y="${height * 0.28}" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', 'Liberation Sans', sans-serif" font-size="28" font-weight="600" fill="${muted}">${subtitle}</text>

    <rect x="64" y="${height * 0.36}" width="${width - 128}" height="${height * 0.5}" rx="28" fill="#0F172A" stroke="#1F2A44" stroke-width="3"/>
    <text x="${width / 2}" y="${height * 0.61}" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', 'Liberation Sans', sans-serif" font-size="46" font-weight="700" fill="${fg}">Placeholder – ${title}</text>

    <text x="64" y="${height - 96}" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', 'Liberation Sans', sans-serif" font-size="26" font-weight="600" fill="${muted}">Remplacez par une capture réelle dès que possible</text>
  </svg>`;
}

async function generate() {
  const outDir = path.join(process.cwd(), 'playstore-assets');
  await ensureDir(outDir);
  const width = 1080;
  const height = 1920;
  const shots = [
    { slug: '01-home', title: 'Accueil', subtitle: 'Aperçu et CTA' },
    { slug: '02-dashboard', title: 'Tableau de bord', subtitle: 'Solde, dépenses, revenus' },
    { slug: '03-transactions', title: 'Transactions', subtitle: 'Ajout et historique' },
    { slug: '04-goals', title: 'Objectifs', subtitle: 'Progression et contributions' },
    { slug: '05-reports', title: 'Rapports', subtitle: 'Graphiques et analyses' },
  ];

  for (const s of shots) {
    const svg = buildSvg({ width, height, title: s.title, subtitle: s.subtitle });
    const outPath = path.join(outDir, `${s.slug}-placeholder-1080x1920.png`);
    await sharp(Buffer.from(svg)).png().toFile(outPath);
    console.log(`✅ Generated: ${outPath}`);
  }
}

generate().catch((err) => { console.error('❌ Erreur génération placeholders:', err); process.exit(1); });
