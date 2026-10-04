// Client del meteo: passa dal ponte /api/meteo del sito (src/app/api/meteo/route.api.ts),
// che tiene la chiave OpenWeatherMap sul server. Dati del piano gratuito: meteo attuale,
// previsioni 5 giorni / 3 ore, qualita' dell'aria, geocoding.
// Anche l'APK chiama il sito pubblicato; NEXT_PUBLIC_WEATHER_API serve solo per provare
// un ponte diverso (es. http://localhost:9005/api/meteo/ con next dev).
const API = process.env.NEXT_PUBLIC_WEATHER_API || 'https://meteo-zoo.vercel.app/api/meteo/';

export interface WeatherCondition {
  id: number;
  main: string;
  description: string;
  icon: string;
}

export interface CurrentWeather {
  coord: { lon: number; lat: number };
  weather: WeatherCondition[];
  main: {
    temp: number;
    feels_like: number;
    temp_min: number;
    temp_max: number;
    pressure: number;
    humidity: number;
  };
  visibility: number;
  wind: { speed: number; deg: number; gust?: number };
  clouds: { all: number };
  dt: number;
  sys: { country: string; sunrise: number; sunset: number };
  timezone: number;
  id: number;
  name: string;
}

export interface ForecastItem {
  dt: number;
  main: CurrentWeather['main'];
  weather: WeatherCondition[];
  wind: { speed: number; deg: number; gust?: number };
  visibility: number;
  pop: number;
  dt_txt: string;
}

export interface Forecast {
  list: ForecastItem[];
  city: { id: number; name: string; country: string; timezone: number; sunrise: number; sunset: number };
}

/** Indice europeo semplificato di OpenWeatherMap: 1 = ottima ... 5 = pessima. */
export type AirQualityIndex = 1 | 2 | 3 | 4 | 5;

export interface CitySearchResult {
  name: string;
  localName: string;
  country: string;
  state?: string;
  lat: number;
  lon: number;
}

export class WeatherError extends Error {
  constructor(
    message: string,
    public kind: 'network' | 'notfound' | 'key' | 'general',
  ) {
    super(message);
  }
}

type Tipo = 'attuale' | 'previsioni' | 'aria' | 'citta';

/** Coordinate a 2 decimali (~1 km), come le arrotonda il ponte: stessa URL = risposta dalla cache. */
const round = (n: number) => n.toFixed(2);

async function get<T>(tipo: Tipo, params: Record<string, string>): Promise<T> {
  const query = new URLSearchParams({ tipo, ...params });
  let res: Response;
  try {
    res = await fetch(`${API}?${query}`);
  } catch {
    throw new WeatherError('Nessuna connessione internet. Controlla Wi-Fi o dati.', 'network');
  }
  if (res.status === 404) throw new WeatherError('Località non trovata.', 'notfound');
  if (res.status === 429) throw new WeatherError('Troppe richieste, riprova tra un minuto.', 'general');
  if (!res.ok) throw new WeatherError('Servizio meteo non disponibile, riprova.', 'general');
  return res.json() as Promise<T>;
}

export function fetchCurrent(lat: number, lon: number) {
  return get<CurrentWeather>('attuale', { lat: round(lat), lon: round(lon) });
}

export function fetchForecast(lat: number, lon: number) {
  return get<Forecast>('previsioni', { lat: round(lat), lon: round(lon) });
}

export async function fetchAirQuality(lat: number, lon: number): Promise<AirQualityIndex | null> {
  try {
    const data = await get<{ list: { main: { aqi: AirQualityIndex } }[] }>('aria', { lat: round(lat), lon: round(lon) });
    return data.list[0]?.main.aqi ?? null;
  } catch {
    return null;
  }
}

export async function searchCities(query: string): Promise<CitySearchResult[]> {
  const data = await get<{ name: string; local_names?: Record<string, string>; country: string; state?: string; lat: number; lon: number }[]>(
    'citta',
    { q: query },
  );
  return data.map(c => ({
    name: c.name,
    localName: c.local_names?.it ?? c.name,
    country: c.country,
    state: c.state,
    lat: c.lat,
    lon: c.lon,
  }));
}

export const AIR_QUALITY_LABELS: Record<AirQualityIndex, { label: string; color: string }> = {
  1: { label: 'Ottima', color: 'bg-emerald-400' },
  2: { label: 'Buona', color: 'bg-lime-400' },
  3: { label: 'Discreta', color: 'bg-yellow-400' },
  4: { label: 'Scadente', color: 'bg-orange-400' },
  5: { label: 'Pessima', color: 'bg-red-500' },
};

/** Da m/s (OpenWeatherMap in unita' metriche) a km/h. */
export const kmh = (ms: number) => Math.round(ms * 3.6);

/** Previsioni raggruppate per giorno locale della citta', con minima e massima reali. */
export function dailySummary(forecast: Forecast) {
  const offset = forecast.city.timezone;
  const days = new Map<string, ForecastItem[]>();
  for (const item of forecast.list) {
    const key = new Date((item.dt + offset) * 1000).toISOString().slice(0, 10);
    const list = days.get(key) ?? [];
    list.push(item);
    days.set(key, list);
  }
  return [...days.entries()].map(([date, items]) => {
    // Per l'icona del giorno si preferisce la fascia di mezzogiorno.
    const midday =
      items.find(i => new Date((i.dt + offset) * 1000).getUTCHours() >= 11) ?? items[Math.floor(items.length / 2)];
    return {
      date,
      items,
      representative: midday,
      min: Math.min(...items.map(i => i.main.temp_min)),
      max: Math.max(...items.map(i => i.main.temp_max)),
      pop: Math.max(...items.map(i => i.pop)),
    };
  });
}
