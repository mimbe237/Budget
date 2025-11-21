import type { NextApiRequest, NextApiResponse } from 'next';
import { ai, aiEnabled } from '@/ai/genkit';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!aiEnabled) return res.status(503).json({ error: 'AI not enabled' });
  try {
    const { prompt, userProfile } = JSON.parse(req.body || '{}');
    // Prompt enrichi avec le profil utilisateur
    const fullPrompt = `${prompt}\nProfil utilisateur: ${JSON.stringify(userProfile)}`;
    const result = await ai.generate({ prompt: fullPrompt });
    // On attend une réponse structurée: { name, amount, date }
    let name = '', amount = '', date = '';
    if (typeof result.text === 'string') {
      // Extraction naïve (à améliorer selon le format de l’IA)
      const match = result.text.match(/Nom: (.*)\nMontant: (\d+)\nDate: (\d{4}-\d{2}-\d{2})/);
      if (match) {
        name = match[1];
        amount = match[2];
        date = match[3];
      }
    }
    res.status(200).json({ name, amount, date });
  } catch (e) {
    res.status(500).json({ error: 'AI suggestion failed' });
  }
}
