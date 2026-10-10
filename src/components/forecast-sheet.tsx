'use client';

import { useEffect } from 'react';
import { ChevronLeft, Droplets, Thermometer, Umbrella, Wind } from 'lucide-react';
import { AnimalArt } from '@/components/animal-art';
import { WeatherEffects } from '@/components/weather-effects';
import { ShareButton } from '@/components/share-button';
import { WeatherSource } from '@/components/weather-source';
import { pickPhrase, type Animal } from '@/lib/animals';
import { CONDITION_INFO, type ConditionId } from '@/lib/conditions';
import { kmh, type ForecastItem } from '@/lib/weather';
import { cn } from '@/lib/utils';

export interface SheetItem {
  item: ForecastItem;
  condition: ConditionId;
  title: string;
  tz: number;
  /** Solo per i giorni: estremi della giornata intera. */
  min?: number;
  max?: number;
  pop?: number;
}

/** Schermata intera con l'animale "vestito" per l'ora o il giorno scelto. */
export function ForecastSheet({
  sheet,
  animal,
  cityId,
  cityName,
  onClose,
}: {
  sheet: SheetItem | null;
  animal: Animal;
  cityId: number;
  cityName: string;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!sheet) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    // La pagina sotto non deve scorrere mentre la schermata e' aperta.
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
    };
  }, [sheet, onClose]);

  if (!sheet) return null;
  const { item, condition } = sheet;
  const pop = sheet.pop ?? item.pop;
  const temp = sheet.max ?? item.main.temp;
  const phrase = pickPhrase(animal, condition, `${cityId}:${item.dt}`);

  return (
    <div
      role="dialog"
      aria-modal="true"
      className={cn(
        'fixed inset-0 z-50 overflow-y-auto bg-gradient-to-b text-white animate-in fade-in duration-300',
        CONDITION_INFO[condition].background,
      )}
      // Il contenuto si ferma sopra il banner AdMob (view nativa in fondo allo schermo).
      style={{ paddingBottom: 'calc(var(--ad-offset, 0px) + 16px)' }}
    >
      <WeatherEffects condition={condition} />

      <div
        className="mx-auto flex min-h-full max-w-md flex-col px-5"
        style={{ paddingTop: 'calc(1.25rem + var(--safe-top, 0px))' }}
      >
        <header className="flex items-center gap-2">
          <button onClick={onClose} className="-ml-2 rounded-full p-2 active:bg-white/15" aria-label="Indietro">
            <ChevronLeft className="h-6 w-6" />
          </button>
          <div className="flex-1">
            <h3 className="font-fun text-2xl font-bold leading-tight drop-shadow">{sheet.title}</h3>
            <p className="text-sm font-semibold capitalize opacity-90">{item.weather[0].description}</p>
          </div>
          <ShareButton
            variant="icon"
            forecast={{
              animal,
              condition,
              city: cityName,
              when: sheet.title,
              temp,
              description: item.weather[0].description,
              phrase,
            }}
          />
        </header>

        <div className="flex flex-1 flex-col items-center justify-center py-4">
          <div className="relative z-10 mb-1 max-w-[90%] rounded-3xl bg-white px-5 py-3 text-center font-fun text-[17px] font-bold leading-snug text-slate-800 shadow-xl">
            {phrase}
            <span className="absolute -bottom-2 left-1/2 h-4 w-4 -translate-x-1/2 rotate-45 bg-white" />
          </div>
          <AnimalArt animal={animal} condition={condition} size={260} animated />

          <div className="-mt-1 flex items-start font-fun font-bold leading-none drop-shadow-lg">
            <span className="text-[5.5rem]">{Math.round(temp)}</span>
            <span className="mt-3 text-4xl">°</span>
          </div>
          {sheet.min !== undefined && (
            <p className="mt-1 rounded-full bg-black/20 px-4 py-1.5 text-sm font-semibold backdrop-blur-md">
              <span className="opacity-70">Max</span> {Math.round(temp)}° · <span className="opacity-70">Min</span>{' '}
              {Math.round(sheet.min)}°
            </p>
          )}
          <WeatherSource className="mt-2" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Stat icon={Umbrella} label="Pioggia" value={`${Math.round(pop * 100)}`} unit="%" />
          <Stat icon={Wind} label="Vento" value={`${kmh(item.wind.speed)}`} unit="km/h" />
          <Stat icon={Droplets} label="Umidità" value={`${item.main.humidity}`} unit="%" />
          <Stat icon={Thermometer} label="Percepita" value={`${Math.round(item.main.feels_like)}`} unit="°" />
        </div>

        <button
          onClick={onClose}
          className="mt-4 w-full rounded-full bg-white py-3.5 font-fun text-lg font-bold text-sky-700 shadow-lg active:scale-95"
        >
          Chiudi
        </button>
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value, unit }: { icon: typeof Wind; label: string; value: string; unit: string }) {
  return (
    <div className="glass flex flex-col gap-1 rounded-3xl p-4">
      <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider opacity-75">
        <Icon className="h-3.5 w-3.5" /> {label}
      </span>
      <span className="text-2xl font-bold">
        {value} <span className="text-sm font-semibold opacity-70">{unit}</span>
      </span>
    </div>
  );
}
