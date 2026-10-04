# Meteo Zoo

Il meteo raccontato da un pollo con gli occhiali da sole (e dai suoi amici).
Next.js (export statico) + Capacitor per Android, dati da OpenWeatherMap,
AdMob per la versione gratuita e pacchetti di animali a vita con Google Play Billing.

## Sviluppo

```bash
cp .env.local.example .env.local   # inserire NEXT_PUBLIC_OWM_API_KEY
npm install
npm run dev                         # http://localhost:9005
```

## Illustrazioni degli animali

1. `npm run prompts > resources/prompts.md`: un prompt per ogni animale e condizione.
2. Generare le immagini (almeno 1024 px, sfondo bianco) e salvarle in
   `resources/animali-originali/<animale>/<condizione>.png`.
3. `npm run images`: scontorna, ridimensiona e salva in `public/animali/` (webp 512 px).

Finché un'immagine manca, l'app mostra l'emoji dell'animale.

## Android

```bash
npm run android:icons   # icona e splash da resources/icon/build-icon.mjs
npm run android:apk     # APK firmato: android/app/build/outputs/apk/release/
npm run android:bundle  # AAB per Play: android/app/build/outputs/bundle/release/
```

La firma usa `android/keystore.properties` + `android/app/upload-keystore.jks`
(esclusi da git: **tenerne una copia di backup**, senza non si possono caricare aggiornamenti).

Prima della pubblicazione:
- App ID AdMob reale in `android/app/src/main/AndroidManifest.xml` e unità in `.env.local`
  (`NEXT_PUBLIC_ADMOB_*`, `NEXT_PUBLIC_ADMOB_TEST_MODE=false`).
- Prodotti in-app (a pagamento singolo) su Play Console, con gli ID di `src/lib/packs.ts`:
  `pa_pack_fattoria`, `pa_pack_mare`, `pa_pack_bosco`, `pa_pack_casa`, `pa_pack_esotici` e `pa_pack_tutti`.
- A ogni release incrementare `versionCode` in `android/app/build.gradle`.
