'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Check, Lock, ShoppingBag, X } from 'lucide-react';
import { AnimalArt } from '@/components/animal-art';
import { BuyButton } from '@/components/buy-button';
import { usePurchases } from '@/context/purchases-context';
import { ANIMALS, comingSoonAnimals, type Animal } from '@/lib/animals';
import { CONDITIONS, CONDITION_INFO } from '@/lib/conditions';
import { PACKS, getPack } from '@/lib/packs';
import { useAnimal } from '@/lib/use-animal';
import { cn } from '@/lib/utils';

export default function AnimalsPage() {
  const { animal: current, setAnimal } = useAnimal();
  const { isAnimalUnlocked, isPackUnlocked, hasEveryPack } = usePurchases();
  const [preview, setPreview] = useState<Animal | null>(null);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-fun text-3xl font-bold drop-shadow">Scegli il tuo meteorologo</h1>
        <p className="text-sm font-semibold opacity-85">Chi ti racconta il meteo oggi?</p>
      </header>

      {PACKS.map(pack => {
        const animals = ANIMALS.filter(a => a.pack === pack.id);
        const unlocked = isPackUnlocked(pack.id);
        return (
          <section key={pack.id} className="space-y-3">
            <div className="flex items-end justify-between gap-2">
              <div>
                <h2 className="font-fun text-xl font-bold drop-shadow">
                  {pack.emoji} {pack.name}
                </h2>
                <p className="text-xs font-semibold opacity-80">{pack.tagline}</p>
              </div>
              {pack.productId === null ? (
                <Badge className="bg-emerald-400/90 text-emerald-950">Gratis</Badge>
              ) : unlocked ? (
                <Badge className="bg-white/90 text-sky-700">Sbloccato</Badge>
              ) : (
                <Badge className="bg-amber-400 text-amber-950">
                  <Lock className="h-3 w-3" strokeWidth={3} /> Da sbloccare
                </Badge>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              {animals.map(a => {
                const isLocked = !isAnimalUnlocked(a);
                const active = current.id === a.id;
                return (
                  <button
                    key={a.id}
                    onClick={() => (isLocked ? setPreview(a) : setAnimal(a.id))}
                    className={cn(
                      'glass relative flex flex-col items-center rounded-3xl p-3 pb-4 text-center transition active:scale-95',
                      active && 'bg-white/30 ring-4 ring-white',
                    )}
                  >
                    {active && (
                      <span className="absolute right-2 top-2 rounded-full bg-white p-1 text-sky-600">
                        <Check className="h-4 w-4" strokeWidth={3} />
                      </span>
                    )}
                    {isLocked && (
                      <span className="absolute right-2 top-2 rounded-full bg-amber-400 p-1.5 text-amber-950">
                        <Lock className="h-3.5 w-3.5" strokeWidth={3} />
                      </span>
                    )}
                    <AnimalArt
                      animal={a}
                      condition="sole"
                      size={110}
                      animated={active}
                      className={cn(isLocked && 'opacity-70')}
                    />
                    <span className="font-fun text-lg font-bold">{a.name}</span>
                    <span className="text-[11px] font-semibold leading-tight opacity-80">{a.tagline}</span>
                  </button>
                );
              })}
              {comingSoonAnimals(pack.id).map(soon => (
                <div
                  key={soon.id}
                  className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-white/30 p-3 text-center opacity-70"
                >
                  <span className="text-4xl">{soon.emoji}</span>
                  <span className="font-fun font-bold">{soon.name}</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider">In arrivo</span>
                </div>
              ))}
            </div>

            {!unlocked && pack.productId && (
              <BuyButton productId={pack.productId} label={`Sblocca ${pack.name}`} />
            )}
          </section>
        );
      })}

      {!hasEveryPack && (
        <Link
          href="/premium/"
          className="flex items-center justify-center gap-2 rounded-full bg-white py-4 font-fun text-lg font-bold text-sky-700 shadow-lg active:scale-95"
        >
          <ShoppingBag className="h-5 w-5" /> Tutti i pacchetti a prezzo scontato
        </Link>
      )}

      {preview && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 px-2 pt-6 backdrop-blur-sm"
          // Sopra il banner AdMob (view nativa che coprirebbe il fondo del pannello).
          style={{ paddingBottom: 'calc(var(--ad-offset, 0px) + 8px)' }}
          onClick={() => setPreview(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            onClick={e => e.stopPropagation()}
            className="relative max-h-full w-full max-w-md overflow-y-auto rounded-[2rem] bg-gradient-to-b from-[#2c88f7] to-[#5aa6f5] p-6 shadow-2xl animate-in slide-in-from-bottom duration-300"
          >
            <button
              onClick={() => setPreview(null)}
              className="absolute right-4 top-4 rounded-full bg-black/20 p-2"
              aria-label="Chiudi"
            >
              <X className="h-5 w-5" />
            </button>
            <h3 className="font-fun text-2xl font-bold">{preview.name}</h3>
            <p className="text-sm font-semibold opacity-85">
              Pacchetto {getPack(preview.pack).emoji} {getPack(preview.pack).name}
            </p>
            <div className="no-scrollbar mt-4 flex gap-2 overflow-x-auto pb-2">
              {CONDITIONS.map(c => (
                <div key={c} className="flex min-w-[5.5rem] flex-col items-center rounded-2xl bg-white/15 p-2">
                  <AnimalArt animal={preview} condition={c} size={72} animated />
                  <span className="text-[11px] font-bold">{CONDITION_INFO[c].label}</span>
                </div>
              ))}
            </div>
            <p className="mt-3 rounded-2xl bg-white/90 px-4 py-3 font-fun font-bold text-slate-800">
              “{preview.phrases.sole[0]}”
            </p>
            <div className="mt-5 space-y-3">
              {getPack(preview.pack).productId && (
                <BuyButton
                  productId={getPack(preview.pack).productId!}
                  label={`Sblocca ${getPack(preview.pack).name}`}
                  onBought={() => {
                    setAnimal(preview.id);
                    setPreview(null);
                  }}
                />
              )}
              <Link
                href="/premium/"
                className="block text-center text-sm font-bold underline"
                onClick={() => setPreview(null)}
              >
                Oppure sblocca tutti i pacchetti
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Badge({ className, children }: { className: string; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        'flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide',
        className,
      )}
    >
      {children}
    </span>
  );
}
