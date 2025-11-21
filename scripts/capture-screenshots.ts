import { chromium, Browser, Page } from '@playwright/test';
import fs from 'fs';
import path from 'path';

async function ensureDir(dir: string) {
  await fs.promises.mkdir(dir, { recursive: true });
}

async function waitForServer(url: string, timeoutMs = 30000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url, { method: 'HEAD' });
      if (res.ok) return true;
    } catch {}
    await new Promise((r) => setTimeout(r, 800));
  }
  throw new Error(`Serveur non disponible sur ${url} après ${timeoutMs} ms`);
}

async function capture(page: Page, url: string, filePath: string) {
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(600); // petit temps pour animations
  await page.screenshot({ path: filePath, fullPage: true });
  console.log(`✅ Screenshot: ${filePath}`);
}

async function main() {
  const baseURL = process.env.BASE_URL || 'http://localhost:9002';
  const outDir = path.join(process.cwd(), 'playstore-assets');
  await ensureDir(outDir);

  console.log(`⏳ Attente du serveur sur ${baseURL} ...`);
  await waitForServer(baseURL);

  const browser: Browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1080, height: 1920 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });

  const page = await context.newPage();

  // Thème clair
  await context.addInitScript(() => {
    try { localStorage.setItem('theme', 'light'); } catch {}
  });
  await page.emulateMedia({ colorScheme: 'light' });

  const routes = [
    { slug: '01-home', path: '/' },
    { slug: '02-dashboard', path: '/dashboard' },
    { slug: '03-transactions', path: '/transactions' },
    { slug: '04-goals', path: '/goals' },
    { slug: '05-reports', path: '/reports' },
  ];

  for (const r of routes) {
    await capture(page, baseURL + r.path, path.join(outDir, `${r.slug}-light-1080x1920.png`));
  }

  // Thème sombre
  await context.clearCookies();
  await context.close();

  const darkContext = await browser.newContext({
    viewport: { width: 1080, height: 1920 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });
  const darkPage = await darkContext.newPage();
  await darkPage.emulateMedia({ colorScheme: 'dark' });
  await darkContext.addInitScript(() => {
    try { localStorage.setItem('theme', 'dark'); } catch {}
  });

  for (const r of routes) {
    await capture(darkPage, baseURL + r.path, path.join(outDir, `${r.slug}-dark-1080x1920.png`));
  }

  await darkContext.close();
  await browser.close();
  console.log(`\n🎉 Screenshots enregistrés dans ${outDir}`);
}

main().catch((err) => {
  console.error('❌ Erreur capture screenshots:', err);
  process.exit(1);
});
