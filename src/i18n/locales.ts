/**
 * Lingue dell'app. La prima volta si usa la lingua del telefono (se e' tra queste,
 * altrimenti l'inglese); l'utente puo' sceglierne un'altra in Altro > Lingua.
 */
export const LOCALES = ['it', 'en', 'es', 'pt', 'fr', 'de', 'ja', 'ko', 'id', 'tr'] as const;
export type Locale = (typeof LOCALES)[number];

export const FALLBACK_LOCALE: Locale = 'en';

export const LOCALE_INFO: Record<Locale, { /** nome nella lingua stessa */ name: string; /** tag BCP 47 per date e numeri */ tag: string; /** codice "lang" di OpenWeatherMap */ owm: string }> = {
  it: { name: 'Italiano', tag: 'it-IT', owm: 'it' },
  en: { name: 'English', tag: 'en-US', owm: 'en' },
  es: { name: 'Español', tag: 'es-ES', owm: 'es' },
  pt: { name: 'Português (Brasil)', tag: 'pt-BR', owm: 'pt_br' },
  fr: { name: 'Français', tag: 'fr-FR', owm: 'fr' },
  de: { name: 'Deutsch', tag: 'de-DE', owm: 'de' },
  ja: { name: '日本語', tag: 'ja-JP', owm: 'ja' },
  ko: { name: '한국어', tag: 'ko-KR', owm: 'kr' },
  id: { name: 'Bahasa Indonesia', tag: 'id-ID', owm: 'id' },
  tr: { name: 'Türkçe', tag: 'tr-TR', owm: 'tr' },
};

/** Preferenza salvata: 'auto' segue la lingua del telefono. */
export type LanguagePref = 'auto' | Locale;

function deviceLanguages(): string[] {
  if (typeof navigator === 'undefined') return [];
  return navigator.languages?.length ? [...navigator.languages] : navigator.language ? [navigator.language] : [];
}

/** Prima lingua del telefono tra quelle disponibili, altrimenti l'inglese. */
export function detectLocale(): Locale {
  for (const lang of deviceLanguages()) {
    let base = lang.toLowerCase().split(/[-_]/)[0];
    if (base === 'in') base = 'id'; // vecchio codice Java dell'indonesiano
    if ((LOCALES as readonly string[]).includes(base)) return base as Locale;
  }
  return FALLBACK_LOCALE;
}

export function resolveLocale(pref: LanguagePref): Locale {
  return pref === 'auto' ? detectLocale() : pref;
}

/**
 * Tag per date e ore: se la lingua scelta e' quella del telefono si usa la sua
 * variante regionale (en-GB, es-MX...), altrimenti quella predefinita.
 */
export function localeTag(locale: Locale): string {
  const device = deviceLanguages()[0];
  if (device && device.toLowerCase().split(/[-_]/)[0] === locale) return device;
  return LOCALE_INFO[locale].tag;
}

/** Paese del telefono (es. "US"), dal tag della lingua. */
export function deviceRegion(): string | null {
  for (const lang of deviceLanguages()) {
    const region = lang.split(/[-_]/)[1];
    if (region && /^[A-Za-z]{2}$/.test(region)) return region.toUpperCase();
  }
  return null;
}
