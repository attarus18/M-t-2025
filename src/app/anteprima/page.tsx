'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { AnimalArt } from '@/components/animal-art';
import { WeatherEffects } from '@/components/weather-effects';
import { pickPhrase } from '@/lib/animals';
import { CONDITIONS, CONDITION_INFO, type ConditionId } from '@/lib/conditions';
import { useAnimal } from '@/lib/use-animal';
import { cn } from '@/lib/utils';

/** Vetrina: tutte le condizioni meteo con l'animale scelto, animazioni ed effetti. */
export default function PreviewPage() {
  const { animal } = useAnimal();
  const [condition, setCondition] = useState<ConditionId>('sole');

  return (
    <div className="flex flex-col items-center">
      <div className={cn('fixed inset-0 -z-10 bg-gradient-to-b transition-colors duration-700', CONDITION_INFO[condition].background)} />
      <WeatherEffects key={condition} condition={condition} />

      <Link href="/impostazioni/" className="-ml-1 inline-flex items-center self-start font-semibold opacity-85">
        <ChevronLeft className="h-4 w-4" /> Altro
      </Link>
      <h1 className="mt-1 font-fun text-2xl font-bold drop-shadow">{CONDITION_INFO[condition].label}</h1>

      <div className="relative mt-4 mb-1 max-w-[85%] rounded-3xl bg-white px-5 py-3 text-center font-fun text-[17px] font-bold leading-snug text-slate-800 shadow-xl">
        {pickPhrase(animal, condition, 'anteprima')}
        <span className="absolute -bottom-2 left-1/2 h-4 w-4 -translate-x-1/2 rotate-45 bg-white" />
      </div>
      <AnimalArt animal={animal} condition={condition} size={260} animated />

      <div className="mt-6 grid w-full grid-cols-5 gap-2">
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
