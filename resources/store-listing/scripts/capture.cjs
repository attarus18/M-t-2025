// Cattura le schermate dell'app (sito pubblicato) per la scheda Play Store.
const puppeteer = require('puppeteer-core');
const path = require('path');

const SITE = 'https://meteo-zoo.vercel.app';
const OUT = path.join(__dirname, 'raw');
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const sleep = ms => new Promise(r => setTimeout(r, ms));

const WX = {
  sole: { id: 800, main: 'Clear', description: 'cielo sereno', icon: '01d' },
  pioggia: { id: 500, main: 'Rain', description: 'pioggia leggera', icon: '10d' },
  nuvoloso: { id: 803, main: 'Clouds', description: 'nubi sparse', icon: '04d' },
};
async function shot(browser, name, { url, animal, after, wx = 'sole', owned = ['pa_pack_tutti'] }) {
  const ctx = await browser.createBrowserContext();
  await ctx.overridePermissions(SITE, ['geolocation']);
  const page = await ctx.newPage();
  await page.setViewport({ width: 412, height: 824, deviceScaleFactor: 2.5, isMobile: true, hasTouch: true });
  await page.setGeolocation({ latitude: 41.9028, longitude: 12.4964 }); // Roma
  // localStorage prima del caricamento: animale scelto e tutti i pacchetti sbloccati
  await page.evaluateOnNewDocument((a, o) => {
    localStorage.setItem('pa-animal', JSON.stringify(a));
    localStorage.setItem('pa-purchases-cache', JSON.stringify(o));
  }, animal, owned);
  // Dati reali di Roma, ma di giorno e con la condizione scelta (screenshot promozionali)
  await page.setRequestInterception(true);
  page.on('request', async req => {
    const u = new URL(req.url());
    if (!u.pathname.startsWith('/api/meteo') || !/attuale|previsioni/.test(u.search)) return req.continue();
    const res = await fetch(req.url());
    const data = await res.json();
    const w = WX[wx];
    if (data.sys) {
      data.weather = [w];
      data.dt = data.sys.sunrise + 5 * 3600;
      data.name = 'Roma';
    }
    if (data.list) data.list.forEach((it, i) => { if (i < 10) it.weather = [{ ...w, icon: w.icon }]; });
    req.respond({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(data) });
  });
  await page.goto(SITE + url, { waitUntil: 'networkidle0' });
  await sleep(2500);
  if (after) await after(page);
  await page.screenshot({ path: path.join(OUT, name + '.png') });
  console.log('ok', name);
  await ctx.close();
}

const clickText = async (page, text) => {
  await page.evaluate(t => {
    const el = [...document.querySelectorAll('button')].find(b => b.innerText.includes(t));
    el && el.click();
  }, text);
  await sleep(1800);
};

(async () => {
  require('fs').mkdirSync(OUT, { recursive: true });
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--hide-scrollbars'] });
  await shot(browser, '1-home-pollo', { url: '/', animal: 'pollo' });
  await shot(browser, '2-home-leone', { url: '/', animal: 'leone', wx: 'pioggia' });
  await shot(browser, '3-pioggia-pinguino', { url: '/anteprima/', animal: 'pinguino', after: p => clickText(p, 'Pioggia') });
  await shot(browser, '4-neve-panda', { url: '/anteprima/', animal: 'panda', after: p => clickText(p, 'Neve') });
  await shot(browser, '5-dettaglio-gatto', {
    url: '/', animal: 'gatto', wx: 'nuvoloso',
    after: async p => {
      // secondo giorno della lista "Prossimi giorni"
      await p.evaluate(() => {
        const sec = [...document.querySelectorAll('section')].find(s => s.textContent.includes('Prossimi giorni'));
        sec && sec.querySelectorAll('button')[1]?.click();
      });
      await sleep(2000);
    },
  });
  await shot(browser, '6-animali', { url: '/animali/', animal: 'pollo', owned: [], after: async p => {
    // la scritta del sito web ("Acquistabile nell'app per Android") non esiste nell'app
    await p.evaluate(() => document.querySelectorAll('p, span, div').forEach(e => { if (e.childElementCount === 0 && /Acquistabile nell/.test(e.textContent)) (e.closest('button') || e).remove(); }));
  } });
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
