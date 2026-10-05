'use client';

import { Capacitor } from '@capacitor/core';
import { DEFAULT_ANIMAL, getAnimal, pickPhrase } from './animals';
import { CONDITION_INFO, pickCondition } from './conditions';
import type { SavedCity } from './location';
import { ALL_PACKS_PRODUCT, getPack } from './packs';
import { KEYS, getStored, setStored } from './storage';
import { dailySummary, fetchForecast } from './weather';

/**
 * Notifica giornaliera con il meteo del giorno, raccontato dall'animale scelto.
 * Non c'e' un server: a ogni apertura (o ritorno) dell'app si scaricano le
 * previsioni a 5 giorni dell'ultima posizione e si programmano notifiche locali
 * per i prossimi giorni, all'ora scelta. Se l'app resta chiusa per piu' di 5
 * giorni le notifiche si fermano fino alla prossima apertura.
 */
export interface DailyNotificationSettings {
  enabled: boolean;
  hour: number;
  minute: number;
}

export const DEFAULT_DAILY_NOTIFICATION: DailyNotificationSettings = { enabled: false, hour: 8, minute: 0 };

/** Ultima posizione GPS riuscita, salvata da useWeather. */
export interface LastPosition {
  lat: number;
  lon: number;
  name: string;
}

const FIRST_ID = 7001;
const DAYS = 5;

export function getDailyNotificationSettings() {
  return getStored<DailyNotificationSettings>(KEYS.dailyNotification, DEFAULT_DAILY_NOTIFICATION);
}

export function saveLastPosition(position: LastPosition) {
  setStored(KEYS.lastPosition, position);
}

/** Chiede il permesso per le notifiche (Android 13+). Ritorna true se concesso. */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return false;
  const { LocalNotifications } = await import('@capacitor/local-notifications');
  let perm = await LocalNotifications.checkPermissions();
  if (perm.display !== 'granted') perm = await LocalNotifications.requestPermissions();
  return perm.display === 'granted';
}

/** Animale da usare fuori da React: quello scelto, se il suo pacchetto risulta acquistato. */
function chosenAnimal() {
  const animal = getAnimal(getStored<string>(KEYS.animal, DEFAULT_ANIMAL));
  const productId = getPack(animal.pack).productId;
  if (!productId) return animal;
  const owned = getStored<string[]>(KEYS.purchasesCache, []);
  return owned.includes(productId) || owned.includes(ALL_PACKS_PRODUCT) ? animal : getAnimal(DEFAULT_ANIMAL);
}

/** Posizione per le previsioni: l'ultima GPS, altrimenti la prima citta' salvata. */
function targetPosition(): LastPosition | null {
  const last = getStored<LastPosition | null>(KEYS.lastPosition, null);
  if (last) return last;
  const first = getStored<SavedCity[]>(KEYS.favorites, [])[0];
  return first ? { lat: first.lat, lon: first.lon, name: first.name } : null;
}

let running: Promise<void> | null = null;

/** Riprogramma (o cancella) le notifiche dei prossimi giorni. Sicura da chiamare spesso. */
export function scheduleDailyWeather(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return Promise.resolve();
  running ??= doSchedule()
    .catch(() => {
      // offline o permesso revocato: restano le notifiche gia' programmate
    })
    .finally(() => {
      running = null;
    });
  return running;
}

type Day = ReturnType<typeof dailySummary>[number];

/** Titolo e testo della notifica per un giorno di previsioni. */
function message(day: Day, city: string) {
  const animal = chosenAnimal();
  const item = day.representative;
  const condition = pickCondition({ weather: item.weather[0], temp: item.main.temp, windMs: item.wind.speed, gustMs: item.wind.gust });
  const info = CONDITION_INFO[condition];
  const rain = day.pop >= 0.3 ? ` · pioggia ${Math.round(day.pop * 100)}%` : '';
  return {
    title: `${info.emoji} ${city}: ${info.label}, ${Math.round(day.min)}°/${Math.round(day.max)}°${rain}`,
    body: `${animal.emoji} ${animal.name}: «${pickPhrase(animal, condition, `notifica-${day.date}`)}»`,
  };
}

/** Manda subito la notifica di oggi, per vedere com'e'. Ritorna un messaggio d'errore o null. */
export async function sendTestNotification(): Promise<string | null> {
  if (!Capacitor.isNativePlatform()) return "Disponibile nell'app per Android.";
  const position = targetPosition();
  if (!position) return 'Apri prima il meteo della tua posizione.';
  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    const forecast = await fetchForecast(position.lat, position.lon);
    const today = dailySummary(forecast)[0];
    await LocalNotifications.schedule({
      notifications: [
        { id: FIRST_ID + 99, ...message(today, forecast.city.name || position.name), schedule: { at: new Date(Date.now() + 3000) }, isExactNotification: false },
      ],
    });
    return null;
  } catch {
    return 'Prova non riuscita: controlla la connessione.';
  }
}

async function doSchedule() {
  const { LocalNotifications } = await import('@capacitor/local-notifications');
  const settings = getDailyNotificationSettings();
  const pending = await LocalNotifications.getPending();
  const ours = pending.notifications.filter(n => n.id >= FIRST_ID && n.id < FIRST_ID + DAYS + 1);

  if (!settings.enabled) {
    if (ours.length) await LocalNotifications.cancel({ notifications: ours.map(n => ({ id: n.id })) });
    return;
  }
  const perm = await LocalNotifications.checkPermissions();
  if (perm.display !== 'granted') return;

  const position = targetPosition();
  if (!position) return;
  const forecast = await fetchForecast(position.lat, position.lon);
  const city = forecast.city.name || position.name;

  const now = Date.now();
  const notifications = dailySummary(forecast)
    .map((day, i) => {
      const [y, m, d] = day.date.split('-').map(Number);
      const at = new Date(y, m - 1, d, settings.hour, settings.minute);
      // Orario non esatto: niente richiesta del permesso "Sveglie e promemoria" (vedi AndroidManifest).
      return { id: FIRST_ID + i, ...message(day, city), schedule: { at, allowWhileIdle: true }, isExactNotification: false };
    })
    .filter(n => n.schedule.at.getTime() > now + 60_000)
    .slice(0, DAYS);

  if (ours.length) await LocalNotifications.cancel({ notifications: ours.map(n => ({ id: n.id })) });
  if (notifications.length) await LocalNotifications.schedule({ notifications });
}
