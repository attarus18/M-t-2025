'use client';

import { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { Capacitor } from '@capacitor/core';
import { Bell, Check, ChevronRight, Globe, Ruler, ShoppingBag, Shield, Sparkles } from 'lucide-react';
import { usePurchases } from '@/context/purchases-context';
import { useI18n } from '@/i18n';
import { LOCALES, LOCALE_INFO, type LanguagePref } from '@/i18n/locales';
import { privacyOptionsRequired, showPrivacyOptions } from '@/lib/ads';
import {
  DEFAULT_DAILY_NOTIFICATION,
  requestNotificationPermission,
  scheduleDailyWeather,
  sendTestNotification,
  type DailyNotificationSettings,
} from '@/lib/daily-notification';
import { KEYS, useStored } from '@/lib/storage';
import type { UnitsPref } from '@/lib/units';
import { useAnimal } from '@/lib/use-animal';
import { cn } from '@/lib/utils';

const APP_VERSION = '1.0.16';

export default function SettingsPage() {
  const { hasAll, hasEveryPack, restore } = usePurchases();
  const { animal } = useAnimal();
  const { t } = useI18n();
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    privacyOptionsRequired().then(setShowPrivacy);
  }, []);

  const onRestore = async () => {
    setNotice(null);
    try {
      const ok = await restore();
      setNotice(ok ? t.shop.restored : t.shop.noPurchases);
    } catch {
      setNotice(t.shop.restoreFailed);
    }
  };

  return (
    <div className="space-y-5">
      <h1 className="font-fun text-3xl font-bold drop-shadow">{t.settings.title}</h1>

      <Section title={t.settings.packs} icon={ShoppingBag}>
        {hasAll ? (
          <p className="py-2 font-semibold">
            {t.settings.hasAll} {animal.emoji}
          </p>
        ) : (
          hasEveryPack && (
            <p className="py-2 font-semibold">
              {t.settings.hasEvery} {animal.emoji}
            </p>
          )
        )}
        <Row href="/premium/">{hasEveryPack ? t.settings.seePacks : t.settings.shop}</Row>
        <Row onClick={onRestore}>{t.shop.restore}</Row>
        {notice && <p className="pt-2 text-sm font-semibold opacity-90">{notice}</p>}
      </Section>

      <LanguageSection />

      <UnitsSection />

      <DailyNotificationSection />

      <Section title={t.settings.fun} icon={Sparkles}>
        <Row href="/anteprima/">{t.settings.playAll}</Row>
      </Section>

      <Section title={t.settings.info} icon={Shield}>
        {showPrivacy && <Row onClick={() => showPrivacyOptions()}>{t.settings.adPrivacy}</Row>}
        <Row href="/privacy/">{t.settings.privacyPolicy}</Row>
        <p className="pt-3 text-xs opacity-75">{t.settings.footer(APP_VERSION)}</p>
      </Section>
    </div>
  );
}

/** Lingua dell'app: automatica (quella del telefono) o scelta a mano. */
function LanguageSection() {
  const { t, languagePref, setLanguagePref } = useI18n();
  const [open, setOpen] = useState(false);
  const options: LanguagePref[] = ['auto', ...LOCALES];
  const label = (pref: LanguagePref) => (pref === 'auto' ? t.settings.languageAuto : LOCALE_INFO[pref].name);

  return (
    <Section title={t.settings.language} icon={Globe}>
      <button onClick={() => setOpen(!open)} className="flex w-full items-center justify-between py-3 text-left font-bold">
        {label(languagePref)}
        <ChevronRight className={cn('h-4 w-4 opacity-60 transition-transform', open && 'rotate-90')} />
      </button>
      {open && (
        <div className="border-t border-white/10">
          {options.map(pref => (
            <button
              key={pref}
              // Il nome di ogni lingua e' scritto nella lingua stessa: va letto con la sua pronuncia.
              lang={pref === 'auto' ? undefined : pref}
              onClick={() => {
                setOpen(false);
                setLanguagePref(pref);
              }}
              className="flex w-full items-center justify-between py-2.5 text-left font-semibold"
            >
              {label(pref)}
              {pref === languagePref && <Check className="h-4 w-4" strokeWidth={3} />}
            </button>
          ))}
        </div>
      )}
    </Section>
  );
}

/** °C e km/h oppure °F e mph; in automatico secondo il paese del telefono. */
function UnitsSection() {
  const { t, unitsPref, setUnitsPref } = useI18n();
  const options: { value: UnitsPref; label: string }[] = [
    { value: 'auto', label: t.settings.unitsAuto },
    { value: 'metric', label: '°C · km/h' },
    { value: 'imperial', label: '°F · mph' },
  ];
  return (
    <Section title={t.settings.units} icon={Ruler}>
      <div className="grid grid-cols-3 gap-2 py-2">
        {options.map(o => (
          <button
            key={o.value}
            onClick={() => setUnitsPref(o.value)}
            className={cn(
              'rounded-2xl px-2 py-2.5 text-sm font-bold transition active:scale-95',
              unitsPref === o.value ? 'bg-white text-sky-700' : 'bg-white/15',
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
    </Section>
  );
}

/** Notifica giornaliera con il meteo del giorno nella propria posizione. */
function DailyNotificationSection() {
  const { t } = useI18n();
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
      setNotice(t.settings.permissionDenied);
      return;
    }
    update({ ...settings, enabled: true });
    setNotice(t.settings.enabled);
  };

  const time = `${String(settings.hour).padStart(2, '0')}:${String(settings.minute).padStart(2, '0')}`;

  return (
    <Section title={t.settings.notifications} icon={Bell}>
      {isNative ? (
        <>
          <button onClick={toggle} className="flex w-full items-center justify-between gap-3 py-3 text-left font-bold">
            <span>
              {t.settings.dailyWeather}
              <span className="block text-xs font-semibold opacity-75">{t.settings.dailyWeatherHint}</span>
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
              {t.settings.everyDayAt}
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
              onClick={async () => setNotice((await sendTestNotification()) ?? t.settings.testComing)}
              className="flex w-full items-center justify-between border-t border-white/10 py-3 text-left font-bold"
            >
              {t.settings.sendTest}
              <ChevronRight className="h-4 w-4 opacity-60" />
            </button>
          )}
          {notice && <p className="pt-1 text-sm font-semibold opacity-90">{notice}</p>}
          <p className="pt-2 text-xs opacity-75">{t.settings.notificationsHint}</p>
        </>
      ) : (
        <p className="py-2 text-sm font-semibold opacity-85">{t.common.androidOnly}</p>
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
