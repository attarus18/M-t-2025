'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CloudSun, MapPin, PawPrint, Settings } from 'lucide-react';
import { useI18n } from '@/i18n';
import { cn } from '@/lib/utils';

const ITEMS = [
  { href: '/', icon: CloudSun, key: 'weather' },
  { href: '/citta/', icon: MapPin, key: 'cities' },
  { href: '/animali/', icon: PawPrint, key: 'animals' },
  { href: '/impostazioni/', icon: Settings, key: 'more' },
] as const;

export function BottomNav() {
  const pathname = usePathname();
  const { t } = useI18n();
  const normalized = pathname.endsWith('/') ? pathname : pathname + '/';

  return (
    <nav
      className="fixed inset-x-0 z-40 border-t border-white/10 bg-black/25 backdrop-blur-xl"
      // Sopra il banner AdMob, che sta in fondo allo schermo (0 per chi e' Premium).
      style={{ bottom: 'var(--ad-offset, 0px)' }}
    >
      <div className="mx-auto flex h-16 max-w-md items-stretch px-2">
        {ITEMS.map(item => {
          const active = item.href === '/' ? normalized === '/' : normalized.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'my-1.5 flex flex-1 flex-col items-center justify-center gap-0.5 rounded-xl text-[11px] font-bold text-white/60 transition-colors',
                active && 'bg-white/15 text-white',
              )}
            >
              <item.icon className="h-5 w-5" />
              {t.nav[item.key]}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
