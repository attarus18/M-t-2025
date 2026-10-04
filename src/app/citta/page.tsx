'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, MapPin, Navigation, Search, Trash2 } from 'lucide-react';
import { cityId, useSavedCities } from '@/lib/location';
import { KEYS, setStored } from '@/lib/storage';
import { searchCities, WeatherError, type CitySearchResult } from '@/lib/weather';

export default function CitiesPage() {
  const router = useRouter();
  const { cities, add, remove } = useSavedCities();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<CitySearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // Ricerca con un piccolo ritardo, per non chiamare l'API a ogni lettera.
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      setMessage(null);
      setSearching(false);
      return;
    }
    setSearching(true);
    const timer = setTimeout(async () => {
      try {
        const found = await searchCities(q);
        setResults(found);
        setMessage(found.length ? null : 'Nessuna città trovata.');
      } catch (e) {
        setResults([]);
        setMessage(e instanceof WeatherError ? e.message : 'Ricerca non riuscita.');
      } finally {
        setSearching(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [query]);

  const open = (id: string) => {
    setStored(KEYS.currentCity, id);
    router.push('/');
  };

  const choose = (r: CitySearchResult) => {
    const id = cityId(r.lat, r.lon);
    add({ id, name: r.localName, country: r.country, lat: r.lat, lon: r.lon });
    open(id);
  };

  return (
    <div className="space-y-5">
      <h1 className="font-fun text-3xl font-bold drop-shadow">Città</h1>

      <div className="glass flex items-center gap-2 rounded-2xl px-4">
        <Search className="h-5 w-5 opacity-70" />
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Cerca una città..."
          className="h-12 flex-1 bg-transparent font-semibold placeholder:text-white/60 focus:outline-none"
          autoComplete="off"
          enterKeyHint="search"
        />
        {searching && <Loader2 className="h-4 w-4 animate-spin" />}
      </div>

      {(results.length > 0 || message) && (
        <div className="glass overflow-hidden rounded-2xl">
          {message && <p className="p-4 text-sm opacity-80">{message}</p>}
          {results.map(r => (
            <button
              key={`${r.lat},${r.lon}`}
              onClick={() => choose(r)}
              className="flex w-full items-center gap-3 border-b border-white/10 px-4 py-3 text-left last:border-0 active:bg-white/10"
            >
              <MapPin className="h-4 w-4 shrink-0 opacity-70" />
              <span>
                <span className="font-bold">{r.localName}</span>
                <span className="block text-xs opacity-70">{[r.state, r.country].filter(Boolean).join(', ')}</span>
              </span>
            </button>
          ))}
        </div>
      )}

      <section className="space-y-2">
        <h2 className="text-[11px] font-bold uppercase tracking-widest opacity-75">Le tue città</h2>
        <button
          onClick={() => open('gps')}
          className="glass flex w-full items-center gap-3 rounded-2xl px-4 py-3.5 text-left active:scale-[0.98]"
        >
          <Navigation className="h-4 w-4 fill-current" />
          <span className="font-bold">Posizione attuale</span>
        </button>
        {cities.map(c => (
          <div key={c.id} className="glass flex items-center gap-3 rounded-2xl px-4 py-1.5">
            <button onClick={() => open(c.id)} className="flex flex-1 items-center gap-3 py-2 text-left">
              <MapPin className="h-4 w-4 opacity-70" />
              <span className="font-bold">{c.name}</span>
              <span className="text-xs opacity-60">{c.country}</span>
            </button>
            <button onClick={() => remove(c.id)} className="rounded-full p-2 active:bg-white/15" aria-label={`Rimuovi ${c.name}`}>
              <Trash2 className="h-4 w-4 opacity-80" />
            </button>
          </div>
        ))}
        {cities.length === 0 && (
          <p className="px-1 text-sm opacity-75">
            Cerca una città per aggiungerla: poi scorri a destra e sinistra nella schermata Meteo.
          </p>
        )}
      </section>
    </div>
  );
}
