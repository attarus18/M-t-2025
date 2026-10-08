'use client';

import { useEffect, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Capacitor } from '@capacitor/core';
import { BottomNav } from '@/components/bottom-nav';
import { AdBanner } from '@/components/ad-banner';
import { scheduleDailyWeather } from '@/lib/daily-notification';
import { useAnimal } from '@/lib/use-animal';
import { syncWidgetAnimal } from '@/lib/widget';

/** Tasto "indietro" di Android: chiude i pannelli aperti, torna indietro, dalla home chiude l'app. */
function useAndroidBackButton() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    let handle: { remove: () => void } | undefined;
    let cancelled = false;
    (async () => {
      const { App } = await import('@capacitor/app');
      const registered = await App.addListener('backButton', () => {
        if (document.querySelector('[role="dialog"]')) {
          document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
          return;
        }
        if (pathname === '/' || pathname === '') App.exitApp();
        else router.back();
      });
      if (cancelled) registered.remove();
      else handle = registered;
    })();
    return () => {
      cancelled = true;
      handle?.remove();
    };
  }, [pathname, router]);
}

/** Notifica giornaliera: si riprogramma all'avvio e ogni volta che l'app torna in primo piano. */
function useDailyNotificationRefresh() {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    scheduleDailyWeather();
    let handle: { remove: () => void } | undefined;
    let cancelled = false;
    (async () => {
      const { App } = await import('@capacitor/app');
      const registered = await App.addListener('resume', () => scheduleDailyWeather());
      if (cancelled) registered.remove();
      else handle = registered;
    })();
    return () => {
      cancelled = true;
      handle?.remove();
    };
  }, []);
}

/** Widget della schermata home: segue l'animale scelto (anche dopo acquisti o rimborsi). */
function useWidgetAnimalSync() {
  const { animal } = useAnimal();
  useEffect(() => {
    syncWidgetAnimal();
  }, [animal.id]);
}

export function AppShell({ children }: { children: ReactNode }) {
  useAndroidBackButton();
  useDailyNotificationRefresh();
  useWidgetAnimalSync();

  return (
    <>
      {/* Sfondo di default; la pagina meteo lo copre con il colore della condizione. */}
      <div className="fixed inset-0 -z-20 bg-gradient-to-b from-[#2c88f7] to-[#86c0f8]" />
      <main
        className="mx-auto max-w-md px-4"
        style={{
          paddingTop: 'calc(1.25rem + var(--safe-top, 0px))',
          paddingBottom: 'calc(5.5rem + var(--ad-offset, 0px))',
        }}
      >
        {children}
      </main>
      <AdBanner />
      <BottomNav />
    </>
  );
}
