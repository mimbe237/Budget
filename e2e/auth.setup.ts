import { test as setup, expect } from '@playwright/test';

const authFile = 'playwright/.auth/user.json';

setup('authenticate', async ({ page }) => {
  // Note : Ce setup nécessite des credentials de test Firebase
  // Pour un vrai test, utilisez un compte de test dédié
  await page.goto('/login');
  
  // Attendre que la page de login soit chargée
  await expect(page.locator('h1')).toContainText(/login|connexion/i);
  
  // Remplir le formulaire (ajuster les sélecteurs selon votre implémentation)
  await page.fill('input[type="email"]', process.env.TEST_USER_EMAIL || 'test@example.com');
  await page.fill('input[type="password"]', process.env.TEST_USER_PASSWORD || 'testpassword123');
  
  // Cliquer sur le bouton de connexion
  await page.click('button[type="submit"]');
  
  // Attendre la redirection vers le dashboard
  await page.waitForURL(/dashboard|transactions/);
  
  // Sauvegarder l'état d'authentification
  await page.context().storageState({ path: authFile });
});
