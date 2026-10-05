'use client';

import { useSyncExternalStore } from 'react';

/**
 * Piccolo store su localStorage con notifica ai componenti in ascolto.
 * Nella WebView di Capacitor i dati restano sul dispositivo finche' l'app
 * non viene disinstallata o non se ne cancellano i dati.
 */
const listeners = new Map<string, Set<() => void>>();
const cache = new Map<string, unknown>();

function read<T>(key: string, fallback: T): T {
  if (cache.has(key)) return cache.get(key) as T;
  let value = fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (raw != null) value = JSON.parse(raw) as T;
  } catch {
    // storage non disponibile o JSON corrotto: si riparte dal default
  }
  cache.set(key, value);
  return value;
}

export function getStored<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  return read(key, fallback);
}

export function setStored<T>(key: string, value: T) {
  cache.set(key, value);
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // quota piena o storage bloccato: il valore resta almeno in memoria
  }
  listeners.get(key)?.forEach(l => l());
}

export function useStored<T>(key: string, fallback: T): [T, (value: T) => void] {
  const value = useSyncExternalStore(
    onChange => {
      let set = listeners.get(key);
      if (!set) listeners.set(key, (set = new Set()));
      set.add(onChange);
      return () => set!.delete(onChange);
    },
    () => read(key, fallback),
    () => fallback,
  );
  return [value, (next: T) => setStored(key, next)];
}

export const KEYS = {
  favorites: 'pa-favorites',
  animal: 'pa-animal',
  /** ID dei prodotti acquistati (cache per l'avvio e l'uso offline). */
  purchasesCache: 'pa-purchases-cache',
  refreshCount: 'pa-refresh-count',
  /** Pagina del pager meteo: 'gps' oppure l'id di una citta' salvata. */
  currentCity: 'pa-current-city',
  /** Notifica giornaliera col meteo: attiva e ora (vedi daily-notification.ts). */
  dailyNotification: 'pa-daily-notification',
  /** Ultima posizione GPS riuscita, usata per le previsioni della notifica. */
  lastPosition: 'pa-last-position',
} as const;
