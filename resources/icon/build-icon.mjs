/**
 * Icona e splash dell'app a partire dall'illustrazione del pollo generata con
 * ChatGPT (resources/icon/icona-pollo-originale.png, 1254x1254).
 * Genera i sorgenti per @capacitor/assets e l'icona del Play Store:
 *   node resources/icon/build-icon.mjs
 *
 * - icon-only.png: immagine intera (icone quadrate classiche e Play Store);
 * - icon-background.png: lo stesso cielo sfumato dell'illustrazione;
 * - icon-foreground.png: l'illustrazione intera, cosi' il pollo riempie tutta
 *   l'icona adattiva (l'inset del 16,7% e' gia' nell'XML di @capacitor/assets).
 */
import sharp from 'sharp';

const SRC = 'resources/icon/icona-pollo-originale.png';
// Colori campionati dal cielo dell'illustrazione (alto, meta', basso).
const SKY = ['#2184fe', '#46a6fd', '#8bcbfc'];

const gradient = (w, h) =>
  Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${SKY[0]}"/><stop offset="0.5" stop-color="${SKY[1]}"/><stop offset="1" stop-color="${SKY[2]}"/>
    </linearGradient></defs><rect width="${w}" height="${h}" fill="url(#g)"/></svg>`,
  );

/** L'illustrazione ridotta a `size`, con i bordi che sfumano nel trasparente (maschera circolare morbida). */
async function feathered(size) {
  const mask = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><defs><radialGradient id="m" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0.80" stop-color="#fff" stop-opacity="1"/><stop offset="1" stop-color="#fff" stop-opacity="0"/>
    </radialGradient></defs><rect width="${size}" height="${size}" fill="url(#m)"/></svg>`,
  );
  return sharp(SRC)
    .resize(size, size)
    .ensureAlpha()
    .composite([{ input: await sharp(mask).png().toBuffer(), blend: 'dest-in' }])
    .png()
    .toBuffer();
}

// Icone quadrate classiche e Play Store: immagine intera.
await sharp(SRC).resize(1024, 1024).png().toFile('resources/icon-only.png');
await sharp(SRC).resize(512, 512).png().toFile('resources/play-store-icon-512.png');

// Icona adattiva: sfondo cielo + illustrazione intera. L'XML generato da @capacitor/assets
// applica gia' un inset del 16,7%, quindi il primo piano coincide con la parte visibile.
await sharp(gradient(1024, 1024)).png().toFile('resources/icon-background.png');
const fgSize = 1024;
await sharp({ create: { width: 1024, height: 1024, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
  .composite([{ input: await sharp(SRC).resize(fgSize, fgSize).png().toBuffer(), top: (1024 - fgSize) / 2, left: (1024 - fgSize) / 2 }])
  .png()
  .toFile('resources/icon-foreground.png');

// Splash 2732x2732: cielo + pollo al centro.
const splashArt = 1100;
await sharp(gradient(2732, 2732))
  .composite([{ input: await feathered(splashArt), top: (2732 - splashArt) / 2, left: (2732 - splashArt) / 2 }])
  .png()
  .toFile('resources/splash.png');

console.log('Icona, icona adattiva, icona Play Store e splash generati in resources/');
