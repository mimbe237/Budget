/**
 * Font Optimization avec next/font
 * 
 * @phase Phase 3.2 - Font Optimization
 * @savings
 * - Élimine le flash of unstyled text (FOUT)
 * - Preload automatique des fonts
 * - Self-hosting des Google Fonts (RGPD friendly)
 * - Optimisation du chargement (font-display: swap)
 */

import { Poppins, PT_Sans } from 'next/font/google';

// Font principale (titres, headlines)
export const poppins = Poppins({
  weight: ['400', '600', '700'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-poppins',
  preload: true,
  fallback: ['system-ui', 'arial'],
});

// Font corps de texte
export const ptSans = PT_Sans({
  weight: ['400', '700'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-pt-sans',
  preload: true,
  fallback: ['system-ui', 'arial'],
});
