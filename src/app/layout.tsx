import type { Metadata, Viewport } from 'next';
import './globals.css';
import './animations.css';
import { cn } from '@/lib/utils';
import { bodyFont, funFont } from '@/lib/fonts';
import { PurchasesProvider } from '@/context/purchases-context';
import { AppShell } from '@/components/app-shell';
import { I18nProvider } from '@/i18n';

export const metadata: Metadata = {
  title: 'Meteo Zoo',
  description: 'Weather told by a chicken in sunglasses (and its friends).',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#2c88f7',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="it">
      <body className={cn(bodyFont.variable, funFont.variable, 'min-h-screen font-body antialiased')}>
        <PurchasesProvider>
          <I18nProvider>
            <AppShell>{children}</AppShell>
          </I18nProvider>
        </PurchasesProvider>
      </body>
    </html>
  );
}
