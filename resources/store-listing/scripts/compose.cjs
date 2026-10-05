// Impagina gli screenshot per il Play Store (1080x1920) e la grafica in evidenza (1024x500).
const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const RAW = path.join(__dirname, 'raw');
const OUT = path.join(__dirname, 'final');
const ANIMALI = 'C:/CLOAD CODE NON CANCELLARE/Previsioni Animali/public/animali';
const url = p => 'file:///' + p.replace(/\\/g, '/');

const SHOTS = [
  ['1-home-pollo', 'Il meteo raccontato<br>da un pollo con gli occhiali', ['#2184fe', '#8bcbfc']],
  ['2-home-leone', 'Piove? Il leone<br>ha già l’ombrello', ['#3b4a6b', '#7d8fb3']],
  ['3-pioggia-pinguino', '10 condizioni meteo,<br>una più buffa dell’altra', ['#4a6fa5', '#9fc0e8']],
  ['4-neve-panda', 'Ogni animale si veste<br>per il tempo che fa', ['#6b86a8', '#d3e1f0']],
  ['5-dettaglio-gatto', 'Previsioni ora per ora<br>e per 5 giorni', ['#5a7fb5', '#b8cce6']],
  ['6-animali', 'Scegli il tuo meteorologo<br>tra 26 animali', ['#f59e0b', '#fcd34d']],
];

const FONT = `<link href="https://fonts.googleapis.com/css2?family=Fredoka:wght@600;700&display=swap" rel="stylesheet">`;

const shotHtml = (img, caption, [c1, c2]) => `<!doctype html><html><head>${FONT}<style>
  html,body{margin:0;width:1080px;height:1920px;overflow:hidden}
  body{background:linear-gradient(180deg,${c1},${c2});font-family:Fredoka,sans-serif;display:flex;flex-direction:column;align-items:center}
  h1{color:#fff;font-size:76px;line-height:1.08;text-align:center;margin:110px 40px 0;text-shadow:0 4px 18px rgba(0,0,0,.25);font-weight:700}
  .phone{margin-top:70px;width:760px;height:1520px;border-radius:64px;overflow:hidden;border:14px solid #10172a;box-shadow:0 30px 80px rgba(0,0,0,.35);background:#000}
  .phone img{width:100%;height:100%;object-fit:cover;object-position:top;display:block}
</style></head><body><h1>${caption}</h1><div class="phone"><img src="${img}"></div></body></html>`;

const feature = () => {
  const a = (n, c) => url(path.join(ANIMALI, n, c + '.webp'));
  return `<!doctype html><html><head>${FONT}<style>
  html,body{margin:0;width:1024px;height:500px;overflow:hidden}
  body{background:linear-gradient(180deg,#2184fe,#46a6fd 55%,#8bcbfc);font-family:Fredoka,sans-serif;position:relative}
  .t{position:absolute;left:52px;top:140px;color:#fff;text-shadow:0 4px 16px rgba(0,0,0,.25)}
  .t h1{font-size:88px;margin:0;line-height:1;font-weight:700}
  .t p{font-size:34px;margin:18px 0 0;font-weight:600;max-width:420px;line-height:1.15}
  img{position:absolute;filter:drop-shadow(0 10px 16px rgba(0,0,0,.25))}
</style></head><body>
  <div class="t"><h1>Meteo Zoo</h1><p>Il meteo raccontato dagli animali</p></div>
  <img src="${a('pinguino', 'neve')}" style="width:165px;left:575px;top:18px">
  <img src="${a('pollo', 'sole')}" style="width:270px;left:625px;top:190px">
  <img src="${a('leone', 'pioggia')}" style="width:205px;left:805px;top:22px">
  <img src="${a('gatto', 'notte')}" style="width:150px;left:870px;top:320px">
</body></html>`;
};

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: true });
  const page = await browser.newPage();
  for (const [name, caption, colors] of SHOTS) {
    await page.setViewport({ width: 1080, height: 1920, deviceScaleFactor: 1 });
    const f = path.join(OUT, '_tmp.html'); fs.writeFileSync(f, shotHtml(url(path.join(RAW, name + '.png')), caption, colors)); await page.goto(url(f), { waitUntil: 'networkidle0' });
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: path.join(OUT, name + '.png') });
    console.log('ok', name);
  }
  await page.setViewport({ width: 1024, height: 500, deviceScaleFactor: 1 });
  const ff = path.join(OUT, '_tmp.html'); fs.writeFileSync(ff, feature()); await page.goto(url(ff), { waitUntil: 'networkidle0' });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: path.join(OUT, 'grafica-in-evidenza.png') });
  console.log('ok feature');
  fs.unlinkSync(path.join(OUT, '_tmp.html'));
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
