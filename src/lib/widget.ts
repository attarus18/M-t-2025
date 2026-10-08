'use client';

import { Capacitor, registerPlugin } from '@capacitor/core';
import { CONDITIONS, CONDITION_INFO, pickCondition } from './conditions';
import { chosenAnimal } from './daily-notification';
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

/** Animale cambiato (o acquisti aggiornati): il widget ridisegna con il nuovo animale e le sue frasi. */
export function syncWidgetAnimal() {
  if (!Capacitor.isNativePlatform()) return;
  MeteoWidget.save(animalData()).catch(() => {});
}
