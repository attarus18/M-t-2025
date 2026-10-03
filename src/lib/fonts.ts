import { Fredoka, Nunito } from 'next/font/google';

// next/font scarica i font in fase di build e li include nel bundle: funzionano offline.
export const bodyFont = Nunito({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-body',
  display: 'swap',
});

/** Font tondo e giocoso per titoli, temperatura e frasi degli animali. */
export const funFont = Fredoka({
  subsets: ['latin', 'latin-ext'],
  weight: ['500', '600', '700'],
  variable: '--font-fun',
  display: 'swap',
});
