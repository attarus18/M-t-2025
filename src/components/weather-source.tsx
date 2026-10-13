'use client';

import { Cloud } from 'lucide-react';
import { useI18n } from '@/i18n';
import { cn } from '@/lib/utils';

/**
 * Fonte dei dati meteo, richiesta dal piano gratuito di OpenWeatherMap.
 * Il link esterno si apre nel browser del telefono (Capacitor non naviga fuori dall'app).
 */
export function WeatherSource({ className }: { className?: string }) {
  const { t } = useI18n();
  return (
    <a
      href="https://openweathermap.org/"
      target="_blank"
      rel="noopener noreferrer"
      className={cn('inline-flex items-center gap-1 text-[11px] font-semibold opacity-70 active:opacity-100', className)}
    >
      <Cloud className="h-3 w-3" strokeWidth={2.5} />
      {t.common.weatherSource}
    </a>
  );
}
