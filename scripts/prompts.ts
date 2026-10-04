/**
 * Stampa i prompt per generare con l'AI le illustrazioni di tutti gli animali:
 *   npx tsx scripts/prompts.ts > resources/prompts.md
 * Salvare ogni immagine come resources/animali-originali/<animale>/<condizione>.png
 * e poi lanciare `npm run images`.
 */
import { ALL_ANIMALS } from '../src/lib/animals';
import { CONDITIONS, CONDITION_INFO } from '../src/lib/conditions';

// Stile fisso per tutte le immagini: e' quello che le rende coerenti tra loro.
const STYLE =
  'Full body, centered, friendly kawaii style, soft 3D-like shading, bold clean outlines, vibrant colors, ' +
  'plain white background, no text, sticker style, app mascot.';

console.log('# Prompt per le illustrazioni\n');
for (const animal of ALL_ANIMALS) {
  console.log(`## ${animal.name} (${animal.id})\n`);
  for (const c of CONDITIONS) {
    console.log(`**${c}** → resources/animali-originali/${animal.id}/${c}.png\n`);
    console.log('```');
    console.log(`Cute cartoon mascot illustration of ${animal.promptSubject}, ${CONDITION_INFO[c].scene}. ${STYLE}`);
    console.log('```\n');
  }
}
