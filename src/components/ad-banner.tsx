'use client';

import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { usePurchases } from '@/context/purchases-context';
import { BANNER_AD_ID, IS_TEST_MODE, initAds } from '@/lib/ads';
import { syncLayoutInsetsSoon } from '@/lib/layout-insets';

/**
 * Banner AdMob per chi non ha ancora comprato niente, in fondo allo schermo. E' una view nativa
 * sopra la WebView: non disegna nulla nel DOM. La sua posizione reale viene
 * misurata lato Android (syncLayoutInsets) per alzare la navbar e il contenuto
 * quanto serve, senza che il banner copra niente.
 */
export function AdBanner() {
  const { hasPurchased, isLoading } = usePurchases();

  useEffect(() => {
    if (!Capacitor.isNativePlatform() || isLoading) return;
    let cancelled = false;

    (async () => {
      const { AdMob, BannerAdPosition, BannerAdSize } = await import('@capacitor-community/admob');
      if (hasPurchased) {
        // removeBanner va chiamato sempre: la view nativa sopravvive ai reload della pagina.
        await AdMob.removeBanner().catch(() => {});
        syncLayoutInsetsSoon();
        return;
      }
      if (!(await initAds()) || cancelled) return;
      await AdMob.showBanner({
        adId: BANNER_AD_ID,
        adSize: BannerAdSize.ADAPTIVE_BANNER,
        position: BannerAdPosition.BOTTOM_CENTER,
        margin: 0,
        isTesting: IS_TEST_MODE,
      });
      syncLayoutInsetsSoon();
    })();

    return () => {
      cancelled = true;
    };
  }, [hasPurchased, isLoading]);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    const handles: { remove: () => void }[] = [];
    let cancelled = false;
    (async () => {
      const { AdMob, BannerAdPluginEvents } = await import('@capacitor-community/admob');
      const { App } = await import('@capacitor/app');
      const registered = [
        await AdMob.addListener(BannerAdPluginEvents.SizeChanged, () => syncLayoutInsetsSoon()),
        await AdMob.addListener(BannerAdPluginEvents.Loaded, () => syncLayoutInsetsSoon()),
        await App.addListener('resume', () => syncLayoutInsetsSoon()),
      ];
      if (cancelled) registered.forEach(h => h.remove());
      else handles.push(...registered);
    })();
    const onResize = () => syncLayoutInsetsSoon();
    window.addEventListener('resize', onResize);
    syncLayoutInsetsSoon();
    return () => {
      cancelled = true;
      handles.forEach(h => h.remove());
      window.removeEventListener('resize', onResize);
    };
  }, []);

  // Striscia sotto al banner (o alla navbar), sopra la barra dei gesti di Android.
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40 bg-[#0b1220]"
      style={{ height: 'var(--bottom-fill, 0px)' }}
    />
  );
}
