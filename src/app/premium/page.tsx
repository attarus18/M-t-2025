'use client';

import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { Check, ShoppingBag } from 'lucide-react';
import { AnimalArt } from '@/components/animal-art';
import { BuyButton } from '@/components/buy-button';
import { usePurchases } from '@/context/purchases-context';
import { ANIMALS, comingSoonAnimals } from '@/lib/animals';
import { ALL_PACKS_PRODUCT, PACKS } from '@/lib/packs';

const PAID_PACKS = PACKS.filter(p => p.productId);

/** Negozio: pacchetti singoli a vita e "Tutti i pacchetti" (anche futuri). */
export default function ShopPage() {
  const { hasAll, isPackUnlocked, restore } = usePurchases();
  const [isNative, setIsNative] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  useEffect(() => setIsNative(Capacitor.isNativePlatform()), []);

  const onRestore = async () => {
    setNotice(null);
    try {
      const ok = await restore();
      setNotice(ok ? 'Acquisti ripristinati!' : 'Nessun acquisto trovato su questo account Google.');
    } catch {
      setNotice('Ripristino non riuscito. Controlla la connessione e riprova.');
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col items-center pt-2 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-400 text-amber-950 shadow-lg">
          <ShoppingBag className="h-8 w-8" />
        </div>
        <h1 className="mt-3 font-fun text-3xl font-bold drop-shadow">Pacchetti animali</h1>
        <p className="font-semibold opacity-90">Compri una volta, restano tuoi per sempre.</p>
      </header>

      {/* Tutti i pacchetti */}
      <section className="rounded-3xl bg-gradient-to-br from-amber-300 to-orange-400 p-5 text-amber-950 shadow-xl">
        <div className="flex items-center justify-between">
          <h2 className="font-fun text-2xl font-bold">🎁 Tutti i pacchetti</h2>
          <span className="rounded-full bg-white/70 px-2.5 py-1 text-[10px] font-bold uppercase">Conviene</span>
        </div>
        <ul className="mt-2 space-y-1 text-sm font-semibold">
          {[
            `Tutti i ${PAID_PACKS.length} pacchetti di oggi`,
            'Anche tutti i pacchetti che usciranno',
            'Nessuna pubblicità',
          ].map(t => (
            <li key={t} className="flex items-center gap-2">
              <Check className="h-4 w-4 shrink-0" strokeWidth={3} /> {t}
            </li>
          ))}
        </ul>
        <div className="mt-4">
          {hasAll ? (
            <p className="rounded-2xl bg-white/70 p-3 text-center font-fun font-bold">Ce l&apos;hai già. Grazie! 💛</p>
          ) : (
            <BuyButton productId={ALL_PACKS_PRODUCT} label="Sblocca tutto" className="bg-white text-orange-700" />
          )}
        </div>
      </section>

      {/* Pacchetti singoli */}
      <section className="space-y-3">
        <h2 className="text-[11px] font-bold uppercase tracking-widest opacity-80">Oppure un pacchetto alla volta</h2>
        {PAID_PACKS.map(pack => {
          const animals = ANIMALS.filter(a => a.pack === pack.id);
          const unlocked = isPackUnlocked(pack.id);
          return (
            <div key={pack.id} className="glass space-y-3 rounded-3xl p-4">
              <div>
                <h3 className="font-fun text-xl font-bold">
                  {pack.emoji} {pack.name}
                </h3>
                <p className="text-xs font-semibold opacity-80">{pack.tagline}</p>
              </div>
              <div className="no-scrollbar flex items-end gap-2 overflow-x-auto">
                {animals.map(a => (
                  <div key={a.id} className="flex min-w-[4.5rem] flex-col items-center">
                    <AnimalArt animal={a} condition="sole" size={64} />
                    <span className="text-[11px] font-bold">{a.name}</span>
                  </div>
                ))}
                {comingSoonAnimals(pack.id).map(a => (
                  <div key={a.id} className="flex min-w-[4.5rem] flex-col items-center opacity-70">
                    <span className="flex h-16 items-center text-3xl grayscale-[40%]">{a.emoji}</span>
                    <span className="text-[11px] font-bold">{a.name} ✨</span>
                  </div>
                ))}
              </div>
              {comingSoonAnimals(pack.id).length > 0 && (
                <p className="text-[11px] font-semibold opacity-75">✨ = in arrivo, incluso gratis per chi ha il pacchetto</p>
              )}
              {unlocked ? (
                <p className="flex items-center justify-center gap-1.5 rounded-full bg-white/20 py-2.5 text-sm font-bold">
                  <Check className="h-4 w-4" strokeWidth={3} /> Sbloccato
                </p>
              ) : (
                <BuyButton productId={pack.productId!} label={`Sblocca ${pack.name}`} />
              )}
            </div>
          );
        })}
      </section>

      <p className="text-center text-xs opacity-80">
        Pagamento unico gestito da Google Play, nessun abbonamento. Con qualsiasi acquisto spariscono anche le
        pubblicità.
      </p>

      {notice && <p className="rounded-2xl bg-black/20 p-3 text-center text-sm font-semibold">{notice}</p>}
      {isNative && (
        <button onClick={onRestore} className="w-full text-center text-sm font-bold underline">
          Ripristina acquisti
        </button>
      )}
    </div>
  );
}
