// Client OpenWeatherMap (piano gratuito: meteo attuale, previsioni 5 giorni / 3 ore,
// qualita' dell'aria, geocoding). L'app e' un export statico, quindi la chiave
// viaggia nel bundle: va usata una chiave dedicata e rigenerabile.
const BASE = 'https://api.openweathermap.org';
const API_KEY = process.env.NEXT_PUBLIC_OWM_API_KEY ?? '';

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

async function get<T>(path: string, params: Record<string, string | number>): Promise<T> {
  if (!API_KEY) throw new WeatherError('Chiave OpenWeatherMap mancante (NEXT_PUBLIC_OWM_API_KEY).', 'key');
  const query = new URLSearchParams({ ...Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)])), appid: API_KEY });
  let res: Response;
  try {
    res = await fetch(`${BASE}${path}?${query}`);
  } catch {
    throw new WeatherError('Nessuna connessione internet. Controlla Wi-Fi o dati.', 'network');
  }
  if (res.status === 401) throw new WeatherError('Chiave OpenWeatherMap non valida o non ancora attiva.', 'key');
  if (res.status === 404) throw new WeatherError('Località non trovata.', 'notfound');
  if (res.status === 429) throw new WeatherError('Troppe richieste, riprova tra un minuto.', 'general');
  if (!res.ok) throw new WeatherError('Servizio meteo non disponibile, riprova.', 'general');
  return res.json() as Promise<T>;
}

const common = { units: 'metric', lang: 'it' };

export function fetchCurrent(lat: number, lon: number) {
  return get<CurrentWeather>('/data/2.5/weather', { lat, lon, ...common });
}

export function fetchForecast(lat: number, lon: number) {
  return get<Forecast>('/data/2.5/forecast', { lat, lon, ...common });
}

export async function fetchAirQuality(lat: number, lon: number): Promise<AirQualityIndex | null> {
  try {
    const data = await get<{ list: { main: { aqi: AirQualityIndex } }[] }>('/data/2.5/air_pollution', { lat, lon });
    return data.list[0]?.main.aqi ?? null;
  } catch {
    return null;
  }
}

export async function searchCities(query: string): Promise<CitySearchResult[]> {
  const data = await get<{ name: string; local_names?: Record<string, string>; country: string; state?: string; lat: number; lon: number }[]>(
    '/geo/1.0/direct',
    { q: query, limit: 5 },
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
