'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, Lock } from 'lucide-react';
import { AnimalArt } from '@/components/animal-art';
import { WeatherEffects } from '@/components/weather-effects';
import { usePurchases } from '@/context/purchases-context';
import { ANIMALS, pickPhrase } from '@/lib/animals';
import { CONDITIONS, CONDITION_INFO, type ConditionId } from '@/lib/conditions';
import { getPack } from '@/lib/packs';
import { useAnimal } from '@/lib/use-animal';
import { cn } from '@/lib/utils';

/**
 * Vetrina: tutte le condizioni meteo con animazioni ed effetti. Si possono
 * provare tutti gli animali, anche quelli dei pacchetti non ancora sbloccati.
 */
export default function PreviewPage() {
  const { animal: current } = useAnimal();
  const { isAnimalUnlocked } = usePurchases();
  // null = nessuna scelta ancora: si mostra l'animale in uso (letto dallo storage dopo il primo render).
  const [picked, setPicked] = useState<string | null>(null);
  const [condition, setCondition] = useState<ConditionId>('sole');
  const selectedRef = useRef<HTMLButtonElement>(null);

  const animal = ANIMALS.find(a => a.id === (picked ?? current.id)) ?? current;
  const locked = !isAnimalUnlocked(animal);
  const pack = getPack(animal.pack);

  // All'apertura il selettore parte dall'animale in uso.
  useEffect(() => {
    if (!picked) selectedRef.current?.scrollIntoView({ inline: 'center', block: 'nearest' });
  }, [current.id, picked]);

  return (
    <div className="flex flex-col items-center">
      <div className={cn('fixed inset-0 -z-10 bg-gradient-to-b transition-colors duration-700', CONDITION_INFO[condition].background)} />
      <WeatherEffects key={condition} condition={condition} />

      <Link href="/impostazioni/" className="-ml-1 inline-flex items-center self-start font-semibold opacity-85">
        <ChevronLeft className="h-4 w-4" /> Altro
      </Link>

      {/* Selettore degli animali */}
      <div className="no-scrollbar -mx-4 mt-2 flex w-[calc(100%+2rem)] snap-x gap-2 overflow-x-auto px-4 pb-1">
        {ANIMALS.map(a => {
          const active = a.id === animal.id;
          return (
            <button
              key={a.id}
              ref={active ? selectedRef : undefined}
              onClick={() => setPicked(a.id)}
              className={cn(
                'relative flex min-w-[4.5rem] snap-center flex-col items-center rounded-2xl bg-white/15 px-1 pb-1.5 pt-1 backdrop-blur-md transition active:scale-95',
                active && 'bg-white/40 ring-2 ring-white',
              )}
            >
              <AnimalArt animal={a} condition="sole" size={52} />
              <span className="text-[11px] font-bold leading-tight">{a.name}</span>
              {!isAnimalUnlocked(a) && (
                <span className="absolute right-1 top-1 rounded-full bg-amber-400 p-0.5 text-amber-950">
                  <Lock className="h-2.5 w-2.5" strokeWidth={3} />
                </span>
              )}
            </button>
          );
        })}
      </div>

      <h1 className="mt-3 font-fun text-2xl font-bold drop-shadow">{CONDITION_INFO[condition].label}</h1>

      <div className="relative mt-3 mb-1 max-w-[85%] rounded-3xl bg-white px-5 py-3 text-center font-fun text-[17px] font-bold leading-snug text-slate-800 shadow-xl">
        {pickPhrase(animal, condition, 'anteprima')}
        <span className="absolute -bottom-2 left-1/2 h-4 w-4 -translate-x-1/2 rotate-45 bg-white" />
      </div>
      <AnimalArt key={animal.id} animal={animal} condition={condition} size={240} animated />

      {locked && (
        <Link
          href="/premium/"
          className="mt-2 flex items-center gap-1.5 rounded-full bg-amber-400 px-4 py-2 text-sm font-bold text-amber-950 shadow-lg active:scale-95"
        >
          <Lock className="h-3.5 w-3.5" strokeWidth={3} /> Ti piace? Sblocca {pack.emoji} {pack.name}
        </Link>
      )}

      <div className="mt-5 grid w-full grid-cols-5 gap-2">
        {CONDITIONS.map(c => (
          <button
            key={c}
            onClick={() => setCondition(c)}
            className={cn(
              'flex flex-col items-center gap-0.5 rounded-2xl bg-white/15 py-2 text-[10px] font-bold backdrop-blur-md transition active:scale-95',
              c === condition && 'bg-white/40 ring-2 ring-white',
            )}
          >
            <span className="text-xl">{CONDITION_INFO[c].emoji}</span>
            {CONDITION_INFO[c].label.split(' ')[0]}
          </button>
        ))}
      </div>
    </div>
  );
}
