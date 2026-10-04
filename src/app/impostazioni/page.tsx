'use client';

import { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { ChevronRight, ShoppingBag, Shield, Sparkles } from 'lucide-react';
import { usePurchases } from '@/context/purchases-context';
import { privacyOptionsRequired, showPrivacyOptions } from '@/lib/ads';
import { useAnimal } from '@/lib/use-animal';

const APP_VERSION = '1.0';

export default function SettingsPage() {
  const { hasAll, restore } = usePurchases();
  const { animal } = useAnimal();
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    privacyOptionsRequired().then(setShowPrivacy);
  }, []);

  const onRestore = async () => {
    setNotice(null);
    try {
      const ok = await restore();
      setNotice(ok ? 'Acquisti ripristinati!' : 'Nessun acquisto trovato su questo account Google.');
    } catch {
      setNotice('Ripristino non riuscito. Controlla la connessione.');
    }
  };

  return (
    <div className="space-y-5">
      <h1 className="font-fun text-3xl font-bold drop-shadow">Altro</h1>

      <Section title="Pacchetti animali" icon={ShoppingBag}>
        {hasAll && <p className="py-2 font-semibold">Hai tutti i pacchetti, anche quelli futuri. {animal.emoji}</p>}
        <Row href="/premium/">{hasAll ? 'Vedi i pacchetti' : 'Negozio dei pacchetti'}</Row>
        <Row onClick={onRestore}>Ripristina acquisti</Row>
        {notice && <p className="pt-2 text-sm font-semibold opacity-90">{notice}</p>}
      </Section>

      <Section title="Divertiti" icon={Sparkles}>
        <Row href="/anteprima/">Prova le animazioni del meteo</Row>
      </Section>

      <Section title="Info e privacy" icon={Shield}>
        {showPrivacy && <Row onClick={() => showPrivacyOptions()}>Preferenze privacy annunci</Row>}
        <Row href="/privacy/">Informativa sulla privacy</Row>
        <p className="pt-3 text-xs opacity-75">
          Dati meteo forniti da OpenWeatherMap. Meteo Zoo versione {APP_VERSION}.
        </p>
      </Section>
    </div>
  );
}

function Section({ title, icon: Icon, children }: { title: string; icon: typeof Shield; children: ReactNode }) {
  return (
    <section className="glass rounded-3xl p-5">
      <h2 className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest opacity-75">
        <Icon className="h-4 w-4" /> {title}
      </h2>
      {children}
    </section>
  );
}

function Row({ href, onClick, children }: { href?: string; onClick?: () => void; children: ReactNode }) {
  const cls = 'flex w-full items-center justify-between border-b border-white/10 py-3 text-left font-bold last:border-0';
  const inner = (
    <>
      {children}
      <ChevronRight className="h-4 w-4 opacity-60" />
    </>
  );
  return href ? (
    <Link href={href} className={cls}>
      {inner}
    </Link>
  ) : (
    <button onClick={onClick} className={cls}>
      {inner}
    </button>
  );
}
