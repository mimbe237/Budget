import { test, expect } from '@playwright/test';

test.describe('Page d\'inscription', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:9002/signup');
  });

  test('affiche le titre et la description', async ({ page }) => {
    await expect(page.getByText('Créer votre compte')).toBeVisible();
    await expect(page.getByText('Commençons par vos informations de base')).toBeVisible();
  });

  test('affiche l\'étape 1 par défaut', async ({ page }) => {
    await expect(page.getByText('Informations personnelles')).toBeVisible();
    await expect(page.getByPlaceholder('Votre prénom')).toBeVisible();
    await expect(page.getByPlaceholder('Votre nom')).toBeVisible();
    await expect(page.getByPlaceholder('votre@email.com')).toBeVisible();
  });

  test('validation temps réel - prénom', async ({ page }) => {
    const prenomInput = page.getByPlaceholder('Votre prénom');
    
    // Taper un caractère - devrait afficher une erreur
    await prenomInput.fill('J');
    await prenomInput.blur();
    await expect(page.getByText('Le prénom doit contenir au moins 2 caractères')).toBeVisible();
    
    // Compléter - devrait retirer l'erreur et afficher l'icône verte
    await prenomInput.fill('Jean');
    await expect(page.getByText('Le prénom doit contenir au moins 2 caractères')).not.toBeVisible();
  });

  test('validation temps réel - email', async ({ page }) => {
    const emailInput = page.getByPlaceholder('votre@email.com');
    
    // Email invalide
    await emailInput.fill('email-invalide');
    await emailInput.blur();
    await expect(page.getByText('Format d\'email invalide')).toBeVisible();
    
    // Email valide
    await emailInput.fill('test@example.com');
    await expect(page.getByText('Format d\'email invalide')).not.toBeVisible();
  });

  test('validation temps réel - mot de passe', async ({ page }) => {
    const passwordInput = page.getByPlaceholder('Créer un mot de passe sécurisé');
    
    // Mot de passe court
    await passwordInput.fill('12345');
    await passwordInput.blur();
    await expect(page.getByText(/Le mot de passe doit contenir au moins 6 caractères/)).toBeVisible();
    
    // Mot de passe valide
    await passwordInput.fill('Password123');
    await expect(page.getByText('Très fort')).toBeVisible();
  });

  test('bouton Continuer désactivé si formulaire invalide', async ({ page }) => {
    const continuerBtn = page.getByRole('button', { name: 'Continuer' });
    
    // Bouton devrait être désactivé initialement
    await expect(continuerBtn).toBeDisabled();
    
    // Remplir tous les champs valides
    await page.getByPlaceholder('Votre prénom').fill('Jean');
    await page.getByPlaceholder('Votre nom').fill('Dupont');
    await page.getByPlaceholder('votre@email.com').fill('jean.dupont@example.com');
    await page.getByPlaceholder('Créer un mot de passe sécurisé').fill('Password123');
    
    // Bouton devrait être activé
    await expect(continuerBtn).toBeEnabled();
  });

  test('navigation vers étape 2', async ({ page }) => {
    // Remplir l'étape 1
    await page.getByPlaceholder('Votre prénom').fill('Jean');
    await page.getByPlaceholder('Votre nom').fill('Dupont');
    await page.getByPlaceholder('votre@email.com').fill('jean.dupont@example.com');
    await page.getByPlaceholder('Créer un mot de passe sécurisé').fill('Password123');
    
    // Cliquer sur Continuer
    await page.getByRole('button', { name: 'Continuer' }).click();
    
    // Vérifier l'étape 2
    await expect(page.getByText('Personnalisez votre expérience')).toBeVisible();
    await expect(page.getByText('Pays de résidence *')).toBeVisible();
    await expect(page.getByText('Genre *')).toBeVisible();
    await expect(page.getByText('Langue préférée *')).toBeVisible();
    await expect(page.getByText('Numéro de téléphone *')).toBeVisible();
  });

  test('sélection du genre', async ({ page }) => {
    // Naviguer vers l'étape 2
    await page.getByPlaceholder('Votre prénom').fill('Jean');
    await page.getByPlaceholder('Votre nom').fill('Dupont');
    await page.getByPlaceholder('votre@email.com').fill('jean.dupont@example.com');
    await page.getByPlaceholder('Créer un mot de passe sécurisé').fill('Password123');
    await page.getByRole('button', { name: 'Continuer' }).click();
    
    // Sélectionner le genre
    await page.getByLabel('♂ Homme').click();
    await expect(page.getByLabel('♂ Homme')).toBeChecked();
  });

  test('bouton Retour fonctionne', async ({ page }) => {
    // Naviguer vers l'étape 2
    await page.getByPlaceholder('Votre prénom').fill('Jean');
    await page.getByPlaceholder('Votre nom').fill('Dupont');
    await page.getByPlaceholder('votre@email.com').fill('jean.dupont@example.com');
    await page.getByPlaceholder('Créer un mot de passe sécurisé').fill('Password123');
    await page.getByRole('button', { name: 'Continuer' }).click();
    
    // Cliquer sur Retour
    await page.getByRole('button', { name: 'Retour' }).click();
    
    // Vérifier retour à l'étape 1
    await expect(page.getByText('Commençons par vos informations de base')).toBeVisible();
    await expect(page.getByPlaceholder('Votre prénom')).toHaveValue('Jean');
  });

  test('lien Se connecter fonctionne', async ({ page }) => {
    const loginLink = page.getByRole('link', { name: 'Se connecter' });
    await expect(loginLink).toBeVisible();
    await expect(loginLink).toHaveAttribute('href', '/login');
  });

  test('affichage du bouton masquer/afficher mot de passe', async ({ page }) => {
    const passwordInput = page.getByPlaceholder('Créer un mot de passe sécurisé');
    await passwordInput.fill('Password123');
    
    // Vérifier que le type est password initialement
    await expect(passwordInput).toHaveAttribute('type', 'password');
    
    // Cliquer sur le bouton œil
    await page.getByLabel('Afficher le mot de passe').click();
    
    // Vérifier que le type est maintenant text
    await expect(passwordInput).toHaveAttribute('type', 'text');
  });

  test('formulaire complet - responsive mobile', async ({ page, viewport }) => {
    // Définir viewport mobile
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Vérifier que la page s'affiche correctement
    await expect(page.getByText('Créer votre compte')).toBeVisible();
    
    // Remplir le formulaire
    await page.getByPlaceholder('Votre prénom').fill('Marie');
    await page.getByPlaceholder('Votre nom').fill('Martin');
    await page.getByPlaceholder('votre@email.com').fill('marie.martin@example.com');
    await page.getByPlaceholder('Créer un mot de passe sécurisé').fill('SecurePass123');
    
    // Vérifier que le bouton est activé
    await expect(page.getByRole('button', { name: 'Continuer' })).toBeEnabled();
  });

  test('validation numéro de téléphone', async ({ page }) => {
    // Naviguer vers l'étape 2
    await page.getByPlaceholder('Votre prénom').fill('Jean');
    await page.getByPlaceholder('Votre nom').fill('Dupont');
    await page.getByPlaceholder('votre@email.com').fill('jean.dupont@example.com');
    await page.getByPlaceholder('Créer un mot de passe sécurisé').fill('Password123');
    await page.getByRole('button', { name: 'Continuer' }).click();
    
    // Tester numéro trop court
    const phoneInput = page.getByPlaceholder('Numéro de téléphone');
    await phoneInput.fill('12345');
    await phoneInput.blur();
    await expect(page.getByText('Le numéro semble incomplet')).toBeVisible();
    
    // Numéro valide
    await phoneInput.fill('0612345678');
    await expect(page.getByText('Le numéro semble incomplet')).not.toBeVisible();
  });

  test('indicateurs de progression des étapes', async ({ page }) => {
    // Étape 1 - icône 1 devrait être en bleu
    await expect(page.locator('.bg-blue-600.text-white').first()).toContainText('1');
    
    // Naviguer vers l'étape 2
    await page.getByPlaceholder('Votre prénom').fill('Jean');
    await page.getByPlaceholder('Votre nom').fill('Dupont');
    await page.getByPlaceholder('votre@email.com').fill('jean.dupont@example.com');
    await page.getByPlaceholder('Créer un mot de passe sécurisé').fill('Password123');
    await page.getByRole('button', { name: 'Continuer' }).click();
    
    // Les deux icônes devraient être en bleu
    const blueSteps = page.locator('.bg-blue-600.text-white');
    await expect(blueSteps).toHaveCount(2);
  });
});
