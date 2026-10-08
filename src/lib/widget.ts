'use client';

import { Capacitor, registerPlugin } from '@capacitor/core';
import { CONDITIONS, CONDITION_INFO, pickCondition } from './conditions';
import { chosenAnimal } from './daily-notification';
import type { SavedCity } from './location';
import { KEYS, getStored } from './storage';
import type { CurrentWeather } from './weather';

/**
 * Widget della schermata home (android/.../MeteoWidgetProvider.java).
 * L'app gli passa cio' che conosce solo lei: posizione, animale scelto con le sue
 * frasi, etichette delle scene e il meteo appena scaricato. Poi il widget si
 * aggiorna da solo ogni ~30 minuti dal ponte /api/meteo.
 */
interface MeteoWidgetPlugin {
  save(data: {
    lat?: number;
    lon?: number;
    city?: string;
    animal?: string;
    phrases?: string;
    labels?: string;
    weather?: { temp: number; min: number; max: number; cond: string };
  }): Promise<void>;
}

const MeteoWidget = registerPlugin<MeteoWidgetPlugin>('MeteoWidget');

const LABELS = JSON.stringify(Object.fromEntries(CONDITIONS.map(c => [c, CONDITION_INFO[c].label])));

function animalData() {
  const animal = chosenAnimal();
  return { animal: animal.id, phrases: JSON.stringify(animal.phrases), labels: LABELS };
}

/** Meteo della posizione appena scaricato: il widget si aggiorna subito. */
export function syncWidgetWeather(coords: { lat: number; lon: number }, current: CurrentWeather) {
  if (!Capacitor.isNativePlatform()) return;
  const cond = pickCondition({
    weather: current.weather[0],
    temp: current.main.temp,
    windMs: current.wind.speed,
    gustMs: current.wind.gust,
  });
  MeteoWidget.save({
    ...coords,
    city: current.name,
    ...animalData(),
    weather: { temp: current.main.temp, min: current.main.temp_min, max: current.main.temp_max, cond },
  }).catch(() => {});
}

/** Posizione per il widget: l'ultima GPS, altrimenti la prima citta' salvata. */
function knownPosition() {
  const last = getStored<{ lat: number; lon: number; name: string } | null>(KEYS.lastPosition, null);
  if (last) return { lat: last.lat, lon: last.lon, city: last.name };
  const first = getStored<SavedCity[]>(KEYS.favorites, [])[0];
  return first ? { lat: first.lat, lon: first.lon, city: first.name } : {};
}

/**
 * All'avvio, al ritorno nell'app e quando cambia l'animale: il widget riceve animale,
 * frasi e l'ultima posizione nota. Se non ha ancora il meteo (o e' vecchio) lo scarica
 * da solo, cosi' funziona anche quando il GPS dell'app non risponde.
 */
export function syncWidgetAnimal() {
  if (!Capacitor.isNativePlatform()) return;
  MeteoWidget.save({ ...knownPosition(), ...animalData() }).catch(() => {});
}
