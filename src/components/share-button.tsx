'use client';

import { useState } from 'react';
import { Loader2, Share2 } from 'lucide-react';
import { isShareCancel, shareForecast, type ShareForecast } from '@/lib/share';
import { cn } from '@/lib/utils';

/** Condivide il meteo come immagine (animale, citta', temperatura e frase). */
export function ShareButton({
  forecast,
  variant = 'pill',
  className,
}: {
  forecast: ShareForecast;
  variant?: 'pill' | 'icon';
  className?: string;
}) {
  const [busy, setBusy] = useState(false);

  const onShare = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await shareForecast(forecast);
    } catch (e) {
      if (!isShareCancel(e)) console.warn('Condivisione non riuscita', e);
    } finally {
      setBusy(false);
    }
  };

  const Icon = busy ? Loader2 : Share2;
  if (variant === 'icon') {
    return (
      <button onClick={onShare} className={cn('rounded-full p-2 active:bg-white/15', className)} aria-label="Condividi">
        <Icon className={cn('h-5 w-5', busy && 'animate-spin')} />
      </button>
    );
  }
  return (
    <button
      onClick={onShare}
      className={cn(
        'flex items-center gap-2 rounded-full bg-white px-5 py-2.5 font-fun text-base font-bold text-sky-700 shadow-lg active:scale-95',
        className,
      )}
    >
      <Icon className={cn('h-4 w-4', busy && 'animate-spin')} /> Condividi
    </button>
  );
}
