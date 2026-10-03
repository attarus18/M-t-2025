/**
 * Sposta le illustrazioni scaricate dal browser (es. da Copilot) nella cartella
 * sorgente: ~/Downloads/<animale>-<condizione>.png
 *   -> resources/animali-originali/<animale>/<condizione>.png
 * (l'eventuale versione .jpg della stessa scena viene sostituita).
 * Poi lanciare `npm run images`.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const DOWNLOADS = path.join(os.homedir(), 'Downloads');
const DEST = 'resources/animali-originali';
const CONDITIONS = ['sole', 'notte', 'nuvoloso', 'pioggia', 'temporale', 'neve', 'nebbia', 'vento', 'caldo', 'freddo'];
const pattern = new RegExp(`^([a-z]+)-(${CONDITIONS.join('|')})\.png$`);

let moved = 0;
for (const file of fs.readdirSync(DOWNLOADS)) {
  const m = file.match(pattern);
  if (!m) continue;
  const [, animal, cond] = m;
  const dir = path.join(DEST, animal);
  fs.mkdirSync(dir, { recursive: true });
  for (const ext of ['jpg', 'png']) fs.rmSync(path.join(dir, `${cond}.${ext}`), { force: true });
  fs.renameSync(path.join(DOWNLOADS, file), path.join(dir, `${cond}.png`));
  console.log(`✓ ${animal}/${cond}`);
  moved++;
}
console.log(`${moved} file spostati`);
