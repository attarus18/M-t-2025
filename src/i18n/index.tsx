'use client';

import { Fragment, useEffect, useState, type ReactNode } from 'react';
import { ALL_ANIMALS } from '@/lib/animals';
import { CONDITIONS, CONDITION_INFO, type ConditionId } from '@/lib/conditions';
import { PACKS } from '@/lib/packs';
import { KEYS, useStored } from '@/lib/storage';
import { resolveUnits, speed, speedUnit, temp, type UnitsPref } from '@/lib/units';
import { clearWeatherCache } from '@/lib/use-weather';
import { currentLocale, currentTag, currentUnits, msg, setCurrent } from './current';
import { localeTag, resolveLocale, type LanguagePref, type Locale } from './locales';
import type { Messages } from './messages/it';

export { msg, currentLocale, currentTag, currentUnits } from './current';

/** Nomi, descrizioni e frasi degli animali in una lingua (src/i18n/animals/<lingua>.ts). */
export type AnimalTexts = Record<
  string,
  { name: string; tagline: string; phrases: Partial<Record<ConditionId, string[]>> }
>;

// I testi italiani sono quelli scritti in animals.ts: si conservano prima di sovrascriverli.
const ITALIAN = new Map(ALL_ANIMALS.map(a => [a.id, { name: a.name, tagline: a.tagline, phrases: { ...a.phrases } }]));

async function loadLocale(locale: Locale): Promise<{ messages: Messages; animals: AnimalTexts | null }> {
  const [messages, animals] = await Promise.all([
    import(`./messages/${locale}`).then(m => m.default as Messages),
    locale === 'it' ? null : import(`./animals/${locale}`).then(m => m.default as AnimalTexts),
  ]);
  return { messages, animals };
}

/**
 * Animali, pacchetti e scene sono dati condivisi da tutta l'app (anche fuori da
 * React): si traducono sul posto. Cio' che manca in una lingua resta in italiano.
 */
function applyTexts(messages: Messages, animals: AnimalTexts | null) {
  for (const animal of ALL_ANIMALS) {
    const base = ITALIAN.get(animal.id)!;
    const local = animals?.[animal.id];
    animal.name = local?.name ?? base.name;
    animal.tagline = local?.tagline ?? base.tagline;
    animal.phrases = { ...base.phrases };
    for (const c of CONDITIONS) if (local?.phrases[c]?.length) animal.phrases[c] = local.phrases[c]!;
  }
  for (const pack of PACKS) Object.assign(pack, messages.packs[pack.id]);
  for (const c of CONDITIONS) CONDITION_INFO[c].label = messages.conditions[c].label;
}

/**
 * Carica la lingua scelta (o quella del telefono) prima di mostrare l'app e la
 * ricarica quando cambia: i figli vengono ricreati, cosi' ogni testo si aggiorna.
 */
export function I18nProvider({ children }: { children: ReactNode }) {
  const [languagePref] = useStored<LanguagePref>(KEYS.language, 'auto');
  const [unitsPref] = useStored<UnitsPref>(KEYS.units, 'auto');
  const [ready, setReady] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const locale = resolveLocale(languagePref);
    const units = resolveUnits(unitsPref);
    loadLocale(locale)
      .catch(() => loadLocale('en'))
      .then(({ messages, animals }) => {
        if (cancelled) return;
        const changed = ready !== null && currentLocale() !== locale;
        applyTexts(messages, animals);
        setCurrent({ locale, tag: localeTag(locale), messages, units });
        document.documentElement.lang = locale;
        // Le descrizioni del meteo arrivano gia' tradotte da OpenWeatherMap: vanno riscaricate.
        if (changed) clearWeatherCache();
        setReady(`${locale}:${units}`);
      });
    return () => {
      cancelled = true;
    };
    // `ready` serve solo a capire se e' un cambio di lingua, non deve riavviare il caricamento
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [languagePref, unitsPref]);

  if (!ready) return null;
  return <Fragment key={ready}>{children}</Fragment>;
}

/** Testi e formati della lingua in uso, con le preferenze modificabili. */
export function useI18n() {
  const [languagePref, setLanguagePref] = useStored<LanguagePref>(KEYS.language, 'auto');
  const [unitsPref, setUnitsPref] = useStored<UnitsPref>(KEYS.units, 'auto');
  const units = currentUnits();
  return {
    t: msg(),
    locale: currentLocale(),
    tag: currentTag(),
    languagePref,
    setLanguagePref,
    unitsPref,
    setUnitsPref,
    units,
    /** "23°" nell'unita' scelta, da °C. */
    deg: (celsius: number) => `${temp(celsius, units)}°`,
    /** Solo il numero della temperatura, da °C. */
    temp: (celsius: number) => temp(celsius, units),
    /** Velocita' del vento nell'unita' scelta, da m/s. */
    speed: (ms: number) => speed(ms, units),
    speedUnit: speedUnit(units),
  };
}
