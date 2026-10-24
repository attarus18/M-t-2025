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
  'camaleonte/nuvoloso', 'suricato/nuvoloso', 'avvoltoio/nuvoloso', 'cammello/nebbia', 'camaleonte/nebbia', 'struzzo/nebbia', 'cammello/freddo', 'pipistrello/nebbia',
]);
// I pupazzi di neve sono bianchi come lo sfondo: le scene di neve vanno scontornate delicate,
// tranne le vecchie JPG con il contorno da adesivo (pupazzo gia' separato, ma piene di rumore).
const SNOW_NORMAL = new Set(['gatto', 'mucca', 'pecora', 'pinguino', 'pollo', 'rana']);
const isStrict = (animal, name) => STRICT.has(animal) || (name === 'neve' && !SNOW_NORMAL.has(animal)) || STRICT_SCENES.has(`${animal}/${name}`);
// Scene con un buco di sfondo chiuso dal disegno (es. tra collo e zampa della
// giraffa): il riempimento dai bordi non ci arriva, si tolgono le zone bianche grandi.
const HOLE_SCENES = new Set(['giraffa/caldo', 'struzzo/pioggia', 'cammello/neve', 'cammello/vento', 'cammello/sole', 'cammello/caldo', 'cammello/pioggia', 'cammello/notte', 'pollo/freddo', 'pollo/neve', 'pollo/notte', 'pollo/sole', 'pollo/vento', 'gatto/sole', 'gatto/nebbia', 'gatto/caldo', 'pipistrello/pioggia']);
const MIN_HOLE = 1500; // pixel: occhi e riflessi sono piu' piccoli
// Vecchie JPG a 200px: il bianco tra le zampe e' rumoroso e la soglia stretta lo spezza in
// frammenti. Qui i buchi si cercano con la soglia normale, solo se piccoli (non la pancia).
const LOOSE_HOLES = new Set(['pollo/freddo', 'pollo/neve', 'pollo/notte', 'pollo/sole', 'pollo/vento', 'gatto/sole', 'gatto/nebbia', 'gatto/caldo']);
// Ombra grigia sotto le zampe e alone rosato attorno (vecchie JPG del pollo): nella zona
// (frazioni x0, y0, x1, y1) sotto il corpo restano solo le zampe arancioni e il contorno scuro.
const GROUND_BOX = {
  'pollo/freddo': [0.2, 0.89, 0.8, 1],
  'pollo/neve': [0.45, 0.86, 0.95, 1],
  'pollo/notte': [0.2, 0.885, 0.8, 1],
  'pollo/sole': [0.2, 0.905, 0.8, 1],
  'pollo/vento': [0.15, 0.885, 0.8, 1],
};
function clearGround(data, width, height, [x0, y0, x1, y1]) {
  for (let y = Math.floor(y0 * height); y < Math.min(height, Math.ceil(y1 * height)); y++) {
    for (let x = Math.floor(x0 * width); x < Math.min(width, Math.ceil(x1 * width)); x++) {
      const i = (y * width + x) * 4;
      const lo = Math.min(data[i], data[i + 1], data[i + 2]);
      const hi = Math.max(data[i], data[i + 1], data[i + 2]);
      if (hi - lo < 70 && hi >= 140) data[i + 3] = 0;
    }
  }
}
// Buchi che non si separano dal disegno nemmeno cosi' (tra ombrello e testa del pollo il
// bianco tocca la mano, bianca anche lei): poligoni disegnati a mano, in frazioni
// dell'immagine. Dentro si toglie tutto cio' che e' chiaro; i contorni restano.
const HOLE_POLY = {
  'pollo/pioggia': [[[0.36, 0.33], [0.425, 0.33], [0.44, 0.36], [0.43, 0.41], [0.405, 0.47], [0.385, 0.495], [0.37, 0.45], [0.35, 0.42], [0.345, 0.39]]],
  'gatto/pioggia': [[[0.52, 0.2], [0.6, 0.235], [0.625, 0.28], [0.635, 0.4], [0.6, 0.38], [0.57, 0.33], [0.53, 0.245]]],
  'gatto/neve': [
    [[0.21, 0.66], [0.235, 0.64], [0.28, 0.68], [0.285, 0.75], [0.25, 0.76], [0.22, 0.72]],
    [[0.405, 0.81], [0.435, 0.805], [0.445, 0.83], [0.44, 0.86], [0.42, 0.875], [0.405, 0.86]],
  ],
};
// Zone (frazioni x0, y0, x1, y1, ed eventuale dimensione minima) in cui cercare i buchi,
// se la scena ha altro bianco da salvare (il pupazzo di neve accanto al cammello).
// Una zona stretta permette di togliere anche spiragli piccoli tra le zampe.
const HOLE_BOX = {
  'cammello/neve': [[0, 0.6, 0.55, 1]],
  'cammello/vento': [[0, 0.55, 1, 1]],
  'cammello/sole': [[0, 0.5, 1, 1]],
  'cammello/caldo': [[0.2, 0.35, 0.5, 0.65]],
  'cammello/pioggia': [[0.3, 0.35, 0.6, 0.65], [0.6, 0.7, 0.85, 0.95, 80]],
  'cammello/notte': [[0.5, 0.75, 0.75, 1, 80]],
  'pollo/freddo': [[0.3, 0.88, 0.7, 1, 80]],
  'pollo/neve': [[0.45, 0.7, 0.75, 1, 80]],
  'pollo/notte': [[0.3, 0.75, 0.7, 1, 80]],
  'pollo/sole': [[0.3, 0.75, 0.7, 1, 80]],
  'pollo/vento': [[0.2, 0.75, 0.7, 1, 80]],
  'gatto/sole': [[0.1, 0.5, 0.28, 0.85, 80]],
  'pipistrello/pioggia': [[0.28, 0.2, 0.42, 0.48, 80]],
  'gatto/nebbia': [[0.45, 0.7, 0.6, 0.95, 80]],
  'gatto/caldo': [[0.27, 0.28, 0.36, 0.48, 80]],
};
// Ombra grigia chiara sotto l'animale (tra le zampe del granchio): con la soglia normale
// resta una macchia biancastra. Qui e' sfondo anche il grigio chiaro neutro.
const SHADOW_SCENES = new Set(['granchio/sole', 'granchio/notte', 'cammello/vento']);
const isShadow = (d, i) => Math.min(d[i], d[i + 1], d[i + 2]) >= 200 && Math.max(d[i], d[i + 1], d[i + 2]) - Math.min(d[i], d[i + 1], d[i + 2]) <= 24;
// Nebbia che arriva ai bordi dell'immagine: verrebbe tagliata dritta, la si sfuma.
const FADE_SCENES = new Set(['leone/nebbia']);
/**
 * Nebbia grigia su fondo bianco: il bianco e il grigio chiaro neutri diventano
 * trasparenti in proporzione alla chiarezza, cosi' restano solo i fili di nebbia.
 */
function fogToAlpha(data, width, height) {
  for (let p = 0; p < width * height; p++) {
    const i = p * 4;
    const lo = Math.min(data[i], data[i + 1], data[i + 2]);
    const hi = Math.max(data[i], data[i + 1], data[i + 2]);
    if (hi - lo > 12 || lo < 170) continue;
    data[i + 3] = Math.min(data[i + 3], Math.round(Math.min(255, (255 - lo) * 3.5)));
  }
}

/** Ombre chiuse dalle zampe nella meta' bassa dell'immagine (vedi SHADOW_SCENES). */
function removeLowShadows(data, width, height) {
  const done = new Uint8Array(width * height);
  for (let s = 0; s < width * height; s++) {
    if (done[s] || data[s * 4 + 3] === 0 || !isShadow(data, s * 4)) continue;
    const region = [];
    const todo = [s];
    done[s] = 1;
    let ySum = 0;
    while (todo.length) {
      const p = todo.pop();
      region.push(p);
      ySum += (p / width) | 0;
      const x = p % width;
      for (const q of [x > 0 ? p - 1 : -1, x < width - 1 ? p + 1 : -1, p - width, p + width]) {
        if (q < 0 || q >= width * height || done[q] || data[q * 4 + 3] === 0 || !isShadow(data, q * 4)) continue;
        done[q] = 1;
        todo.push(q);
      }
    }
    if (region.length >= 300 && ySum / region.length > height * 0.6) for (const p of region) data[p * 4 + 3] = 0;
  }
}

function fadeBorders(data, width, height) {
  const band = Math.round(Math.min(width, height) * 0.12);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const d = Math.min(x, y, width - 1 - x, height - 1 - y);
      if (d >= band) continue;
      const i = (y * width + x) * 4 + 3;
      data[i] = Math.round(data[i] * (d / band) ** 1.5);
    }
  }
}
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

/**
 * Le vecchie illustrazioni a 200px hanno, attorno al contorno da adesivo, un anello di
 * rumore JPG chiaro e grigiastro che la soglia lascia a puntini: si toglie, a partire
 * dallo sfondo, per al massimo `depth` pixel (il contorno scuro del disegno lo ferma).
 */
function cleanEdge(data, width, height, depth) {
  const isRing = i => {
    const lo = Math.min(data[i], data[i + 1], data[i + 2]);
    const hi = Math.max(data[i], data[i + 1], data[i + 2]);
    return lo >= 175 && hi - lo <= 30;
  };
  // Fiocchi di neve, gocce e foglie sono isole piccole staccate dal disegno: restano.
  const big = new Uint8Array(width * height);
  const seen = new Uint8Array(width * height);
  for (let s = 0; s < width * height; s++) {
    if (seen[s] || data[s * 4 + 3] === 0) continue;
    const region = [s];
    seen[s] = 1;
    for (let k = 0; k < region.length; k++) {
      const p = region[k];
      const x = p % width;
      for (const q of [x > 0 ? p - 1 : -1, x < width - 1 ? p + 1 : -1, p - width, p + width]) {
        if (q < 0 || q >= width * height || seen[q] || data[q * 4 + 3] === 0) continue;
        seen[q] = 1;
        region.push(q);
      }
    }
    if (region.length > 6000) for (const p of region) big[p] = 1;
  }
  let front = [];
  for (let p = 0; p < width * height; p++) if (data[p * 4 + 3] === 0) front.push(p);
  for (let d = 0; d < depth && front.length; d++) {
    const next = [];
    for (const p of front) {
      const x = p % width;
      for (const q of [x > 0 ? p - 1 : -1, x < width - 1 ? p + 1 : -1, p - width, p + width]) {
        if (q < 0 || q >= width * height || data[q * 4 + 3] === 0 || !big[q] || !isRing(q * 4)) continue;
        data[q * 4 + 3] = 0;
        next.push(q);
      }
    }
    front = next;
  }
}

/** Punto (x, y) dentro il poligono [[x, y], ...] (regola pari/dispari). */
function inPolygon(x, y, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

function removeWhiteBackground(data, width, height, strict = false, holes = false, edgeDepth = 0, shadow = false, holeBoxes = [[0, 0, 1, 1]], looseHoles = false, holePoly = null) {
  const isBg = strict
    ? i => isStrictBg(data, i) && data[i + 3] > 0
    : shadow
      ? i => isShadow(data, i) && data[i + 3] > 0
      : i => 255 * 3 - (data[i] + data[i + 1] + data[i + 2]) <= TOLERANCE * 3 && data[i + 3] > 0;
  if (holes) {
    const done = new Uint8Array(width * height);
    const isHole = looseHoles ? isBg : i => isStrictBg(data, i);
    for (let s = 0; s < width * height; s++) {
      if (done[s] || !isHole(s * 4)) continue;
      const region = [];
      const todo = [s];
      done[s] = 1;
      while (todo.length) {
        const p = todo.pop();
        region.push(p);
        const x = p % width;
        for (const q of [x > 0 ? p - 1 : -1, x < width - 1 ? p + 1 : -1, p - width, p + width]) {
          if (q < 0 || q >= width * height || done[q] || !isHole(q * 4)) continue;
          done[q] = 1;
          todo.push(q);
        }
      }
      let cx = 0, cy = 0;
      for (const p of region) { cx += p % width; cy += (p / width) | 0; }
      cx /= region.length * width;
      cy /= region.length * height;
      const inBox = holeBoxes.some(([x0, y0, x1, y1, min = MIN_HOLE]) =>
        region.length >= min && (!looseHoles || region.length < width * height * 0.01) && cx >= x0 && cx <= x1 && cy >= y0 && cy <= y1);
      if (inBox) for (const p of region) data[p * 4 + 3] = 0;
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
    // I buchi gia' tolti non fermano il riempimento.
    if (data[p * 4 + 3] !== 0 && !isBg(p * 4)) continue;
    data[p * 4 + 3] = 0;
    const x = p % width;
    const y = (p / width) | 0;
    if (x > 0) stack.push(p - 1);
    if (x < width - 1) stack.push(p + 1);
    if (y > 0) stack.push(p - width);
    if (y < height - 1) stack.push(p + width);
  }
  // Dopo il riempimento: attraverso il poligono arriverebbe alla mano.
  if (holePoly) {
    for (let p = 0; p < width * height; p++) {
      const i = p * 4;
      if (Math.min(data[i], data[i + 1], data[i + 2]) >= 215 && holePoly.some(poly => inPolygon((p % width) / width, ((p / width) | 0) / height, poly))) data[i + 3] = 0;
    }
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

  if (edgeDepth) cleanEdge(data, width, height, edgeDepth);

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
    const meta = await sharp(path.join(dir, file)).metadata();
    // Gia' scontornata (es. con "Rimuovi sfondo" di Canva): si usa cosi' com'e'.
    const alreadyTransparent = meta.hasAlpha;
    // Le vecchie a 200px si ingrandiscono prima di scontornare: il bordo viene liscio
    // invece che a scalini.
    const small = meta.width < 400;
    const src = sharp(path.join(dir, file));
    if (small) src.resize(SIZE * 2, SIZE * 2, { kernel: 'lanczos3' });
    const { data, info } = await src.ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    if (!alreadyTransparent) {
      const scene = `${animal}/${name}`;
      removeWhiteBackground(data, info.width, info.height, isStrict(animal, name), HOLE_SCENES.has(scene), small ? 10 : 0, SHADOW_SCENES.has(scene), HOLE_BOX[scene], LOOSE_HOLES.has(scene), HOLE_POLY[scene]);
      if (SHADOW_SCENES.has(scene)) removeLowShadows(data, info.width, info.height);
      if (GROUND_BOX[scene]) clearGround(data, info.width, info.height, GROUND_BOX[scene]);
      if (FADE_SCENES.has(scene)) {
        fogToAlpha(data, info.width, info.height);
        fadeBorders(data, info.width, info.height);
      }
    }
    if (small) {
      // Alfa leggermente sfumato: niente seghettature dopo l'ingrandimento.
      const alpha = await sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } })
        .extractChannel(3).blur(1.2).raw().toBuffer();
      for (let p = 0; p < info.width * info.height; p++) data[p * 4 + 3] = Math.min(data[p * 4 + 3], alpha[p]);
    }
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
