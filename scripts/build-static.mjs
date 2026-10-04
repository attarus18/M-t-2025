/**
 * Build statica per l'APK (cartella "out"). Le route del server in src/app/api
 * (es. il ponte /api/meteo) non sono compatibili con l'export: durante la build
 * la cartella diventa src/app/_api, che Next.js ignora (cartella privata), e poi
 * torna al suo posto anche se la build fallisce.
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';

const API = 'src/app/api';
const HIDDEN = 'src/app/_api';

const moved = fs.existsSync(API);
if (moved) fs.renameSync(API, HIDDEN);
let status = 1;
try {
  status = spawnSync('npx', ['next', 'build'], { stdio: 'inherit', shell: true }).status ?? 1;
} finally {
  if (moved) fs.renameSync(HIDDEN, API);
}
process.exit(status);
