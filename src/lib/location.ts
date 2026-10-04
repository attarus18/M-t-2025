'use client';

import { Capacitor } from '@capacitor/core';
import { KEYS, useStored } from './storage';

export interface SavedCity {
  /** "lat,lon" arrotondati: identifica la citta' senza dipendere dagli ID OpenWeatherMap. */
  id: string;
  name: string;
  country: string;
  lat: number;
  lon: number;
}

export const cityId = (lat: number, lon: number) => `${lat.toFixed(2)},${lon.toFixed(2)}`;

export class LocationError extends Error {
  constructor(
    message: string,
    public kind: 'denied' | 'unavailable' | 'timeout',
  ) {
    super(message);
  }
}

const MESSAGES = {
  denied: 'Permesso di localizzazione negato. Abilitalo dalle impostazioni o cerca una città.',
  unavailable: 'Posizione non disponibile: attiva il GPS o cerca una città a mano.',
  timeout: 'Il GPS non risponde. Spostati all\'aperto o riprova.',
} as const;

/** Posizione attuale: plugin nativo su Android (gestisce i permessi), API del browser sul web. */
export async function getCurrentPosition(): Promise<{ lat: number; lon: number }> {
  if (Capacitor.isNativePlatform()) {
    const { Geolocation } = await import('@capacitor/geolocation');
    try {
      const perm = await Geolocation.checkPermissions();
      if (perm.location !== 'granted' && perm.coarseLocation !== 'granted') {
        const req = await Geolocation.requestPermissions({ permissions: ['coarseLocation'] });
        if (req.location !== 'granted' && req.coarseLocation !== 'granted') {
          throw new LocationError(MESSAGES.denied, 'denied');
        }
      }
      // Per il meteo basta la posizione approssimativa: piu' veloce e consuma meno.
      const pos = await Geolocation.getCurrentPosition({ enableHighAccuracy: false, timeout: 15000, maximumAge: 10 * 60 * 1000 });
      return { lat: pos.coords.latitude, lon: pos.coords.longitude };
    } catch (e) {
      if (e instanceof LocationError) throw e;
      const msg = String((e as Error)?.message ?? e).toLowerCase();
      if (msg.includes('denied') || msg.includes('permission')) throw new LocationError(MESSAGES.denied, 'denied');
      if (msg.includes('timeout')) throw new LocationError(MESSAGES.timeout, 'timeout');
      throw new LocationError(MESSAGES.unavailable, 'unavailable');
    }
  }

  if (!navigator.geolocation) throw new LocationError(MESSAGES.unavailable, 'unavailable');
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      pos => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      err =>
        reject(
          err.code === 1
            ? new LocationError(MESSAGES.denied, 'denied')
            : err.code === 3
              ? new LocationError(MESSAGES.timeout, 'timeout')
              : new LocationError(MESSAGES.unavailable, 'unavailable'),
        ),
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 10 * 60 * 1000 },
    );
  });
}

export function useSavedCities() {
  const [cities, setCities] = useStored<SavedCity[]>(KEYS.favorites, []);
  return {
    cities,
    add: (city: SavedCity) => {
      if (!cities.some(c => c.id === city.id)) setCities([...cities, city]);
    },
    remove: (id: string) => setCities(cities.filter(c => c.id !== id)),
    has: (id: string) => cities.some(c => c.id === id),
  };
}
