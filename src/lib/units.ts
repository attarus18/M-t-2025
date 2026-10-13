import { deviceRegion } from '@/i18n/locales';

/**
 * Unita' di misura. OpenWeatherMap risponde sempre in metrico (°C, m/s): la
 * conversione si fa solo per mostrare i numeri. In automatico °F e mph nei paesi
 * che li usano, °C e km/h altrove.
 */
export type Units = 'metric' | 'imperial';
export type UnitsPref = 'auto' | Units;

const IMPERIAL_REGIONS = new Set(['US', 'PR', 'GU', 'VI', 'AS', 'MP', 'UM', 'LR', 'MM', 'BS', 'BZ', 'KY', 'PW', 'FM', 'MH']);

export function resolveUnits(pref: UnitsPref): Units {
  if (pref !== 'auto') return pref;
  const region = deviceRegion();
  return region && IMPERIAL_REGIONS.has(region) ? 'imperial' : 'metric';
}

/** Temperatura da °C all'unita' scelta, arrotondata. */
export function temp(celsius: number, units: Units): number {
  return Math.round(units === 'imperial' ? (celsius * 9) / 5 + 32 : celsius);
}

/** Vento da m/s all'unita' scelta, arrotondato. */
export function speed(ms: number, units: Units): number {
  return Math.round(ms * (units === 'imperial' ? 2.23694 : 3.6));
}

export function speedUnit(units: Units): string {
  return units === 'imperial' ? 'mph' : 'km/h';
}
