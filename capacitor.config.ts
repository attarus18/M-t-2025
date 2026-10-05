import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'attarus18.meteozoo.com',
  appName: 'Meteo Zoo',
  webDir: 'out',
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      launchAutoHide: true,
      backgroundColor: '#46a6fd',
      androidScaleType: 'CENTER_INSIDE',
      showSpinner: false,
    },
    LocalNotifications: {
      // Notifica giornaliera col meteo (src/lib/daily-notification.ts)
      smallIcon: 'ic_stat_meteo',
      iconColor: '#2184fe',
    },
  },
};

export default config;
