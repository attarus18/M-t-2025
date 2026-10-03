'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  fetchAirQuality,
  fetchCurrent,
  fetchForecast,
  WeatherError,
  type AirQualityIndex,
  type CurrentWeather,
  type Forecast,
} from './weather';
import { getCurrentPosition, LocationError, type SavedCity } from './location';

export interface WeatherBundle {
  current: CurrentWeather;
  forecast: Forecast | null;
  air: AirQualityIndex | null;
  coords: { lat: number; lon: number };
  loadedAt: number;
}

export type WeatherLoadError = { message: string; kind: 'network' | 'gps' | 'key' | 'general' };

/** Cache in memoria per pagina del pager: scorrere tra le citta' e' istantaneo. */
const cache = new Map<string, WeatherBundle>();
const TTL_MS = 10 * 60 * 1000;

async function load(target: 'gps' | SavedCity): Promise<WeatherBundle> {
  const coords = target === 'gps' ? await getCurrentPosition() : { lat: target.lat, lon: target.lon };
  const [current, forecast, air] = await Promise.all([
    fetchCurrent(coords.lat, coords.lon),
    fetchForecast(coords.lat, coords.lon).catch(() => null),
    fetchAirQuality(coords.lat, coords.lon),
  ]);
  return { current, forecast, air, coords, loadedAt: Date.now() };
}

function toError(e: unknown): WeatherLoadError {
  if (e instanceof LocationError) return { message: e.message, kind: 'gps' };
  if (e instanceof WeatherError) {
    return { message: e.message, kind: e.kind === 'notfound' ? 'general' : e.kind };
  }
  return { message: 'Qualcosa è andato storto. Riprova.', kind: 'general' };
}

export function useWeather(target: 'gps' | SavedCity) {
  const key = target === 'gps' ? 'gps' : target.id;
  const [data, setData] = useState<WeatherBundle | null>(() => cache.get(key) ?? null);
  const [error, setError] = useState<WeatherLoadError | null>(null);
  const [loading, setLoading] = useState(false);

  const reload = useCallback(
    async (force = false) => {
      const cached = cache.get(key);
      if (!force && cached && Date.now() - cached.loadedAt < TTL_MS) {
        setData(cached);
        setError(null);
        return;
      }
      setLoading(true);
      try {
        const bundle = await load(target);
        cache.set(key, bundle);
        setData(bundle);
        setError(null);
      } catch (e) {
        setError(toError(e));
      } finally {
        setLoading(false);
      }
    },
    // target cambia identita' a ogni render: conta solo la chiave
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [key],
  );

  useEffect(() => {
    setData(cache.get(key) ?? null);
    reload();
  }, [key, reload]);

  // Tornati online dopo un errore di rete, si riprova da soli.
  useEffect(() => {
    if (error?.kind !== 'network') return;
    const onOnline = () => reload(true);
    window.addEventListener('online', onOnline);
    return () => window.removeEventListener('online', onOnline);
  }, [error, reload]);

  return { data, error, loading, reload };
}
