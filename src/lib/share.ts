'use client';

import { Capacitor } from '@capacitor/core';
import { animalImage, type Animal } from './animals';
import { CONDITION_INFO, type ConditionId } from './conditions';
import { bodyFont, funFont } from './fonts';

export const STORE_URL = 'https://play.google.com/store/apps/details?id=attarus18.meteozoo.com';

export interface ShareForecast {
  animal: Animal;
  condition: ConditionId;
  city: string;
  /** Es. "Giovedì 1 ottobre" oppure "Sabato" / "Ore 15:00". */
  when: string;
  temp: number;
  description: string;
  phrase: string;
}

function shareText(f: ShareForecast) {
  return `${f.animal.emoji} ${f.city}, ${f.when}: ${Math.round(f.temp)}° e ${f.description}.\n"${f.phrase}"\n\nIl meteo raccontato dagli animali: ${STORE_URL}`;
}

function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const lines: string[] = [];
  let line = '';
  for (const word of text.split(/\s+/)) {
    const candidate = line ? `${line} ${word}` : word;
    if (ctx.measureText(candidate).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** Immagine 1080x1350 (formato post): sfondo del meteo, fumetto, animale, temperatura e firma. */
export async function renderForecastImage(f: ShareForecast): Promise<string> {
  const W = 1080;
  const H = 1350;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  // I font di next/font vanno caricati esplicitamente prima di usarli sul canvas.
  const fun = funFont.style.fontFamily;
  const body = bodyFont.style.fontFamily;
  await Promise.all([document.fonts.load(`700 60px ${fun}`), document.fonts.load(`600 40px ${body}`)]).catch(() => {});

  // Sfondo: gli stessi colori della condizione nell'app (estratti dalla classe Tailwind).
  const stops = CONDITION_INFO[f.condition].background.match(/#[0-9a-fA-F]{6}/g) ?? ['#2c88f7', '#86c0f8'];
  const gradient = ctx.createLinearGradient(0, 0, 0, H);
  stops.forEach((c, i) => gradient.addColorStop(i / Math.max(1, stops.length - 1), c));
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, W, H);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = 'rgba(0,0,0,0.25)';
  ctx.shadowBlur = 12;
  ctx.font = `700 76px ${fun}`;
  ctx.fillText(f.city, W / 2, 70);
  ctx.font = `600 38px ${body}`;
  ctx.globalAlpha = 0.9;
  ctx.fillText(f.when, W / 2, 160);
  ctx.globalAlpha = 1;
  ctx.shadowBlur = 0;

  // Fumetto con la frase
  ctx.font = `700 46px ${fun}`;
  const lines = wrapLines(ctx, f.phrase, 820).slice(0, 3);
  const lineH = 58;
  const bubbleH = lines.length * lineH + 56;
  const bubbleY = 240;
  ctx.fillStyle = '#ffffff';
  roundRect(ctx, 100, bubbleY, W - 200, bubbleH, 48);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(W / 2 - 24, bubbleY + bubbleH - 1);
  ctx.lineTo(W / 2, bubbleY + bubbleH + 26);
  ctx.lineTo(W / 2 + 24, bubbleY + bubbleH - 1);
  ctx.fill();
  ctx.fillStyle = '#1e293b';
  lines.forEach((l, i) => ctx.fillText(l, W / 2, bubbleY + 28 + i * lineH));

  // Animale
  const imgTop = bubbleY + bubbleH + 30;
  const imgSize = 560;
  const art =
    (await loadImage(animalImage(f.animal.id, f.condition)).catch(() => null)) ??
    (await loadImage(animalImage(f.animal.id, 'sole')).catch(() => null));
  if (art) {
    ctx.drawImage(art, (W - imgSize) / 2, imgTop, imgSize, imgSize);
  } else {
    ctx.font = `${imgSize * 0.6}px sans-serif`;
    ctx.fillText(f.animal.emoji, W / 2, imgTop + 60);
  }

  // Temperatura e descrizione
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = 'rgba(0,0,0,0.25)';
  ctx.shadowBlur = 16;
  ctx.font = `700 170px ${fun}`;
  const tempY = imgTop + imgSize - 30;
  ctx.fillText(`${Math.round(f.temp)}°`, W / 2 + 20, tempY);
  ctx.font = `600 44px ${body}`;
  const desc = f.description.charAt(0).toUpperCase() + f.description.slice(1);
  ctx.fillText(desc, W / 2, tempY + 175);
  ctx.shadowBlur = 0;

  // Firma
  ctx.font = `700 34px ${fun}`;
  ctx.globalAlpha = 0.85;
  ctx.fillText(`${f.animal.emoji} Meteo Zoo`, W / 2, H - 70);
  // Fonte dei dati (richiesta da OpenWeatherMap)
  ctx.font = `600 24px ${body}`;
  ctx.globalAlpha = 0.65;
  ctx.fillText('Dati meteo: OpenWeather', W / 2, H - 32);
  ctx.globalAlpha = 1;

  return canvas.toDataURL('image/png');
}

/** Condivide l'immagine del meteo (con testo e link allo store) tramite il menu di Android. */
export async function shareForecast(f: ShareForecast) {
  const text = shareText(f);
  const dataUrl = await renderForecastImage(f);
  const filename = `previsioni-animali-${Date.now()}.png`;

  if (Capacitor.isNativePlatform()) {
    const [{ Filesystem, Directory }, { Share }] = await Promise.all([
      import('@capacitor/filesystem'),
      import('@capacitor/share'),
    ]);
    const { uri } = await Filesystem.writeFile({
      path: filename,
      data: dataUrl.split(',')[1],
      directory: Directory.Cache,
    });
    await Share.share({ title: 'Meteo Zoo', text, files: [uri], dialogTitle: 'Condividi il meteo' });
    return;
  }

  const blob = await (await fetch(dataUrl)).blob();
  const file = new File([blob], filename, { type: 'image/png' });
  if (navigator.canShare?.({ files: [file] })) {
    await navigator.share({ files: [file], text }).catch(() => {});
    return;
  }
  if (navigator.share) {
    await navigator.share({ title: 'Meteo Zoo', text }).catch(() => {});
    return;
  }
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = filename;
  a.click();
}

/** L'utente ha chiuso il menu di condivisione: non e' un errore da mostrare. */
export function isShareCancel(error: unknown): boolean {
  const message = String((error as { message?: string })?.message ?? error).toLowerCase();
  return message.includes('cancel') || message.includes('abort');
}
