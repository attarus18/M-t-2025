'use client';

import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { Loader2 } from 'lucide-react';
import { usePurchases } from '@/context/purchases-context';
import { cn } from '@/lib/utils';

function isUserCancel(error: unknown): boolean {
  const message = String((error as { message?: string })?.message ?? error).toLowerCase();
  return message.includes('cancel') || message.includes('annull');
}

/** Pulsante d'acquisto di un prodotto Google Play, con prezzo localizzato ed esito. */
export function BuyButton({
  productId,
  label,
  className,
  onBought,
}: {
  productId: string;
  label: string;
  className?: string;
  onBought?: () => void;
}) {
  const { prices, purchase, isLoading } = usePurchases();
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [isNative, setIsNative] = useState(false);
  useEffect(() => setIsNative(Capacitor.isNativePlatform()), []);

  const price = prices[productId];

  const onBuy = async () => {
    setBusy(true);
    setNotice(null);
    try {
      const ok = await purchase(productId);
      if (ok) onBought?.();
      else setNotice('Google Play sta completando il pagamento: lo sblocco arriverà a breve.');
    } catch (error) {
      if (!isUserCancel(error)) setNotice('Acquisto non completato. Riprova tra qualche istante.');
    } finally {
      setBusy(false);
    }
  };

  if (!isNative) {
    return <p className="text-center text-xs font-semibold opacity-80">Acquistabile nell&apos;app per Android.</p>;
  }

  return (
    <div className="space-y-2">
      <button
        disabled={busy || isLoading || !price}
        onClick={onBuy}
        className={cn(
          'flex h-12 w-full items-center justify-center gap-2 rounded-full bg-amber-400 px-5 font-fun text-base font-bold text-amber-950 shadow-lg active:scale-95 disabled:opacity-60',
          className,
        )}
      >
        {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : price ? `${label} · ${price}` : 'Non disponibile al momento'}
      </button>
      {notice && <p className="text-center text-xs font-semibold opacity-90">{notice}</p>}
    </div>
  );
}
