import type { Metadata, Viewport } from 'next';
import './globals.css';
import './animations.css';
import { cn } from '@/lib/utils';
import { bodyFont, funFont } from '@/lib/fonts';
import { PurchasesProvider } from '@/context/purchases-context';
import { AppShell } from '@/components/app-shell';

export const metadata: Metadata = {
  title: 'Meteo Zoo',
  description: 'Il meteo raccontato da un pollo con gli occhiali da sole (e dai suoi amici).',
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
          <AppShell>{children}</AppShell>
        </PurchasesProvider>
      </body>
    </html>
  );
}
