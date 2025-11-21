import { test, expect } from '@playwright/test';

// Note: Ces tests nécessitent une authentification préalable
// Décommenter la ligne suivante une fois le setup auth configuré
// test.use({ storageState: 'playwright/.auth/user.json' });

test.describe('CRUD Transactions', () => {
  test.skip('crée une nouvelle transaction', async ({ page }) => {
    await page.goto('/transactions');
    
    // Cliquer sur le bouton "Nouvelle transaction" ou "Add"
    await page.click('button:has-text("Nouvelle transaction"), button:has-text("New transaction")');
    
    // Attendre l'ouverture du formulaire/dialog
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    
    // Remplir le formulaire
    await page.fill('input[name="description"]', 'Test Transaction E2E');
    await page.fill('input[name="amount"]', '50.00');
    
    // Sélectionner le type (income/expense)
    await page.click('select[name="type"]');
    await page.click('option:has-text("Expense"), option:has-text("Dépense")');
    
    // Sélectionner une catégorie
    await page.click('select[name="category"]');
    await page.click('option:has-text("Food"), option:has-text("Alimentation")');
    
    // Soumettre le formulaire
    await page.click('button[type="submit"]');
    
    // Vérifier le toast de succès
    await expect(page.locator('[role="status"]')).toContainText(/ajouté|added|success/i);
    
    // Vérifier que la transaction apparaît dans la liste
    await expect(page.locator('text=Test Transaction E2E')).toBeVisible();
  });

  test.skip('modifie une transaction existante', async ({ page }) => {
    await page.goto('/transactions');
    
    // Trouver la première transaction et cliquer sur "Modifier"
    await page.click('button[aria-label*="edit"], button[aria-label*="modifier"]');
    
    // Attendre l'ouverture du formulaire
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    
    // Modifier la description
    await page.fill('input[name="description"]', 'Transaction Modifiée E2E');
    
    // Soumettre
    await page.click('button[type="submit"]');
    
    // Vérifier le toast de succès
    await expect(page.locator('[role="status"]')).toContainText(/mis à jour|updated/i);
  });

  test.skip('supprime une transaction', async ({ page }) => {
    await page.goto('/transactions');
    
    // Cliquer sur le bouton de suppression
    await page.click('button[aria-label*="delete"], button[aria-label*="supprimer"]');
    
    // Confirmer dans l'AlertDialog
    await page.click('button:has-text("Delete"), button:has-text("Supprimer")');
    
    // Vérifier le toast de succès
    await expect(page.locator('[role="status"]')).toContainText(/supprimé|deleted/i);
  });

  test.skip('charge plus de transactions (pagination)', async ({ page }) => {
    await page.goto('/transactions');
    
    // Vérifier la présence de transactions
    const transactionCount = await page.locator('table tbody tr').count();
    expect(transactionCount).toBeGreaterThan(0);
    
    // Cliquer sur "Charger plus"
    const loadMoreButton = page.getByRole('button', { name: /charger plus|load more/i });
    if (await loadMoreButton.isVisible()) {
      await loadMoreButton.click();
      
      // Attendre que de nouvelles transactions soient chargées
      await page.waitForTimeout(1000);
      
      const newTransactionCount = await page.locator('table tbody tr').count();
      expect(newTransactionCount).toBeGreaterThan(transactionCount);
    }
  });
});
