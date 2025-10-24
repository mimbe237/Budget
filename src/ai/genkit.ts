import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
if (!apiKey) {
  // N'expose pas la clé, mais alerte en développement si absente
  console.warn('[AI] GEMINI_API_KEY/GOOGLE_API_KEY manquante. L’analyse IA sera désactivée.');
}

export const aiEnabled = Boolean(apiKey);

export const ai = genkit({
  plugins: [
    googleAI({
      apiKey,
    }),
  ],
  model: 'googleai/gemini-2.5-flash',
});
