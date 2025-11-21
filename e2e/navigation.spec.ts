import { test, expect } from '@playwright/test';

test.describe('Navigation de base', () => {
  test('affiche la page de login', async ({ page }) => {
    await page.goto('/login');
    
    // Vérifier que la page de login est affichée
    await expect(page.locator('h1')).toContainText(/login|connexion/i);
    
    // Vérifier la présence des champs email et password
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('affiche la page offline', async ({ page }) => {
    await page.goto('/offline');
    
    // Vérifier que la page offline est affichée
    await expect(page.locator('h1')).toContainText(/hors ligne|offline/i);
    
    // Vérifier la présence du bouton "Réessayer"
    await expect(page.getByRole('button', { name: /réessayer|retry/i })).toBeVisible();
  });

  test('redirige vers login si non authentifié', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Devrait rediriger vers /login (selon votre logique d'auth)
    await page.waitForURL(/login/);
    await expect(page.locator('h1')).toContainText(/login|connexion/i);
  });
});
