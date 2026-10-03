/**
 * Converte le illustrazioni generate con l'AI nel formato dell'app:
 * resources/animali-originali/<animale>/<condizione>.(png|jpg|webp)
 *   -> public/animali/<animale>/<condizione>.webp  (512x512, sfondo trasparente)
 *
 * Lo sfondo bianco viene tolto con un riempimento a partire dai bordi: si
 * cancella solo il bianco collegato al bordo, non quello dentro il disegno
 * (occhi, piume bianche...). Le immagini gia' trasparenti restano come sono.
 */
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const SRC = 'resources/animali-originali';
const OUT = 'public/animali';
const SIZE = 512;
const TOLERANCE = 28; // distanza massima dal bianco puro per essere "sfondo"

/**
 * Animali bianchi senza contorno netto: con la soglia normale lo
 * scontorno entrerebbe nel pelo. Per loro e' sfondo solo il bianco quasi puro
 * e neutro: il pelo ha sempre una leggera tinta calda. Per il panda e' andato
 * meglio scontornare con "Rimuovi sfondo" di Canva e salvare i PNG trasparenti.
 */
const STRICT = new Set([]);
const isStrictBg = (d, i) => Math.min(d[i], d[i + 1], d[i + 2]) >= 249 && Math.max(d[i], d[i + 1], d[i + 2]) - Math.min(d[i], d[i + 1], d[i + 2]) <= 3;

function removeWhiteBackground(data, width, height, strict = false) {
  const isBg = strict
    ? i => isStrictBg(data, i) && data[i + 3] > 0
    : i => 255 * 3 - (data[i] + data[i + 1] + data[i + 2]) <= TOLERANCE * 3 && data[i + 3] > 0;
  const seen = new Uint8Array(width * height);
  const stack = [];
  for (let x = 0; x < width; x++) stack.push(x, (height - 1) * width + x);
  for (let y = 0; y < height; y++) stack.push(y * width, y * width + width - 1);
  while (stack.length) {
    const p = stack.pop();
    if (seen[p]) continue;
    seen[p] = 1;
    if (!isBg(p * 4)) continue;
    data[p * 4 + 3] = 0;
    const x = p % width;
    const y = (p / width) | 0;
    if (x > 0) stack.push(p - 1);
    if (x < width - 1) stack.push(p + 1);
    if (y > 0) stack.push(p - width);
    if (y < height - 1) stack.push(p + width);
  }
  if (strict) {
    // Seconda passata: l'alone di compressione JPG (grigio chiaro e neutro)
    // attaccato allo sfondo gia' tolto. Il pelo, leggermente caldo, resta.
    const isHalo = i => {
      const lo = Math.min(data[i], data[i + 1], data[i + 2]);
      const hi = Math.max(data[i], data[i + 1], data[i + 2]);
      return lo >= 225 && hi - lo <= 4;
    };
    const queue = [];
    for (let p = 0; p < width * height; p++) if (data[p * 4 + 3] === 0) queue.push(p);
    while (queue.length) {
      const p = queue.pop();
      const x = p % width;
      const y = (p / width) | 0;
      for (const q of [x > 0 ? p - 1 : -1, x < width - 1 ? p + 1 : -1, y > 0 ? p - width : -1, y < height - 1 ? p + width : -1]) {
        if (q < 0 || data[q * 4 + 3] === 0 || !isHalo(q * 4)) continue;
        data[q * 4 + 3] = 0;
        queue.push(q);
      }
    }
  }

  // Bordo morbido: i pixel quasi bianchi accanto allo sfondo diventano semitrasparenti.
  for (let p = 0; p < width * height; p++) {
    if (data[p * 4 + 3] === 0) continue;
    const x = p % width;
    const y = (p / width) | 0;
    const nearBg =
      (x > 0 && data[(p - 1) * 4 + 3] === 0) ||
      (x < width - 1 && data[(p + 1) * 4 + 3] === 0) ||
      (y > 0 && data[(p - width) * 4 + 3] === 0) ||
      (y < height - 1 && data[(p + width) * 4 + 3] === 0);
    if (nearBg) {
      const whiteness = (data[p * 4] + data[p * 4 + 1] + data[p * 4 + 2]) / (255 * 3);
      data[p * 4 + 3] = Math.round(255 * Math.min(1, (1 - whiteness) * 6));
    }
  }
}

let count = 0;
for (const animal of fs.existsSync(SRC) ? fs.readdirSync(SRC) : []) {
  const dir = path.join(SRC, animal);
  if (!fs.statSync(dir).isDirectory()) continue;
  fs.mkdirSync(path.join(OUT, animal), { recursive: true });
  for (const file of fs.readdirSync(dir)) {
    if (!/\.(png|jpe?g|webp)$/i.test(file)) continue;
    const name = path.parse(file).name;
    const src = sharp(path.join(dir, file));
    // Gia' scontornata (es. con "Rimuovi sfondo" di Canva): si usa cosi' com'e'.
    const alreadyTransparent = (await src.metadata()).hasAlpha;
    const { data, info } = await src.ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    if (!alreadyTransparent) removeWhiteBackground(data, info.width, info.height, STRICT.has(animal));
    await sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } })
      .trim({ threshold: 1 })
      .resize(SIZE, SIZE, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .webp({ quality: 82, alphaQuality: 90 })
      .toFile(path.join(OUT, animal, `${name}.webp`));
    count++;
    console.log(`✓ ${animal}/${name}`);
  }
}
// Elenco delle illustrazioni presenti, letto dall'app (src/lib/animals.ts) per sapere
// quali animali sono disponibili e quali scene esistono.
const manifest = {};
for (const animal of fs.readdirSync(OUT).sort()) {
  const dir = path.join(OUT, animal);
  if (!fs.statSync(dir).isDirectory()) continue;
  manifest[animal] = fs
    .readdirSync(dir)
    .filter(f => f.endsWith('.webp'))
    .map(f => path.parse(f).name)
    .sort();
}
fs.writeFileSync('src/lib/animal-images.json', JSON.stringify(manifest, null, 2) + '\n');
console.log(`${count} immagini pronte in ${OUT}/`);
