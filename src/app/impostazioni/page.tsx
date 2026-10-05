'use client';

import { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { Capacitor } from '@capacitor/core';
import { Bell, ChevronRight, ShoppingBag, Shield, Sparkles } from 'lucide-react';
import { usePurchases } from '@/context/purchases-context';
import { privacyOptionsRequired, showPrivacyOptions } from '@/lib/ads';
import {
  DEFAULT_DAILY_NOTIFICATION,
  requestNotificationPermission,
  scheduleDailyWeather,
  sendTestNotification,
  type DailyNotificationSettings,
} from '@/lib/daily-notification';
import { KEYS, useStored } from '@/lib/storage';
import { useAnimal } from '@/lib/use-animal';

const APP_VERSION = '1.0.1';

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

      <DailyNotificationSection />

      <Section title="Divertiti" icon={Sparkles}>
        <Row href="/anteprima/">Gioca con tutti gli animali</Row>
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

/** Notifica giornaliera con il meteo del giorno nella propria posizione. */
function DailyNotificationSection() {
  const [settings, setSettings] = useStored<DailyNotificationSettings>(KEYS.dailyNotification, DEFAULT_DAILY_NOTIFICATION);
  const [isNative, setIsNative] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  useEffect(() => setIsNative(Capacitor.isNativePlatform()), []);

  const update = (next: DailyNotificationSettings) => {
    setSettings(next);
    scheduleDailyWeather();
  };

  const toggle = async () => {
    setNotice(null);
    if (settings.enabled) return update({ ...settings, enabled: false });
    if (!(await requestNotificationPermission())) {
      setNotice('Permesso negato: attiva le notifiche di Meteo Zoo dalle impostazioni di Android.');
      return;
    }
    update({ ...settings, enabled: true });
    setNotice('Fatto! Ogni giorno riceverai il meteo della tua posizione.');
  };

  const time = `${String(settings.hour).padStart(2, '0')}:${String(settings.minute).padStart(2, '0')}`;

  return (
    <Section title="Notifiche" icon={Bell}>
      {isNative ? (
        <>
          <button onClick={toggle} className="flex w-full items-center justify-between gap-3 py-3 text-left font-bold">
            <span>
              Meteo del giorno
              <span className="block text-xs font-semibold opacity-75">Il tuo animale ti racconta che tempo farà</span>
            </span>
            <span
              role="switch"
              aria-checked={settings.enabled}
              className={`relative h-7 w-12 shrink-0 rounded-full transition ${settings.enabled ? 'bg-emerald-400' : 'bg-white/30'}`}
            >
              <span
                className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${settings.enabled ? 'left-6' : 'left-1'}`}
              />
            </span>
          </button>
          {settings.enabled && (
            <label className="flex items-center justify-between border-t border-white/10 py-3 font-bold">
              Ogni giorno alle
              <input
                type="time"
                value={time}
                onChange={e => {
                  const [h, m] = e.target.value.split(':').map(Number);
                  if (Number.isFinite(h) && Number.isFinite(m)) update({ ...settings, hour: h, minute: m });
                }}
                className="rounded-xl bg-white/20 px-3 py-1.5 font-bold text-white"
              />
            </label>
          )}
          {settings.enabled && (
            <button
              onClick={async () => setNotice((await sendTestNotification()) ?? 'Notifica di prova in arrivo!')}
              className="flex w-full items-center justify-between border-t border-white/10 py-3 text-left font-bold"
            >
              Manda una notifica di prova
              <ChevronRight className="h-4 w-4 opacity-60" />
            </button>
          )}
          {notice && <p className="pt-1 text-sm font-semibold opacity-90">{notice}</p>}
          <p className="pt-2 text-xs opacity-75">
            Usa l'ultima posizione rilevata. Le previsioni si aggiornano ogni volta che apri l'app.
          </p>
        </>
      ) : (
        <p className="py-2 text-sm font-semibold opacity-85">Disponibile nell'app per Android.</p>
      )}
    </Section>
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
