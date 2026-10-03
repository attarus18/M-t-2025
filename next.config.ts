import type { NextConfig } from 'next';

// Export statico: l'app viene impacchettata dentro l'APK/AAB (webDir "out" in
// capacitor.config.ts), senza server da mantenere.
const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  images: { unoptimized: true },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
