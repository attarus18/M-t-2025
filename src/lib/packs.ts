/**
 * Pacchetti di animali. "base" e' gratis; gli altri sono acquisti a vita su
 * Google Play (prodotti in-app "non consumabili"), piu' "Tutti i pacchetti"
 * che sblocca anche quelli che usciranno in futuro.
 *
 * Gli ID prodotto vanno creati identici in Play Console > Monetizza con Google
 * Play > Prodotti in-app.
 */
export type PackId = 'base' | 'fattoria' | 'mare' | 'bosco' | 'casa' | 'esotici';

export interface Pack {
  id: PackId;
  name: string;
  emoji: string;
  tagline: string;
  /** null = gratis */
  productId: string | null;
}

export const PACKS: Pack[] = [
  { id: 'base', name: 'Base', emoji: '🏠', tagline: 'Gratis per tutti', productId: null },
  {
    id: 'fattoria',
    name: 'Fattoria',
    emoji: '🐮',
    tagline: 'Muggiti, grugniti e previsioni genuine',
    productId: 'pa_pack_fattoria',
  },
  {
    id: 'mare',
    name: 'Mare e Polo',
    emoji: '🌊',
    tagline: 'Meteo con le pinne',
    productId: 'pa_pack_mare',
  },
  {
    id: 'bosco',
    name: 'Bosco e Stagno',
    emoji: '🌳',
    tagline: 'Previsioni tra le foglie',
    productId: 'pa_pack_bosco',
  },
  {
    id: 'casa',
    name: 'Amici di casa',
    emoji: '🐶',
    tagline: 'Il meteo dal divano',
    productId: 'pa_pack_casa',
  },
  {
    id: 'esotici',
    name: 'Esotici',
    emoji: '🌍',
    tagline: 'Meteo dal resto del mondo',
    productId: 'pa_pack_esotici',
  },
];

/** Sblocca tutti i pacchetti, anche quelli futuri. */
export const ALL_PACKS_PRODUCT = 'pa_pack_tutti';

export const PAID_PRODUCT_IDS = [...PACKS.flatMap(p => (p.productId ? [p.productId] : [])), ALL_PACKS_PRODUCT];

export function getPack(id: PackId): Pack {
  return PACKS.find(p => p.id === id) ?? PACKS[0];
}
