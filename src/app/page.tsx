'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { Heart, Navigation, Plus, RefreshCw } from 'lucide-react';
import { WeatherView } from '@/components/weather-view';
import { usePurchases } from '@/context/purchases-context';
import { onBrowseForAds } from '@/lib/ads';
import { cityId, useSavedCities, type SavedCity } from '@/lib/location';
import { KEYS, useStored } from '@/lib/storage';
import { useAnimal } from '@/lib/use-animal';
import { useWeather } from '@/lib/use-weather';
import { cn } from '@/lib/utils';

export default function HomePage() {
  const { cities, add, remove, has } = useSavedCities();
  const { animal } = useAnimal();
  const { hasPurchased } = usePurchases();
  const [currentId, setCurrentId] = useStored<string>(KEYS.currentCity, 'gps');

  const pages: ('gps' | SavedCity)[] = ['gps', ...cities];
  const index = Math.max(0, pages.findIndex(p => (p === 'gps' ? 'gps' : p.id) === currentId));
  const target = pages[index];
  const { data, error, loading, reload } = useWeather(target);

  const goTo = (i: number) => {
    const next = pages[i];
    if (!next) return;
    setCurrentId(next === 'gps' ? 'gps' : next.id);
    if (!hasPurchased) onBrowseForAds();
  };

  // Swipe orizzontale tra le citta'
  const touch = useRef<{ x: number; y: number } | null>(null);
  const onTouchStart = (e: React.TouchEvent) => {
    touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (!touch.current) return;
    const dx = e.changedTouches[0].clientX - touch.current.x;
    const dy = e.changedTouches[0].clientY - touch.current.y;
    touch.current = null;
    // Solo gesti chiaramente orizzontali, per non disturbare lo scroll verticale e quello delle ore.
    if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
    if ((e.target as HTMLElement).closest('.overflow-x-auto')) return;
    goTo(dx < 0 ? index + 1 : index - 1);
  };

  // Una citta' salvata rimossa altrove: si torna alla posizione attuale.
  useEffect(() => {
    if (currentId !== 'gps' && !cities.some(c => c.id === currentId)) setCurrentId('gps');
  }, [cities, currentId, setCurrentId]);

  const saved =
    data && (target === 'gps' ? has(cityId(data.coords.lat, data.coords.lon)) : true);
  const toggleSaved = () => {
    if (!data) return;
    if (target !== 'gps') {
      remove(target.id);
      return;
    }
    const id = cityId(data.coords.lat, data.coords.lon);
    if (has(id)) remove(id);
    else add({ id, name: data.current.name, country: data.current.sys.country, lat: data.coords.lat, lon: data.coords.lon });
  };

  const title = target === 'gps' ? data?.current.name ?? 'Posizione attuale' : target.name;

  return (
    <div onTouchStart={onTouchStart} onTouchEnd={onTouchEnd} className="min-h-[70vh]">
      <header className="flex items-center justify-between">
        <button
          onClick={() => reload(true)}
          className="rounded-full p-2 active:bg-white/15"
          aria-label="Aggiorna"
        >
          <RefreshCw className={cn('h-5 w-5', loading && 'animate-spin')} />
        </button>
        <div className="flex flex-col items-center">
          <h1 className="flex items-center gap-1.5 font-fun text-2xl font-bold drop-shadow">
            {target === 'gps' && <Navigation className="h-4 w-4 fill-current" />}
            {title}
          </h1>
          <p className="text-xs font-semibold capitalize opacity-80">
            {new Date().toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
          {pages.length > 1 && (
            <div className="mt-1.5 flex items-center gap-1.5">
              {pages.map((p, i) => (
                <button
                  key={p === 'gps' ? 'gps' : p.id}
                  onClick={() => goTo(i)}
                  aria-label={p === 'gps' ? 'Posizione attuale' : p.name}
                  className={cn('rounded-full transition-all', i === index ? 'h-2 w-2 bg-white' : 'h-1.5 w-1.5 bg-white/45')}
                />
              ))}
            </div>
          )}
        </div>
        {data ? (
          <button onClick={toggleSaved} className="rounded-full p-2 active:bg-white/15" aria-label="Salva città">
            <Heart className={cn('h-5 w-5', saved && 'fill-red-500 text-red-500')} />
          </button>
        ) : (
          <Link href="/citta/" className="rounded-full p-2 active:bg-white/15" aria-label="Aggiungi città">
            <Plus className="h-5 w-5" />
          </Link>
        )}
      </header>

      <WeatherView
        key={target === 'gps' ? 'gps' : target.id}
        data={data}
        error={error}
        loading={loading}
        animal={animal}
        isGps={target === 'gps'}
        onRetry={() => reload(true)}
      />
    </div>
  );
}
