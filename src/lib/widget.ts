'use client';

import { Capacitor, registerPlugin } from '@capacitor/core';
import { CONDITIONS, CONDITION_INFO, pickCondition } from './conditions';
import { chosenAnimal } from './daily-notification';
import type { SavedCity } from './location';
import { KEYS, getStored } from './storage';
import { pickPhrase } from './animals';
import { dailySummary, type CurrentWeather, type Forecast } from './weather';
import { currentLocale, currentUnits, msg } from '@/i18n/current';
import { LOCALE_INFO } from '@/i18n/locales';

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
    /** Frase mostrata nella home per questa scena, oggi. */
    phrase?: string;
    /** Temperature in °F (il widget le riceve e le scarica sempre in °C). */
    imperial?: boolean;
    /** Testi del widget senza meteo, nella lingua dell'app. */
    openApp?: string;
    openAppShort?: string;
    /** Codice lingua di OpenWeatherMap per il meteo che il widget scarica da solo. */
    owmLang?: string;
    weather?: { temp: number; min: number; max: number; cond: string };
  }): Promise<void>;
}

const MeteoWidget = registerPlugin<MeteoWidgetPlugin>('MeteoWidget');

/** Animale, frasi, etichette e testi nella lingua in uso (si rimandano a ogni cambio di lingua). */
function animalData() {
  const animal = chosenAnimal();
  const t = msg();
  return {
    animal: animal.id,
    phrases: JSON.stringify(animal.phrases),
    labels: JSON.stringify(Object.fromEntries(CONDITIONS.map(c => [c, CONDITION_INFO[c].label]))),
    imperial: currentUnits() === 'imperial',
    openApp: t.widget.openApp,
    openAppShort: t.widget.openAppShort,
    owmLang: LOCALE_INFO[currentLocale()].owm,
  };
}

/**
 * Meteo della posizione appena scaricato: il widget si aggiorna subito e mostra gli
 * stessi numeri e la stessa frase della home (minima e massima della giornata dalle
 * previsioni, non quelle del meteo attuale).
 */
export function syncWidgetWeather(coords: { lat: number; lon: number }, current: CurrentWeather, forecast: Forecast | null) {
  if (!Capacitor.isNativePlatform()) return;
  const cond = pickCondition({
    weather: current.weather[0],
    temp: current.main.temp,
    windMs: current.wind.speed,
    gustMs: current.wind.gust,
  });
  const today = forecast ? dailySummary(forecast)[0] : undefined;
  const temp = current.main.temp;
  MeteoWidget.save({
    ...coords,
    city: current.name,
    ...animalData(),
    phrase: pickPhrase(chosenAnimal(), cond, `${current.id}`),
    weather: {
      temp,
      min: Math.min(today?.min ?? current.main.temp_min, temp),
      max: Math.max(today?.max ?? current.main.temp_max, temp),
      cond,
    },
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
