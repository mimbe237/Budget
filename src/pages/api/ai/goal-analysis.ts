import type { NextApiRequest, NextApiResponse } from 'next';
import { ai, aiEnabled } from '@/ai/genkit';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!aiEnabled) return res.status(503).json({ error: 'AI not enabled' });
  try {
    const { goal, transactions, userProfile } = JSON.parse(req.body || '{}');
    // Prompt enrichi avec l’historique
    const prompt = `Voici un objectif financier :\n${JSON.stringify(goal)}\nVoici l’historique des apports :\n${JSON.stringify(transactions)}\nProfil utilisateur : ${JSON.stringify(userProfile)}\nAnalyse la progression, détecte les difficultés, donne un conseil personnalisé pour atteindre l’objectif plus vite, et propose un message de motivation.`;
    const result = await ai.generate({ prompt });
    res.status(200).json({ analysis: result.text });
  } catch (e) {
    res.status(500).json({ error: 'AI analysis failed' });
  }
}
