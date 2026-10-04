import type { NextConfig } from 'next';

// Due modalita':
// - APK (npm run build:static, usato da cap:sync): export statico in "out",
//   impacchettato dentro l'APK/AAB (webDir in capacitor.config.ts);
// - sito su Vercel (e next dev): app Next.js normale, che espone anche il ponte
//   /api/meteo con la chiave OpenWeatherMap tenuta sul server.
// La build per l'APK si lancia con scripts/build-static.mjs, che toglie di mezzo
// le route del server (src/app/api) incompatibili con l'export.
const isServer = process.env.VERCEL === '1' || process.argv.includes('dev');

const nextConfig: NextConfig = {
  output: isServer ? undefined : 'export',
  trailingSlash: true,
  images: { unoptimized: true },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
