// Uso interno: copia le anteprime scaricate da Canva in resources/animali-originali
// e registra l'ID Canva (per riscaricarle in alta definizione).
// Righe da stdin: "<animale> <condizione> <file sorgente> <mediaId>"
import fs from 'node:fs';
const base = 'resources/animali-originali';
const manifestPath = `${base}/canva-media.json`;
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
for (const line of fs.readFileSync(0, 'utf8').split('\n')) {
  const [animal, cond, src, id] = line.trim().split(/\s+/);
  if (!id) continue;
  fs.mkdirSync(`${base}/${animal}`, { recursive: true });
  fs.copyFileSync(src, `${base}/${animal}/${cond}.jpg`);
  (manifest[animal] ??= {})[cond] = id;
}
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
console.log(Object.entries(manifest).filter(([k]) => !k.startsWith('_')).map(([k, v]) => `${k}:${Object.keys(v).length}`).join(' '));
