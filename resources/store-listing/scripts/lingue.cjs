// Screenshot (1080x1920) e grafica in evidenza (1024x500) della scheda Play Store in ogni lingua.
// Cattura il sito pubblicato con la lingua scelta, una citta' del paese e il meteo forzato di giorno,
// poi impagina con la didascalia tradotta. Uscita: resources/store-listing/lingue/<lingua>/.
// Uso: NODE_PATH=<cartella con puppeteer-core>/node_modules node lingue.cjs [it en ...]
const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const SITE = 'https://meteo-zoo.vercel.app';
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const ROOT = path.join(__dirname, '..', 'lingue');
const ANIMALI = path.join(__dirname, '..', '..', '..', 'public', 'animali');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const fileUrl = p => 'file:///' + p.replace(/\\/g, '/');

// Condizione forzata per le foto promozionali; la descrizione e' quella di OpenWeatherMap nella lingua.
const WX = {
  sole: { id: 800, main: 'Clear', icon: '01d' },
  pioggia: { id: 500, main: 'Rain', icon: '10d' },
  nuvoloso: { id: 803, main: 'Clouds', icon: '04d' },
};

const L = {
  it: {
    city: 'Roma', geo: [41.9028, 12.4964], desc: ['cielo sereno', 'pioggia leggera', 'nubi sparse'],
    caps: ['Il meteo raccontato<br>da un pollo con gli occhiali', 'Piove? Il leone<br>ha già l’ombrello', '10 condizioni meteo,<br>una più buffa dell’altra', 'Ogni animale si veste<br>per il tempo che fa', 'Previsioni ora per ora<br>e per 5 giorni', 'Scegli il tuo meteorologo<br>tra 26 animali'],
    feat: 'Il meteo raccontato dagli animali',
  },
  en: {
    city: 'New York', geo: [40.7128, -74.006], units: 'imperial', desc: ['clear sky', 'light rain', 'broken clouds'],
    caps: ['The weather told<br>by a chicken in sunglasses', 'Rain? The lion<br>already has an umbrella', '10 weather scenes,<br>each one funnier', 'Every animal dresses<br>for the weather', 'Hour-by-hour<br>and 5-day forecasts', 'Pick your forecaster<br>from 26 animals'],
    feat: 'The weather told by animals',
  },
  es: {
    city: 'Madrid', geo: [40.4168, -3.7038], desc: ['cielo claro', 'lluvia ligera', 'nubes rotas'],
    caps: ['El tiempo contado<br>por un pollo con gafas de sol', '¿Llueve? El león<br>ya tiene paraguas', '10 situaciones de tiempo,<br>a cuál más divertida', 'Cada animal se viste<br>según el tiempo', 'Previsión hora a hora<br>y de 5 días', 'Elige a tu meteorólogo<br>entre 26 animales'],
    feat: 'El tiempo contado por los animales',
  },
  pt: {
    city: 'São Paulo', geo: [-23.5505, -46.6333], desc: ['céu limpo', 'chuva leve', 'nublado'],
    caps: ['A previsão contada<br>por um galinho de óculos', 'Chovendo? O leão<br>já tem guarda-chuva', '10 situações de tempo,<br>cada uma mais engraçada', 'Cada bicho se veste<br>de acordo com o tempo', 'Previsão hora a hora<br>e para 5 dias', 'Escolha seu meteorologista<br>entre 26 animais'],
    feat: 'A previsão do tempo contada pelos bichos',
  },
  fr: {
    city: 'Paris', geo: [48.8566, 2.3522], desc: ['ciel dégagé', 'légère pluie', 'nuageux'],
    caps: ['La météo racontée<br>par un poulet à lunettes', 'Il pleut ? Le lion<br>a déjà son parapluie', '10 situations météo,<br>toutes plus drôles', 'Chaque animal s’habille<br>selon le temps', 'Prévisions heure par heure<br>et sur 5 jours', 'Choisissez votre météorologue<br>parmi 26 animaux'],
    feat: 'La météo racontée par les animaux',
  },
  de: {
    city: 'Berlin', geo: [52.52, 13.405], desc: ['Klarer Himmel', 'Leichter Regen', 'Überwiegend bewölkt'],
    caps: ['Das Wetter, erzählt<br>von einem Huhn mit Sonnenbrille', 'Regen? Der Löwe<br>hat schon einen Schirm', '10 Wetterlagen,<br>eine lustiger als die andere', 'Jedes Tier zieht sich<br>passend zum Wetter an', 'Stündliche Vorhersage<br>und 5 Tage im Voraus', 'Wähle deinen Wetterfrosch<br>aus 26 Tieren'],
    feat: 'Das Wetter, erzählt von Tieren',
  },
  ja: {
    city: '東京', geo: [35.6762, 139.6503], desc: ['晴天', '小雨', '曇りがち'],
    caps: ['サングラスのニワトリが<br>天気を教えてくれる', '雨？ライオンは<br>もう傘を持ってる', '10種類のお天気シーン、<br>どれもゆかい', 'どの動物も<br>天気に合わせてお着がえ', '1時間ごとの予報と<br>5日間の予報', '26匹の中から<br>お天気キャスターを選ぼう'],
    feat: '動物たちが教えてくれる<br>天気予報',
  },
  ko: {
    city: '서울', geo: [37.5665, 126.978], desc: ['맑음', '약한 비', '구름 많음'],
    caps: ['선글라스 낀 닭이<br>알려주는 날씨', '비 온다고? 사자는<br>벌써 우산을 챙겼어요', '10가지 날씨 장면,<br>하나하나 재미있게', '동물마다 날씨에 맞게<br>옷을 갈아입어요', '시간별 예보와<br>5일 예보', '26마리 동물 중에서<br>기상캐스터를 골라요'],
    feat: '동물들이 알려주는 날씨',
  },
  id: {
    city: 'Jakarta', geo: [-6.2088, 106.8456], desc: ['langit cerah', 'hujan ringan', 'berawan'],
    caps: ['Cuaca diceritakan oleh<br>ayam berkacamata hitam', 'Hujan? Singa<br>sudah bawa payung', '10 suasana cuaca,<br>satu lebih lucu dari lainnya', 'Setiap hewan berpakaian<br>sesuai cuaca', 'Prakiraan per jam<br>dan 5 hari', 'Pilih peramal cuacamu<br>dari 26 hewan'],
    feat: 'Cuaca diceritakan oleh hewan',
  },
  tr: {
    city: 'İstanbul', geo: [41.0082, 28.9784], desc: ['açık', 'hafif yağmur', 'parçalı bulutlu'],
    caps: ['Güneş gözlüklü bir tavuğun<br>anlattığı hava durumu', 'Yağmur mu? Aslanın<br>şemsiyesi hazır', '10 hava durumu sahnesi,<br>biri diğerinden komik', 'Her hayvan havaya<br>göre giyinir', 'Saatlik ve<br>5 günlük tahmin', '26 hayvan arasından<br>sunucunu seç'],
    feat: 'Hayvanların anlattığı hava durumu',
  },
};

const SHOTS = [
  ['1-home-pollo', ['#2184fe', '#8bcbfc']],
  ['2-home-leone', ['#3b4a6b', '#7d8fb3']],
  ['3-pioggia-pinguino', ['#4a6fa5', '#9fc0e8']],
  ['4-neve-panda', ['#6b86a8', '#d3e1f0']],
  ['5-dettaglio-gatto', ['#5a7fb5', '#b8cce6']],
  ['6-animali', ['#f59e0b', '#fcd34d']],
];

async function shot(browser, lang, out, name, { url, animal, after, wx = 'sole', owned = ['pa_pack_tutti'] }) {
  const cfg = L[lang];
  const ctx = await browser.createBrowserContext();
  await ctx.overridePermissions(SITE, ['geolocation']);
  const page = await ctx.newPage();
  await page.setViewport({ width: 412, height: 824, deviceScaleFactor: 2.5, isMobile: true, hasTouch: true });
  await page.setGeolocation({ latitude: cfg.geo[0], longitude: cfg.geo[1] });
  await page.evaluateOnNewDocument((a, o, l, u) => {
    localStorage.setItem('pa-animal', JSON.stringify(a));
    localStorage.setItem('pa-purchases-cache', JSON.stringify(o));
    localStorage.setItem('pa-language', JSON.stringify(l));
    localStorage.setItem('pa-units', JSON.stringify(u));
  }, animal, owned, lang, cfg.units || 'metric');
  await page.setRequestInterception(true);
  page.on('request', async req => {
    const u = new URL(req.url());
    if (!u.pathname.startsWith('/api/meteo') || !/attuale|previsioni/.test(u.search)) return req.continue();
    const data = await (await fetch(req.url())).json();
    const w = { ...WX[wx], description: cfg.desc[Object.keys(WX).indexOf(wx)] };
    if (data.sys) {
      data.weather = [w];
      data.dt = data.sys.sunrise + 5 * 3600;
      data.name = cfg.city;
    }
    if (data.list) data.list.forEach((it, i) => { if (i < 10) it.weather = [w]; });
    if (data.city) data.city.name = cfg.city;
    req.respond({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(data) });
  });
  await page.goto(SITE + url, { waitUntil: 'networkidle0' });
  await sleep(2500);
  if (after) await after(page);
  await page.screenshot({ path: path.join(out, 'raw-' + name + '.png') });
  await ctx.close();
}

/** Bottone della griglia delle condizioni nella vetrina (0 = sole ... vedi CONDITIONS). */
const pickCondition = async (page, index) => {
  await page.evaluate(i => document.querySelectorAll('.grid-cols-5 button')[i]?.click(), index);
  await sleep(1800);
};

const FONT = `<link href="https://fonts.googleapis.com/css2?family=Fredoka:wght@600;700&family=M+PLUS+Rounded+1c:wght@800&family=Jua&display=swap" rel="stylesheet">`;
const family = lang => (lang === 'ja' ? "'M PLUS Rounded 1c'" : lang === 'ko' ? 'Jua' : 'Fredoka');

const shotHtml = (lang, img, caption, [c1, c2]) => `<!doctype html><html lang="${lang}"><head><meta charset="utf-8">${FONT}<style>
  html,body{margin:0;width:1080px;height:1920px;overflow:hidden}
  body{background:linear-gradient(180deg,${c1},${c2});font-family:${family(lang)},sans-serif;display:flex;flex-direction:column;align-items:center}
  h1{color:#fff;font-size:${caption.replace(/<br>/g, '').length > 44 ? 66 : 76}px;line-height:1.1;text-align:center;margin:110px 40px 0;text-shadow:0 4px 18px rgba(0,0,0,.25);font-weight:700;height:170px;display:flex;align-items:center;justify-content:center}
  .phone{margin-top:40px;width:760px;height:1520px;border-radius:64px;overflow:hidden;border:14px solid #10172a;box-shadow:0 30px 80px rgba(0,0,0,.35);background:#000}
  .phone img{width:100%;height:100%;object-fit:cover;object-position:top;display:block}
</style></head><body><h1>${caption}</h1><div class="phone"><img src="${img}"></div></body></html>`;

const featureHtml = (lang, tagline) => {
  const a = (n, c) => fileUrl(path.join(ANIMALI, n, c + '.webp'));
  return `<!doctype html><html lang="${lang}"><head><meta charset="utf-8">${FONT}<style>
  html,body{margin:0;width:1024px;height:500px;overflow:hidden}
  body{background:linear-gradient(180deg,#2184fe,#46a6fd 55%,#8bcbfc);font-family:${family(lang)},sans-serif;position:relative}
  .t{position:absolute;left:52px;top:140px;color:#fff;text-shadow:0 4px 16px rgba(0,0,0,.25)}
  .t h1{font-family:Fredoka,sans-serif;font-size:88px;margin:0;line-height:1;font-weight:700}
  .t p{font-size:34px;margin:18px 0 0;font-weight:700;max-width:440px;line-height:1.15}
  img{position:absolute;filter:drop-shadow(0 10px 16px rgba(0,0,0,.25))}
</style></head><body>
  <div class="t"><h1>Meteo Zoo</h1><p>${tagline}</p></div>
  <img src="${a('pinguino', 'neve')}" style="width:165px;left:575px;top:18px">
  <img src="${a('pollo', 'sole')}" style="width:270px;left:625px;top:190px">
  <img src="${a('leone', 'pioggia')}" style="width:205px;left:805px;top:22px">
  <img src="${a('gatto', 'notte')}" style="width:150px;left:870px;top:320px">
</body></html>`;
};

async function render(page, out, file, html, w, h) {
  await page.setViewport({ width: w, height: h, deviceScaleFactor: 1 });
  const tmp = path.join(out, '_tmp.html');
  fs.writeFileSync(tmp, html);
  await page.goto(fileUrl(tmp), { waitUntil: 'networkidle0' });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: path.join(out, file) });
  fs.unlinkSync(tmp);
}

(async () => {
  const langs = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(L);
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--hide-scrollbars'] });
  for (const lang of langs) {
    const out = path.join(ROOT, lang);
    fs.mkdirSync(out, { recursive: true });
    await shot(browser, lang, out, '1-home-pollo', { url: '/', animal: 'pollo' });
    await shot(browser, lang, out, '2-home-leone', { url: '/', animal: 'leone', wx: 'pioggia' });
    await shot(browser, lang, out, '3-pioggia-pinguino', { url: '/anteprima/', animal: 'pinguino', after: p => pickCondition(p, 3) });
    await shot(browser, lang, out, '4-neve-panda', { url: '/anteprima/', animal: 'panda', after: p => pickCondition(p, 5) });
    await shot(browser, lang, out, '5-dettaglio-gatto', {
      url: '/', animal: 'gatto', wx: 'nuvoloso',
      after: async p => {
        // secondo giorno di "Prossimi giorni" (l'ultima sezione della pagina)
        await p.evaluate(() => [...document.querySelectorAll('main section')].pop()?.querySelectorAll('button')[1]?.click());
        await sleep(2000);
      },
    });
    await shot(browser, lang, out, '6-animali', { url: '/animali/', animal: 'pollo', owned: [], after: async p => {
      // la scritta del sito web ("acquistabile nell'app per Android") nell'app non c'e'
      await p.evaluate(() => document.querySelectorAll('p').forEach(e => { if (/Android/.test(e.textContent)) e.remove(); }));
    } });
    const page = await browser.newPage();
    for (const [i, [name, colors]] of SHOTS.entries()) {
      await render(page, out, name + '.png', shotHtml(lang, fileUrl(path.join(out, 'raw-' + name + '.png')), L[lang].caps[i], colors), 1080, 1920);
      fs.unlinkSync(path.join(out, 'raw-' + name + '.png'));
    }
    await render(page, out, 'grafica-in-evidenza.png', featureHtml(lang, L[lang].feat), 1024, 500);
    await page.close();
    console.log('ok', lang);
  }
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
