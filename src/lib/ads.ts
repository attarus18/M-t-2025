'use client';

import { Capacitor } from '@capacitor/core';
import { KEYS, getStored, setStored } from './storage';

// Unita' dell'app "Meteo Zoo" su AdMob (App ID in AndroidManifest.xml).
// Non sono segreti: finiscono comunque nell'APK. Si possono sovrascrivere da .env.local.
const DEFAULT_BANNER_ID = 'ca-app-pub-4870944787959973/5343201210';
const DEFAULT_INTERSTITIAL_ID = 'ca-app-pub-4870944787959973/4782954705';

export const BANNER_AD_ID = process.env.NEXT_PUBLIC_ADMOB_BANNER_AD_UNIT_ID_ANDROID || DEFAULT_BANNER_ID;
const INTERSTITIAL_AD_ID = process.env.NEXT_PUBLIC_ADMOB_INTERSTITIAL_AD_UNIT_ID_ANDROID || DEFAULT_INTERSTITIAL_ID;

// Finche' e' true ogni richiesta torna un annuncio di test anche con gli ID reali:
// cliccare annunci veri dai propri dispositivi viola le norme AdMob.
export const IS_TEST_MODE = (process.env.NEXT_PUBLIC_ADMOB_TEST_MODE ?? 'true') !== 'false';

/** Un interstitial ogni N cambi di citta'/aggiornamenti, e mai piu' spesso di MIN_INTERVAL. */
const INTERSTITIAL_EVERY = 10;
const INTERSTITIAL_MIN_INTERVAL_MS = 3 * 60 * 1000;

let initPromise: Promise<boolean> | null = null;
let interstitialReady = false;
let lastInterstitialAt = 0;

/**
 * Inizializza AdMob e raccoglie il consenso GDPR (UMP) quando richiesto: in UE
 * AdMob non serve annunci personalizzati senza il messaggio di consenso
 * configurato in AdMob > Privacy e messaggi. Ritorna true se si possono
 * richiedere annunci.
 */
export function initAds(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return Promise.resolve(false);
  if (!initPromise) {
    initPromise = (async () => {
      const { AdMob, AdmobConsentStatus } = await import('@capacitor-community/admob');
      await AdMob.initialize({});
      try {
        const info = await AdMob.requestConsentInfo();
        if (info.isConsentFormAvailable && info.status === AdmobConsentStatus.REQUIRED) {
          const after = await AdMob.showConsentForm();
          return after.canRequestAds;
        }
        return info.canRequestAds;
      } catch {
        // UMP non configurato (es. build di sviluppo): si procede comunque
        return true;
      }
    })().catch(() => {
      initPromise = null;
      return false;
    });
  }
  return initPromise;
}

/** true se in AdMob e' configurato il messaggio GDPR e l'utente deve poter rivedere la scelta. */
export async function privacyOptionsRequired(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return false;
  try {
    const { AdMob } = await import('@capacitor-community/admob');
    const info = await AdMob.requestConsentInfo();
    // L'enum PrivacyOptionsRequirementStatus non e' esportato dal plugin: il valore e' la stringa.
    return info.privacyOptionsRequirementStatus === 'REQUIRED';
  } catch {
    return false;
  }
}

export async function showPrivacyOptions() {
  const { AdMob } = await import('@capacitor-community/admob');
  await AdMob.showPrivacyOptionsForm();
}

async function prepareInterstitial() {
  if (interstitialReady) return;
  const { AdMob } = await import('@capacitor-community/admob');
  try {
    await AdMob.prepareInterstitial({ adId: INTERSTITIAL_AD_ID, isTesting: IS_TEST_MODE });
    interstitialReady = true;
  } catch {
    interstitialReady = false;
  }
}

/**
 * Da chiamare a ogni cambio di citta' di un utente non Premium: conta i tocchi
 * e ogni tanto mostra un interstitial (gia' precaricato, per non far attendere).
 */
export async function onBrowseForAds() {
  if (!(await initAds())) return;
  const count = getStored<number>(KEYS.refreshCount, 0) + 1;
  setStored(KEYS.refreshCount, count);

  if (count % INTERSTITIAL_EVERY === INTERSTITIAL_EVERY - 2) {
    prepareInterstitial();
    return;
  }
  if (count % INTERSTITIAL_EVERY !== 0) return;
  if (Date.now() - lastInterstitialAt < INTERSTITIAL_MIN_INTERVAL_MS) return;

  await prepareInterstitial();
  if (!interstitialReady) return;
  const { AdMob } = await import('@capacitor-community/admob');
  try {
    await AdMob.showInterstitial();
    lastInterstitialAt = Date.now();
  } finally {
    interstitialReady = false;
  }
}
