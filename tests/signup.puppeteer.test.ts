import puppeteer from 'puppeteer';

// Ce test vérifie que la page /signup charge, que le formulaire étape 1 est interactif,
// et que le clic sur "Continuer" passe à l'étape 2 où les champs de préférences apparaissent.

describe('Signup page (Puppeteer)', () => {
  let browser: puppeteer.Browser;
  let page: puppeteer.Page;

  const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:9002';

  beforeAll(async () => {
    browser = await puppeteer.launch({ headless: 'new' as any });
    page = await browser.newPage();
    page.setDefaultTimeout(20000);
  });

  afterAll(async () => {
    await browser.close();
  });

  it('should render step 1 and navigate to step 2', async () => {
    await page.goto(`${BASE_URL}/signup`, { waitUntil: 'networkidle2' });

    // Champs étape 1
    await page.waitForSelector('input#firstName');
    await page.waitForSelector('input#lastName');
    await page.waitForSelector('input#email');

    // Saisir des valeurs valides
    await page.type('input#firstName', 'Jean');
    await page.type('input#lastName', 'Dupont');
    await page.type('input#email', 'jean.dupont@example.com');

    // Le champ password n'a pas d'id (composant custom), on cible par placeholder
    await page.type('input[placeholder="Créer un mot de passe sécurisé"]', 'StrongP@ssw0rd');

    // Cliquer sur Continuer
    await page.click('button:has-text("Continuer")');

    // Attendre que le texte de l'étape 2 apparaisse
    await page.waitForSelector('label:text("Pays de résidence *")', { timeout: 10000 }).catch(()=>{});

    // Vérifier un élément de l'étape 2 (par exemple le label de la langue)
    const step2Visible = await page.$eval('body', (el) => el.textContent?.includes('Langue préférée *'));
    expect(step2Visible).toBeTruthy();
  });
});
