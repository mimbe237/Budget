import { test, expect } from '@playwright/test';

// Note: Ces tests nécessitent une authentification préalable
// test.use({ storageState: 'playwright/.auth/user.json' });

test.describe('CRUD Objectifs', () => {
  test.skip('crée un nouvel objectif', async ({ page }) => {
    await page.goto('/goals');
    
    // Cliquer sur "Nouvel objectif"
    await page.click('button:has-text("Nouvel objectif"), button:has-text("New Goal")');
    
    // Attendre l'ouverture du formulaire
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    
    // Remplir le formulaire
    await page.fill('input[name="name"]', 'Objectif Test E2E');
    await page.fill('input[name="targetAmount"]', '1000');
    await page.fill('input[name="currentAmount"]', '200');
    
    // Sélectionner une date cible
    await page.click('input[name="targetDate"]');
    await page.click('button[name="day"]:has-text("15")'); // Sélectionner le 15 du mois
    
    // Soumettre
    await page.click('button[type="submit"]');
    
    // Vérifier le toast de succès
    await expect(page.locator('[role="status"]')).toContainText(/ajouté|added/i);
    
    // Vérifier que l'objectif apparaît dans la liste
    await expect(page.locator('text=Objectif Test E2E')).toBeVisible();
  });

  test.skip('ajoute une contribution à un objectif', async ({ page }) => {
    await page.goto('/goals');
    
    // Cliquer sur le bouton d'ajout de contribution
    await page.click('button[aria-label*="contribution"], button:has-text("+")');
    
    // Remplir le montant
    await page.fill('input[name="amount"]', '50');
    
    // Soumettre
    await page.click('button[type="submit"]');
    
    // Vérifier le toast de succès
    await expect(page.locator('[role="status"]')).toContainText(/contribution|ajouté/i);
  });

  test.skip('archive un objectif (complété)', async ({ page }) => {
    await page.goto('/goals');
    
    // Ouvrir le menu d'actions
    await page.click('button[aria-label*="actions"]');
    
    // Cliquer sur "Marquer comme atteint"
    await page.click('button:has-text("Atteint"), button:has-text("Completed")');
    
    // Vérifier le toast de succès
    await expect(page.locator('[role="status"]')).toContainText(/archivé|archived/i);
    
    // Vérifier que l'objectif apparaît dans la section archivée
    await expect(page.locator('text=Objectifs archivés, text=Archived Goals')).toBeVisible();
  });

  test.skip('affiche l\'historique d\'un objectif', async ({ page }) => {
    await page.goto('/goals');
    
    // Cliquer sur le bouton "Historique"
    await page.click('button[aria-label*="history"], button[aria-label*="historique"]');
    
    // Vérifier l'ouverture du dialog d'historique
    await expect(page.locator('[role="dialog"]')).toContainText(/historique|history/i);
    
    // Vérifier la présence de transactions
    await expect(page.locator('table tbody tr')).toHaveCount({ min: 1 });
  });
});
