'use client';

import { Capacitor, registerPlugin } from '@capacitor/core';

/** Plugin nativo locale (android/.../LayoutInsetsPlugin.java). Valori in px CSS dal fondo della WebView. */
interface LayoutInsetsPlugin {
  measure(): Promise<{ adTop: number; adBottom: number; navOverlap: number; safeTop: number }>;
}

const LayoutInsets = registerPlugin<LayoutInsetsPlugin>('LayoutInsets');

function setVar(name: string, px: number) {
  document.documentElement.style.setProperty(name, `${px}px`);
}

/**
 * Aggiorna le variabili CSS che tengono la navbar sopra al banner AdMob:
 * --ad-offset: quanto deve salire la navbar dal fondo della WebView;
 * --bottom-fill: striscia sotto (zona dei gesti di Android) da colorare;
 * --safe-top: notch della fotocamera in alto (l'app e' a schermo intero).
 */
export async function syncLayoutInsets() {
  if (!Capacitor.isNativePlatform()) return;
  try {
    const { adTop, adBottom, navOverlap, safeTop } = await LayoutInsets.measure();
    const hasAd = adTop > 0;
    setVar('--ad-offset', Math.max(adTop, navOverlap));
    setVar('--bottom-fill', hasAd ? adBottom : navOverlap);
    setVar('--safe-top', safeTop ?? 0);
  } catch {
    // plugin non disponibile (build vecchia): restano i valori precedenti
  }
}

/** Il banner si posiziona in modo asincrono: si rimisura un paio di volte. */
export function syncLayoutInsetsSoon() {
  syncLayoutInsets();
  setTimeout(syncLayoutInsets, 300);
  setTimeout(syncLayoutInsets, 1200);
}
