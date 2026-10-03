'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Capacitor } from '@capacitor/core';
import type { Animal } from '@/lib/animals';
import { ALL_PACKS_PRODUCT, PAID_PRODUCT_IDS, getPack, type PackId } from '@/lib/packs';
import { KEYS, getStored, setStored } from '@/lib/storage';

/**
 * Acquisti a vita dei pacchetti di animali. Stesso approccio di Saggezza:
 * @capgo/native-purchases parla direttamente con Google Play Billing, senza
 * servizi esterni; cio' che l'utente possiede si ricava dagli acquisti che
 * Google Play restituisce per l'account del telefono.
 */
interface PurchasesContextType {
  /** true finche' non si conosce lo stato reale (primo avvio, Google Play non ancora risposto). */
  isLoading: boolean;
  /** Ha comprato almeno qualcosa: niente pubblicita'. */
  hasPurchased: boolean;
  /** Ha "Tutti i pacchetti" (inclusi quelli futuri). */
  hasAll: boolean;
  isPackUnlocked: (pack: PackId) => boolean;
  isAnimalUnlocked: (animal: Animal) => boolean;
  /** Prezzi localizzati da Google Play per ID prodotto (manca se il prodotto non e' disponibile). */
  prices: Record<string, string>;
  purchase: (productId: string) => Promise<boolean>;
  restore: () => Promise<boolean>;
}

const PurchasesContext = createContext<PurchasesContextType | undefined>(undefined);

async function plugin() {
  return import('@capgo/native-purchases');
}

async function queryOwned(): Promise<string[]> {
  const { NativePurchases } = await plugin();
  const { purchases } = await NativePurchases.getPurchases();
  // Su Android purchaseState "1" = acquistato (gli altri stati sono in attesa/annullati).
  return purchases
    .filter(p => PAID_PRODUCT_IDS.includes(p.productIdentifier) && (p.purchaseState === undefined || p.purchaseState === '1'))
    .map(p => p.productIdentifier);
}

async function loadPrices(): Promise<Record<string, string>> {
  const { NativePurchases, PURCHASE_TYPE } = await plugin();
  const { products } = await NativePurchases.getProducts({
    productIdentifiers: PAID_PRODUCT_IDS,
    productType: PURCHASE_TYPE.INAPP,
  });
  return Object.fromEntries(products.map(p => [p.identifier, p.priceString]));
}

export function PurchasesProvider({ children }: { children: ReactNode }) {
  // Acquisti in cache: niente lucchetti o pubblicita' per un attimo a chi ha gia'
  // pagato, e gli animali restano sbloccati anche offline.
  const [owned, setOwned] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [prices, setPrices] = useState<Record<string, string>>({});

  const apply = useCallback((list: string[]) => {
    setOwned(list);
    setStored(KEYS.purchasesCache, list);
    return list;
  }, []);

  const refresh = useCallback(async () => {
    try {
      return apply(await queryOwned());
    } catch {
      // offline o Play Store non disponibile: resta valida la cache
      return getStored<string[]>(KEYS.purchasesCache, []);
    }
  }, [apply]);

  useEffect(() => {
    const cached = getStored<unknown>(KEYS.purchasesCache, []);
    setOwned(Array.isArray(cached) ? cached.filter((x): x is string => typeof x === 'string') : []);

    if (!Capacitor.isNativePlatform()) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    let resumeHandle: { remove: () => void } | undefined;
    (async () => {
      await refresh();
      if (cancelled) return;
      setIsLoading(false);
      try {
        const list = await loadPrices();
        if (!cancelled) setPrices(list);
      } catch {
        if (!cancelled) setPrices({});
      }
      // Al ritorno nell'app ricontrolla: acquisti completati altrove, rimborsi.
      const { App } = await import('@capacitor/app');
      const handle = await App.addListener('resume', () => {
        refresh();
      });
      if (cancelled) handle.remove();
      else resumeHandle = handle;
    })();

    return () => {
      cancelled = true;
      resumeHandle?.remove();
    };
  }, [refresh]);

  const purchase = useCallback(
    async (productId: string) => {
      const { NativePurchases, PURCHASE_TYPE } = await plugin();
      await NativePurchases.purchaseProduct({
        productIdentifier: productId,
        productType: PURCHASE_TYPE.INAPP,
        quantity: 1,
        // Il plugin conferma subito l'acquisto a Google Play (altrimenti viene rimborsato dopo 3 giorni).
        autoAcknowledgePurchases: true,
      });
      return (await refresh()).includes(productId);
    },
    [refresh],
  );

  const restore = useCallback(async () => {
    if (!Capacitor.isNativePlatform()) return false;
    const { NativePurchases } = await plugin();
    await NativePurchases.restorePurchases();
    return (await refresh()).length > 0;
  }, [refresh]);

  const value = useMemo<PurchasesContextType>(() => {
    const hasAll = owned.includes(ALL_PACKS_PRODUCT);
    const isPackUnlocked = (pack: PackId) => {
      const productId = getPack(pack).productId;
      return productId === null || hasAll || owned.includes(productId);
    };
    return {
      isLoading,
      hasPurchased: owned.length > 0,
      hasAll,
      isPackUnlocked,
      isAnimalUnlocked: animal => isPackUnlocked(animal.pack),
      prices,
      purchase,
      restore,
    };
  }, [owned, isLoading, prices, purchase, restore]);

  return <PurchasesContext.Provider value={value}>{children}</PurchasesContext.Provider>;
}

export function usePurchases(): PurchasesContextType {
  const context = useContext(PurchasesContext);
  if (!context) throw new Error('usePurchases must be used within a PurchasesProvider');
  return context;
}
