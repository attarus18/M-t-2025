import type { Units } from '@/lib/units';
import type { Locale } from './locales';
import it, { type Messages } from './messages/it';

/**
 * Lingua e unita' in uso, leggibili anche fuori da React (errori, notifiche,
 * widget). Le imposta I18nProvider; finche' non ha caricato vale l'italiano.
 */
let state: { locale: Locale; tag: string; messages: Messages; units: Units } = {
  locale: 'it',
  tag: 'it-IT',
  messages: it,
  units: 'metric',
};

export const msg = () => state.messages;
export const currentLocale = () => state.locale;
/** Tag BCP 47 per date e ore (es. "en-GB"). */
export const currentTag = () => state.tag;
export const currentUnits = () => state.units;

export function setCurrent(next: typeof state) {
  state = next;
}
