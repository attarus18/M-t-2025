'use client';

import { useState } from 'react';
import { Droplets, Gauge, Leaf, Loader2, MapPinOff, RefreshCw, Wind, WifiOff, AlertCircle, Search } from 'lucide-react';
import Link from 'next/link';
import { AnimalArt } from '@/components/animal-art';
import { ForecastSheet, type SheetItem } from '@/components/forecast-sheet';
import { WeatherEffects } from '@/components/weather-effects';
import { ShareButton } from '@/components/share-button';
import { WeatherSource } from '@/components/weather-source';
import { pickPhrase, type Animal } from '@/lib/animals';
import { CONDITION_INFO, pickCondition, type ConditionId } from '@/lib/conditions';
import type { WeatherBundle, WeatherLoadError } from '@/lib/use-weather';
import { AIR_QUALITY_LABELS, dailySummary, kmh, type ForecastItem } from '@/lib/weather';
import { cn } from '@/lib/utils';

const DAYS = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];

/** Ora locale della citta' (OpenWeatherMap da' lo scarto dal UTC in secondi). */
function cityTime(dt: number, tz: number) {
  return new Date((dt + tz) * 1000);
}

function conditionOf(item: ForecastItem): ConditionId {
  return pickCondition({ weather: item.weather[0], temp: item.main.temp, windMs: item.wind.speed, gustMs: item.wind.gust });
}

export function WeatherView({
  data,
  error,
  loading,
  animal,
  isGps,
  onRetry,
}: {
  data: WeatherBundle | null;
  error: WeatherLoadError | null;
  loading: boolean;
  animal: Animal;
  isGps: boolean;
  onRetry: () => void;
}) {
  const [sheet, setSheet] = useState<SheetItem | null>(null);

  if (!data && loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 pt-28">
        <span className="animate-bounce text-7xl">{animal.emoji}</span>
        <p className="text-sm font-bold uppercase tracking-widest opacity-70">
          {isGps ? `${animal.name} cerca la tua posizione...` : `${animal.name} guarda il cielo...`}
        </p>
      </div>
    );
  }

  if (!data && error) {
    const Icon = error.kind === 'network' ? WifiOff : error.kind === 'gps' ? MapPinOff : AlertCircle;
    return (
      <div className="glass mx-auto mt-16 flex max-w-sm flex-col items-center rounded-[2rem] p-8 text-center animate-slide-up">
        <Icon className="mb-3 h-12 w-12 text-red-200" />
        <h3 className="font-fun text-xl font-bold">
          {error.kind === 'network' ? 'Nessuna connessione' : error.kind === 'gps' ? 'Posizione non disponibile' : 'Ops!'}
        </h3>
        <p className="mb-6 mt-1 text-sm opacity-85">{error.message}</p>
        <button
          onClick={onRetry}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-white py-3.5 font-bold text-sky-700 active:scale-95"
        >
          <RefreshCw className="h-4 w-4" /> Riprova
        </button>
        {error.kind === 'gps' && (
          <Link
            href="/citta/"
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-white/15 py-3.5 font-bold active:scale-95"
          >
            <Search className="h-4 w-4" /> Cerca una città
          </Link>
        )}
      </div>
    );
  }

  if (!data) return null;

  const { current, forecast, air } = data;
  const tz = current.timezone;
  const condition = pickCondition({
    weather: current.weather[0],
    temp: current.main.temp,
    windMs: current.wind.speed,
    gustMs: current.wind.gust,
  });
  const phrase = pickPhrase(animal, condition, `${current.id}`);
  const days = forecast ? dailySummary(forecast) : [];
  const today = days[0];
  const weekMin = Math.min(...days.map(d => d.min));
  const weekMax = Math.max(...days.map(d => d.max));

  return (
    <>
      {/* Fuori dal contenitore animato: un antenato con transform romperebbe il position: fixed. */}
      <ConditionBackground condition={condition} />
      <WeatherEffects condition={condition} />
    <div className="flex flex-col items-center animate-slide-up">

      {/* Protagonista: animale + fumetto */}
      <div className="relative mt-2 flex w-full flex-col items-center">
        <div className="relative z-10 mb-1 max-w-[85%] rounded-3xl bg-white px-5 py-3 text-center font-fun text-[17px] font-bold leading-snug text-slate-800 shadow-xl">
          {phrase}
          <span className="absolute -bottom-2 left-1/2 h-4 w-4 -translate-x-1/2 rotate-45 bg-white" />
        </div>
        <AnimalArt animal={animal} condition={condition} size={250} animated />
      </div>

      <div className="-mt-2 flex items-start font-fun font-bold leading-none drop-shadow-lg">
        <span className="text-[6.5rem]">{Math.round(current.main.temp)}</span>
        <span className="mt-4 text-5xl">°</span>
      </div>
      <p className="text-lg font-bold capitalize opacity-95">{current.weather[0].description}</p>
      <WeatherSource className="mt-0.5" />
      <div className="mt-3 flex gap-5 rounded-full bg-black/20 px-5 py-2 text-sm font-semibold backdrop-blur-md">
        <span>
          <span className="opacity-60">Max</span> {Math.round(today?.max ?? current.main.temp_max)}°
        </span>
        <span className="w-px bg-white/25" />
        <span>
          <span className="opacity-60">Min</span> {Math.round(today?.min ?? current.main.temp_min)}°
        </span>
        <span className="w-px bg-white/25" />
        <span>
          <span className="opacity-60">Percepita</span> {Math.round(current.main.feels_like)}°
        </span>
      </div>

      <ShareButton
        className="mt-4"
        forecast={{
          animal,
          condition,
          city: current.name,
          when: new Date().toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' }),
          temp: current.main.temp,
          description: current.weather[0].description,
          phrase,
        }}
      />

      {/* Dettagli */}
      <div className="mt-6 grid w-full grid-cols-2 gap-3">
        <Stat icon={Wind} label="Vento" value={`${kmh(current.wind.speed)}`} unit="km/h" />
        <Stat icon={Droplets} label="Umidità" value={`${current.main.humidity}`} unit="%" />
        <Stat icon={Gauge} label="Pressione" value={`${current.main.pressure}`} unit="hPa" />
        {air ? (
          <div className="glass flex flex-col gap-1 rounded-3xl p-4">
            <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider opacity-70">
              <Leaf className="h-3.5 w-3.5" /> Aria
            </span>
            <span className="flex items-center gap-2 text-xl font-bold">
              <span className={cn('h-3 w-3 rounded-full', AIR_QUALITY_LABELS[air].color)} />
              {AIR_QUALITY_LABELS[air].label}
            </span>
          </div>
        ) : (
          <Stat icon={Droplets} label="Visibilità" value={`${Math.round(current.visibility / 1000)}`} unit="km" />
        )}
      </div>

      {forecast ? (
        <>
          {/* Prossime ore */}
          <section className="glass mt-4 w-full rounded-3xl p-5">
            <h3 className="mb-4 text-[11px] font-bold uppercase tracking-widest opacity-70">Prossime ore</h3>
            <div className="no-scrollbar flex snap-x gap-3 overflow-x-auto pb-1">
              {forecast.list.slice(0, 12).map((item, idx) => {
                const c = conditionOf(item);
                const t = cityTime(item.dt, tz);
                return (
                  <button
                    key={item.dt}
                    onClick={() =>
                      setSheet({ item, condition: c, title: idx === 0 ? 'Tra poco' : `Ore ${String(t.getUTCHours()).padStart(2, '0')}:00`, tz })
                    }
                    className="flex min-w-[4rem] snap-start flex-col items-center gap-1 rounded-2xl py-2 transition active:scale-95 active:bg-white/10"
                  >
                    <span className="text-xs font-semibold opacity-80">
                      {idx === 0 ? 'Ora' : `${String(t.getUTCHours()).padStart(2, '0')}:00`}
                    </span>
                    <AnimalArt animal={animal} condition={c} size={44} />
                    <span className="text-lg font-bold">{Math.round(item.main.temp)}°</span>
                    {item.pop >= 0.2 && <span className="text-[10px] font-bold text-sky-100">{Math.round(item.pop * 100)}%</span>}
                  </button>
                );
              })}
            </div>
          </section>

          {/* Prossimi giorni */}
          <section className="glass mt-4 w-full rounded-3xl p-5">
            <h3 className="mb-2 text-[11px] font-bold uppercase tracking-widest opacity-70">Prossimi giorni</h3>
            <div className="flex flex-col">
              {days.map((d, idx) => {
                const c = conditionOf(d.representative);
                const dayName = idx === 0 ? 'Oggi' : DAYS[new Date(`${d.date}T12:00:00Z`).getUTCDay()];
                const span = Math.max(weekMax - weekMin, 1);
                return (
                  <button
                    key={d.date}
                    onClick={() => setSheet({ item: d.representative, condition: c, title: dayName, tz, min: d.min, max: d.max, pop: d.pop })}
                    className="flex items-center gap-3 border-b border-white/10 py-2.5 text-left last:border-0 active:bg-white/5"
                  >
                    <span className="w-24 font-bold">{dayName}</span>
                    <AnimalArt animal={animal} condition={c} size={36} />
                    <span className="w-10 text-xs font-bold text-sky-100">{d.pop >= 0.2 ? `${Math.round(d.pop * 100)}%` : ''}</span>
                    <span className="w-8 text-right font-semibold opacity-60">{Math.round(d.min)}°</span>
                    <span className="relative h-1.5 flex-1 rounded-full bg-black/20">
                      <span
                        className="absolute h-full rounded-full bg-gradient-to-r from-sky-200 to-amber-300"
                        style={{
                          left: `${((d.min - weekMin) / span) * 100}%`,
                          right: `${100 - ((d.max - weekMin) / span) * 100}%`,
                        }}
                      />
                    </span>
                    <span className="w-8 font-bold">{Math.round(d.max)}°</span>
                  </button>
                );
              })}
            </div>
          </section>
        </>
      ) : (
        <p className="glass mt-4 w-full rounded-3xl p-5 text-center text-sm opacity-80">Previsioni non disponibili al momento.</p>
      )}

      {loading && <Loader2 className="mt-4 h-5 w-5 animate-spin opacity-60" />}
    </div>
      <ForecastSheet sheet={sheet} animal={animal} cityId={current.id} cityName={current.name} onClose={() => setSheet(null)} />
    </>
  );
}

function Stat({ icon: Icon, label, value, unit }: { icon: typeof Wind; label: string; value: string; unit: string }) {
  return (
    <div className="glass flex flex-col gap-1 rounded-3xl p-4">
      <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider opacity-70">
        <Icon className="h-3.5 w-3.5" /> {label}
      </span>
      <span className="text-2xl font-bold">
        {value} <span className="text-sm font-semibold opacity-60">{unit}</span>
      </span>
    </div>
  );
}

/** Sfondo a tutto schermo nel colore della condizione, sopra quello di default. */
function ConditionBackground({ condition }: { condition: ConditionId }) {
  return (
    <div
      className={cn('fixed inset-0 -z-10 bg-gradient-to-b transition-colors duration-700', CONDITION_INFO[condition].background)}
    />
  );
}
