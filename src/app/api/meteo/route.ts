/**
 * Ponte verso OpenWeatherMap: la chiave (OWM_API_KEY) resta sul server e non
 * finisce ne' nel sito ne' nell'APK. Attivo solo nella versione su Vercel: la
 * build statica per l'APK (scripts/build-static.mjs) lascia fuori questa route.
 *
 * GET /api/meteo?tipo=attuale|previsioni|aria&lat=..&lon=..
 * GET /api/meteo?tipo=citta&q=..
 *
 * Le risposte restano nella cache CDN di Vercel (stessa URL = una sola chiamata
 * a OpenWeatherMap ogni 10 minuti) e ogni IP ha un limite di richieste.
 */
const BASE = 'https://api.openweathermap.org';

const ENDPOINTS = {
  attuale: { path: '/data/2.5/weather', cache: 600, extra: { units: 'metric', lang: 'it' } },
  previsioni: { path: '/data/2.5/forecast', cache: 1800, extra: { units: 'metric', lang: 'it' } },
  aria: { path: '/data/2.5/air_pollution', cache: 1800, extra: {} },
  citta: { path: '/geo/1.0/direct', cache: 86400, extra: { limit: '5' } },
} as const;
type Tipo = keyof typeof ENDPOINTS;

// Limite per IP (per istanza della funzione: un freno agli abusi, la vera
// protezione della quota e' la cache CDN).
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 60;
const hits = new Map<string, { count: number; start: number }>();

function rateLimited(ip: string) {
  const now = Date.now();
  const entry = hits.get(ip);
  if (!entry || now - entry.start > WINDOW_MS) {
    hits.set(ip, { count: 1, start: now });
    if (hits.size > 5000) hits.clear();
    return false;
  }
  entry.count++;
  return entry.count > MAX_PER_WINDOW;
}

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
};

function reply(status: number, body: unknown, cacheSeconds = 0) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...CORS,
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': cacheSeconds
        ? `public, max-age=60, s-maxage=${cacheSeconds}, stale-while-revalidate=${cacheSeconds}`
        : 'no-store',
    },
  });
}

/** Coordinate a 2 decimali (~1 km): piu' richieste finiscono sulla stessa voce di cache. */
function coord(value: string | null, limit: number) {
  const n = Number(value);
  if (value === null || value === '' || !Number.isFinite(n) || Math.abs(n) > limit) return null;
  return n.toFixed(2);
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS });
}

export async function GET(request: Request) {
  const key = process.env.OWM_API_KEY;
  if (!key) return reply(500, { errore: 'Servizio meteo non configurato.' });

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'sconosciuto';
  if (rateLimited(ip)) return reply(429, { errore: 'Troppe richieste.' });

  const url = new URL(request.url);
  const tipo = url.searchParams.get('tipo') as Tipo | null;
  if (!tipo || !(tipo in ENDPOINTS)) return reply(400, { errore: 'Parametro tipo non valido.' });
  const endpoint = ENDPOINTS[tipo];

  const params = new URLSearchParams(endpoint.extra);
  if (tipo === 'citta') {
    const q = url.searchParams.get('q')?.trim() ?? '';
    if (q.length < 2 || q.length > 80) return reply(400, { errore: 'Ricerca non valida.' });
    params.set('q', q);
  } else {
    const lat = coord(url.searchParams.get('lat'), 90);
    const lon = coord(url.searchParams.get('lon'), 180);
    if (lat === null || lon === null) return reply(400, { errore: 'Coordinate non valide.' });
    params.set('lat', lat);
    params.set('lon', lon);
  }
  params.set('appid', key);

  let res: Response;
  try {
    res = await fetch(`${BASE}${endpoint.path}?${params}`, { cache: 'no-store' });
  } catch {
    return reply(502, { errore: 'Servizio meteo non raggiungibile.' });
  }
  // Gli errori della chiave non si mostrano ai client: per loro e' un guasto del servizio.
  if (res.status === 401) return reply(503, { errore: 'Servizio meteo non disponibile.' });
  if (!res.ok) return reply(res.status === 404 ? 404 : 502, { errore: 'Servizio meteo non disponibile.' });
  return reply(200, await res.json(), endpoint.cache);
}
