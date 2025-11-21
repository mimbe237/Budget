import { test, expect } from '@playwright/test';

/**
 * Test E2E: Création de 4 dettes de test
 * 
 * Ce test vérifie que :
 * 1. L'utilisateur peut se connecter
 * 2. L'utilisateur peut créer 4 dettes différentes
 * 3. Les échéanciers sont générés correctement
 * 4. Les dettes apparaissent dans la liste
 */

const TEST_USER = {
  email: 'businessclubleader7@gmail.com',
  password: process.env.TEST_USER_PASSWORD || 'test_password_change_me',
};

const TEST_DEBTS = [
  {
    type: 'EMPRUNT',
    title: 'Prêt immobilier E2E Test 1',
    counterparty: 'Banque XYZ',
    amount: '10000000',
    currency: 'XAF',
    rate: '5.5',
    termMonths: '240',
    upfrontFees: '200000',
    insurance: '15000',
  },
  {
    type: 'EMPRUNT',
    title: 'Crédit automobile E2E Test 2',
    counterparty: 'Société de crédit ABC',
    amount: '5000000',
    currency: 'XAF',
    rate: '8',
    termMonths: '60',
    upfrontFees: '100000',
    insurance: '8000',
  },
  {
    type: 'PRET',
    title: 'Prêt ami E2E Test 3',
    counterparty: 'Jean Dupont',
    amount: '5000',
    currency: 'EUR',
    rate: '2',
    termMonths: '12',
    upfrontFees: '0',
    insurance: '0',
  },
  {
    type: 'EMPRUNT',
    title: 'Crédit conso E2E Test 4',
    counterparty: 'Banque DEF',
    amount: '10000',
    currency: 'USD',
    rate: '12',
    termMonths: '36',
    upfrontFees: '500',
    insurance: '50',
  },
];

test.describe('Création de 4 dettes de test', () => {
  test.beforeEach(async ({ page }) => {
    // Naviguer vers la page de connexion
    await page.goto('/');
    
    // Se connecter
    await page.fill('input[type="email"]', TEST_USER.email);
    await page.fill('input[type="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');
    
    // Attendre la redirection vers le dashboard
    await page.waitForURL('/dashboard', { timeout: 10000 });
  });

  test('Créer dette 1 : Prêt immobilier', async ({ page }) => {
    const debt = TEST_DEBTS[0];
    
    // Naviguer vers la page de création
    await page.goto('/debts/new');
    await page.waitForLoadState('networkidle');
    
    // Remplir le formulaire
    await page.selectOption('select[name="type"]', debt.type);
    await page.fill('input[name="title"]', debt.title);
    await page.fill('input[name="counterparty"]', debt.counterparty);
    await page.fill('input[name="principal"]', debt.amount);
    await page.selectOption('select[name="currency"]', debt.currency);
    await page.fill('input[name="annualRatePct"]', debt.rate);
    await page.fill('input[name="termMonths"]', debt.termMonths);
    
    // Options avancées
    const advancedToggle = page.locator('button:has-text("Options avancées")');
    if (await advancedToggle.isVisible()) {
      await advancedToggle.click();
    }
    
    await page.fill('input[name="upfrontFees"]', debt.upfrontFees);
    await page.fill('input[name="monthlyInsurance"]', debt.insurance);
    
    // Soumettre
    await page.click('button[type="submit"]');
    
    // Attendre la redirection et la création de l'échéancier
    await page.waitForURL(/\/debts\/.*/, { timeout: 30000 });
    
    // Vérifier que la dette est créée
    await expect(page.locator('h1')).toContainText(debt.title);
    
    // Attendre que l'échéancier soit généré
    await page.waitForSelector('text=Échéancier', { timeout: 10000 });
  });

  test('Créer dette 2 : Crédit automobile', async ({ page }) => {
    const debt = TEST_DEBTS[1];
    
    await page.goto('/debts/new');
    await page.waitForLoadState('networkidle');
    
    await page.selectOption('select[name="type"]', debt.type);
    await page.fill('input[name="title"]', debt.title);
    await page.fill('input[name="counterparty"]', debt.counterparty);
    await page.fill('input[name="principal"]', debt.amount);
    await page.selectOption('select[name="currency"]', debt.currency);
    await page.fill('input[name="annualRatePct"]', debt.rate);
    await page.fill('input[name="termMonths"]', debt.termMonths);
    
    const advancedToggle = page.locator('button:has-text("Options avancées")');
    if (await advancedToggle.isVisible()) {
      await advancedToggle.click();
    }
    
    await page.fill('input[name="upfrontFees"]', debt.upfrontFees);
    await page.fill('input[name="monthlyInsurance"]', debt.insurance);
    
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/debts\/.*/, { timeout: 30000 });
    await expect(page.locator('h1')).toContainText(debt.title);
  });

  test('Créer dette 3 : Prêt à un ami', async ({ page }) => {
    const debt = TEST_DEBTS[2];
    
    await page.goto('/debts/new');
    await page.waitForLoadState('networkidle');
    
    await page.selectOption('select[name="type"]', debt.type);
    await page.fill('input[name="title"]', debt.title);
    await page.fill('input[name="counterparty"]', debt.counterparty);
    await page.fill('input[name="principal"]', debt.amount);
    await page.selectOption('select[name="currency"]', debt.currency);
    await page.fill('input[name="annualRatePct"]', debt.rate);
    await page.fill('input[name="termMonths"]', debt.termMonths);
    
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/debts\/.*/, { timeout: 30000 });
    await expect(page.locator('h1')).toContainText(debt.title);
  });

  test('Créer dette 4 : Crédit consommation', async ({ page }) => {
    const debt = TEST_DEBTS[3];
    
    await page.goto('/debts/new');
    await page.waitForLoadState('networkidle');
    
    await page.selectOption('select[name="type"]', debt.type);
    await page.fill('input[name="title"]', debt.title);
    await page.fill('input[name="counterparty"]', debt.counterparty);
    await page.fill('input[name="principal"]', debt.amount);
    await page.selectOption('select[name="currency"]', debt.currency);
    await page.fill('input[name="annualRatePct"]', debt.rate);
    await page.fill('input[name="termMonths"]', debt.termMonths);
    
    const advancedToggle = page.locator('button:has-text("Options avancées")');
    if (await advancedToggle.isVisible()) {
      await advancedToggle.click();
    }
    
    await page.fill('input[name="upfrontFees"]', debt.upfrontFees);
    await page.fill('input[name="monthlyInsurance"]', debt.insurance);
    
    // Changer le mode d'amortissement
    await page.selectOption('select[name="amortizationMode"]', 'PRINCIPAL_CONSTANT');
    
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/debts\/.*/, { timeout: 30000 });
    await expect(page.locator('h1')).toContainText(debt.title);
  });

  test('Vérifier que les 4 dettes apparaissent dans la liste', async ({ page }) => {
    await page.goto('/debts');
    await page.waitForLoadState('networkidle');
    
    // Vérifier que les 4 dettes sont visibles
    for (const debt of TEST_DEBTS) {
      await expect(page.locator(`text=${debt.title}`)).toBeVisible({ timeout: 5000 });
    }
    
    // Vérifier le nombre total de dettes (au moins 4)
    const debtCards = page.locator('[data-testid="debt-card"]');
    const count = await debtCards.count();
    expect(count).toBeGreaterThanOrEqual(4);
  });
});

test.describe('Tests de régression - Dettes', () => {
  test.use({ storageState: 'playwright/.auth/user.json' });

  test('Le bouton "Ajouter une dette" fonctionne', async ({ page }) => {
    await page.goto('/debts');
    await page.waitForLoadState('networkidle');
    
    // Cliquer sur le bouton d'ajout
    const addButton = page.locator('a[href="/debts/new"]').first();
    await expect(addButton).toBeVisible();
    await addButton.click();
    
    // Vérifier la navigation
    await page.waitForURL('/debts/new');
    await expect(page.locator('h1')).toContainText(/Nouvelle dette|Créer une dette/i);
  });

  test('Le formulaire de création affiche un aperçu', async ({ page }) => {
    await page.goto('/debts/new');
    await page.waitForLoadState('networkidle');
    
    // Remplir les champs requis
    await page.fill('input[name="title"]', 'Test Aperçu');
    await page.fill('input[name="principal"]', '10000');
    await page.fill('input[name="annualRatePct"]', '5');
    await page.fill('input[name="termMonths"]', '12');
    
    // Attendre que l'aperçu se génère
    await page.waitForTimeout(1000);
    
    // Vérifier que l'aperçu est visible
    const preview = page.locator('[data-testid="schedule-preview"]');
    await expect(preview).toBeVisible({ timeout: 5000 });
  });

  test('Erreur 500 buildSchedule ne se produit plus', async ({ page }) => {
    await page.goto('/debts/new');
    await page.waitForLoadState('networkidle');
    
    // Remplir et soumettre un formulaire valide
    await page.fill('input[name="title"]', 'Test No Error 500');
    await page.fill('input[name="principal"]', '5000');
    await page.fill('input[name="annualRatePct"]', '3');
    await page.fill('input[name="termMonths"]', '6');
    
    // Écouter les erreurs réseau
    const errors: string[] = [];
    page.on('response', response => {
      if (response.status() === 500 && response.url().includes('buildSchedule')) {
        errors.push(`500 error on buildSchedule: ${response.url()}`);
      }
    });
    
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/debts\/.*/, { timeout: 30000 });
    
    // Vérifier qu'aucune erreur 500 n'est survenue
    expect(errors).toHaveLength(0);
  });
});
