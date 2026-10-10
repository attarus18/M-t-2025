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
const STRICT = new Set(['leone']);
// Singole scene dove la nebbia bianca tocca parti bianche dell'animale: con la
// soglia normale sparirebbero insieme (la pancia del delfino).
const STRICT_SCENES = new Set([
  'delfino/nebbia',
  // pupazzi di neve e nuvole bianche che toccano lo sfondo
  'maiale/neve', 'tartaruga/neve', 'cane/neve', 'coniglio/neve', 'delfino/neve', 'granchio/neve',
  'pappagallo/nuvoloso', 'scimmia/nuvoloso', 'scoiattolo/nuvoloso',
]);
// I pupazzi di neve sono bianchi come lo sfondo: le scene di neve vanno scontornate delicate,
// tranne le vecchie JPG con il contorno da adesivo (pupazzo gia' separato, ma piene di rumore).
const SNOW_NORMAL = new Set(['gatto', 'mucca', 'pecora', 'pinguino', 'pollo', 'rana']);
const isStrict = (animal, name) => STRICT.has(animal) || (name === 'neve' && !SNOW_NORMAL.has(animal)) || STRICT_SCENES.has(`${animal}/${name}`);
// Scene con un buco di sfondo chiuso dal disegno (es. tra collo e zampa della
// giraffa): il riempimento dai bordi non ci arriva, si tolgono le zone bianche grandi.
const HOLE_SCENES = new Set(['giraffa/caldo']);
const MIN_HOLE = 1500; // pixel: occhi e riflessi sono piu' piccoli
const isStrictBg =(d, i) => Math.min(d[i], d[i + 1], d[i + 2]) >= 249 && Math.max(d[i], d[i + 1], d[i + 2]) - Math.min(d[i], d[i + 1], d[i + 2]) <= 3;

/**
 * Con lo scontorno delicato restano puntini di rumore JPG staccati dal disegno:
 * isole piccole, chiare e quasi neutre. I fiocchi di neve sono azzurri e restano.
 */
const MAX_SPECK = 400;
function removeSpecks(data, width, height) {
  const done = new Uint8Array(width * height);
  for (let s = 0; s < width * height; s++) {
    if (done[s] || data[s * 4 + 3] === 0) continue;
    const region = [];
    const todo = [s];
    done[s] = 1;
    let pale = 0;
    while (todo.length && region.length <= MAX_SPECK) {
      const p = todo.pop();
      region.push(p);
      const i = p * 4;
      const lo = Math.min(data[i], data[i + 1], data[i + 2]);
      const hi = Math.max(data[i], data[i + 1], data[i + 2]);
      if (lo >= 200 && hi - lo <= 14) pale++;
      const x = p % width;
      for (const q of [x > 0 ? p - 1 : -1, x < width - 1 ? p + 1 : -1, p - width, p + width]) {
        if (q < 0 || q >= width * height || done[q] || data[q * 4 + 3] === 0) continue;
        done[q] = 1;
        todo.push(q);
      }
    }
    // Isola grande: e' disegno. Si segnano comunque i pixel rimasti in coda.
    if (todo.length || region.length > MAX_SPECK) {
      while (todo.length) {
        const p = todo.pop();
        const x = p % width;
        for (const q of [x > 0 ? p - 1 : -1, x < width - 1 ? p + 1 : -1, p - width, p + width]) {
          if (q < 0 || q >= width * height || done[q] || data[q * 4 + 3] === 0) continue;
          done[q] = 1;
          todo.push(q);
        }
      }
      continue;
    }
    if (pale >= region.length * 0.8) for (const p of region) data[p * 4 + 3] = 0;
  }
}

function removeWhiteBackground(data, width, height, strict = false, holes = false) {
  const isBg = strict
    ? i => isStrictBg(data, i) && data[i + 3] > 0
    : i => 255 * 3 - (data[i] + data[i + 1] + data[i + 2]) <= TOLERANCE * 3 && data[i + 3] > 0;
  if (holes) {
    const done = new Uint8Array(width * height);
    for (let s = 0; s < width * height; s++) {
      if (done[s] || !isStrictBg(data, s * 4)) continue;
      const region = [];
      const todo = [s];
      done[s] = 1;
      while (todo.length) {
        const p = todo.pop();
        region.push(p);
        const x = p % width;
        for (const q of [x > 0 ? p - 1 : -1, x < width - 1 ? p + 1 : -1, p - width, p + width]) {
          if (q < 0 || q >= width * height || done[q] || !isStrictBg(data, q * 4)) continue;
          done[q] = 1;
          todo.push(q);
        }
      }
      if (region.length >= MIN_HOLE) for (const p of region) data[p * 4 + 3] = 0;
    }
  }
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
  if (strict) removeSpecks(data, width, height);
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
    if (!alreadyTransparent) removeWhiteBackground(data, info.width, info.height, isStrict(animal, name), HOLE_SCENES.has(`${animal}/${name}`));
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
