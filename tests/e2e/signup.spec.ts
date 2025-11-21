import { test, expect } from '@playwright/test';

const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:9002';

// Ce test vérifie le rendu de la page /signup et la navigation de l'étape 1 à l'étape 2.

test.describe('Signup page', () => {
  test('should render step 1 and navigate to step 2', async ({ page }) => {
    await page.goto(`${BASE_URL}/signup`);

    // Attendre l'étape 1
    await expect(page.getByLabel('Prénom *')).toBeVisible();
    await expect(page.getByLabel('Nom *')).toBeVisible();
    await expect(page.getByLabel('Adresse email *')).toBeVisible();

    // Remplir les champs
    await page.getByLabel('Prénom *').fill('Jean');
    await page.getByLabel('Nom *').fill('Dupont');
    await page.getByLabel('Adresse email *').fill('jean.dupont@example.com');

    // Le champ password est un input avec placeholder
    await page.getByPlaceholder('Créer un mot de passe sécurisé').fill('StrongP@ssw0rd');

    // Cliquer sur Continuer
    await page.getByRole('button', { name: 'Continuer' }).click();

    // Étape 2: vérifier champs visibles
    await expect(page.getByText('Pays de résidence *')).toBeVisible();
    await expect(page.getByText('Genre *')).toBeVisible();
    await expect(page.getByText('Langue préférée *')).toBeVisible();
    await expect(page.getByText('Numéro de téléphone *')).toBeVisible();
  });
});
