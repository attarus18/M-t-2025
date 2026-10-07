// Registra brevi video verticali (1080x1920) delle animazioni dell'app per i social.
// Uso (dalla cartella con puppeteer-core e ffmpeg-static installati):
//   node record.cjs "<cartella output>"
const puppeteer = require('puppeteer-core');
const ffmpeg = require('ffmpeg-static');
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const SITE = 'https://meteo-zoo.vercel.app';
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const OUT = process.argv[2] || path.join(__dirname, 'video');
const sleep = ms => new Promise(r => setTimeout(r, ms));

const CONDITIONS = ['Sole', 'Notte', 'Nuvoloso', 'Pioggia', 'Temporale', 'Neve', 'Nebbia', 'Vento', 'Caldo', 'Gelo'];
const SINGLES = [
  ['pollo', 'Sole'], ['gatto', 'Notte'], ['cane', 'Pioggia'], ['pinguino', 'Neve'], ['leone', 'Temporale'],
  ['panda', 'Vento'], ['rana', 'Caldo'], ['mucca', 'Nebbia'], ['volpe', 'Nuvoloso'], ['coniglio', 'Gelo'],
];

async function clickButton(page, text) {
  await page.evaluate(t => {
    const b = [...document.querySelectorAll('button')].find(x => x.textContent.trim().endsWith(t));
    b && b.click();
  }, text);
}

async function record(browser, name, animal, script) {
  const ctx = await browser.createBrowserContext();
  const page = await ctx.newPage();
  await page.setViewport({ width: 405, height: 720, deviceScaleFactor: 2.6667, isMobile: true, hasTouch: true });
  await page.evaluateOnNewDocument(a => {
    localStorage.setItem('pa-animal', JSON.stringify(a));
    localStorage.setItem('pa-purchases-cache', JSON.stringify(['pa_pack_tutti']));
  }, animal);
  await page.goto(SITE + '/anteprima/', { waitUntil: 'networkidle0' });
  await sleep(1500);
  const webm = path.join(OUT, name + '.webm');
  const rec = await page.screencast({ path: webm, ffmpegPath: ffmpeg });
  await script(page);
  await rec.stop();
  await ctx.close();
  // MP4 H.264 1080x1920: il formato accettato ovunque (Instagram, TikTok, Facebook).
  const mp4 = path.join(OUT, name + '.mp4');
  execFileSync(ffmpeg, ['-y', '-i', webm, '-vf', 'scale=1080:1920:flags=lanczos,fps=30', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '20', '-movflags', '+faststart', mp4], { stdio: 'ignore' });
  fs.unlinkSync(webm);
  console.log('ok', name);
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--hide-scrollbars'] });

  // 1) Il pollo in tutti e 10 i meteo
  await record(browser, '01-pollo-tutti-i-meteo', 'pollo', async page => {
    for (const c of CONDITIONS) { await clickButton(page, c); await sleep(1600); }
  });

  // 2) Tutti gli animali, uno dopo l'altro, col sole
  await record(browser, '02-tutti-gli-animali', 'pollo', async page => {
    const names = await page.evaluate(() =>
      [...document.querySelectorAll('button')].map(b => b.textContent.trim()).filter(t => /^[A-Z][a-z]+$/.test(t) && !['Sole', 'Notte', 'Nuvoloso', 'Pioggia', 'Temporale', 'Neve', 'Nebbia', 'Vento', 'Caldo', 'Gelo', 'Meteo', 'Animali', 'Altro'].includes(t)));
    for (const n of names) {
      await page.evaluate(t => {
        const b = [...document.querySelectorAll('button')].find(x => x.textContent.trim() === t);
        if (b) { b.scrollIntoView({ inline: 'center', block: 'nearest' }); b.click(); }
      }, n);
      await sleep(700);
    }
  });

  // 3) Clip singole: un animale e un meteo, 6 secondi
  for (const [animal, cond] of SINGLES) {
    await record(browser, `${animal}-${cond.toLowerCase()}`, animal, async page => {
      await clickButton(page, cond);
      await sleep(6000);
    });
  }
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
