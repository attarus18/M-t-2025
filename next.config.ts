import type { NextConfig } from 'next';

// Due modalita':
// - APK (npm run cap:sync / next build in locale): export statico in "out",
//   impacchettato dentro l'APK/AAB (webDir in capacitor.config.ts);
// - sito su Vercel (e next dev): app Next.js normale, che espone anche il ponte
//   /api/meteo con la chiave OpenWeatherMap tenuta sul server.
// Le route del server hanno il suffisso .api.ts e vengono incluse solo nella
// seconda modalita'.
const isServer = process.env.VERCEL === '1' || process.argv.includes('dev');

const nextConfig: NextConfig = {
  output: isServer ? undefined : 'export',
  pageExtensions: isServer ? ['tsx', 'ts', 'api.ts'] : ['tsx', 'ts'],
  trailingSlash: true,
  images: { unoptimized: true },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
