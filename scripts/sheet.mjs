// Foglio di controllo di un animale: node scripts/sheet.mjs <animale> <file.png>
import sharp from 'sharp';
import fs from 'node:fs';
const [animal, out] = process.argv.slice(2);
const conds = ['sole', 'notte', 'nuvoloso', 'pioggia', 'temporale', 'neve', 'nebbia', 'vento', 'caldo', 'freddo'];
const S = 300;
const comps = [];
for (const [i, c] of conds.entries()) {
  const dir = `resources/animali-originali/${animal}`;
  const f = ['png', 'jpg'].map(e => `${dir}/${c}.${e}`).find(p => fs.existsSync(p));
  if (!f) continue;
  comps.push({ input: await sharp(f).resize(S, S, { fit: 'contain', background: '#fff' }).flatten({ background: '#fff' }).toBuffer(), top: Math.floor(i / 5) * S, left: (i % 5) * S });
}
await sharp({ create: { width: S * 5, height: S * 2, channels: 3, background: '#fff' } }).composite(comps).png().toFile(out);
console.log(comps.length, 'scene');
