import type { ConditionId } from './conditions';
import type { PackId } from './packs';
import { EXTRA_ANIMALS } from './animals-extra';
import ANIMAL_IMAGES from './animal-images.json';

export type AnimalId = string;

export interface Animal {
  id: AnimalId;
  name: string;
  emoji: string;
  /** Pacchetto di appartenenza: "base" e' gratis, gli altri si comprano. */
  pack: PackId;
  tagline: string;
  /** Descrizione in inglese usata nei prompt per generare le illustrazioni. */
  promptSubject: string;
  phrases: Record<ConditionId, string[]>;
}

const BASE_ANIMALS: Animal[] = [
  {
    id: 'pollo',
    name: 'Pollo',
    emoji: '🐔',
    pack: 'base',
    tagline: 'Il meteorologo più ruspante del pollaio',
    promptSubject: 'a chubby white chicken with a red comb and orange beak',
    phrases: {
      sole: [
        'Oggi si razzola in spiaggia, occhiali da sole e cresta al vento!',
        'Sole pieno: il pollaio è aperto per abbronzatura.',
        'Coccodè-state! Crema solare sulle piume, mi raccomando.',
      ],
      notte: [
        'Cielo stellato, io però alle 8 sono già sul trespolo.',
        'Notte serena: domani canto alle 5, siete avvisati.',
        'Buonanotte dal pollaio. Contate le stelle, io conto le uova.',
      ],
      nuvoloso: [
        'Nuvole ovunque: giornata da pollo lesso sul divano.',
        'Cielo grigio come il mio umore senza mangime.',
        'Il sole si è nascosto. Forse ha paura del gallo.',
      ],
      pioggia: [
        'Piove! Ombrello aperto, stivali ai piedi e niente pozzanghere... forse.',
        'Tempo da polli bagnati. E io lo so bene.',
        'Pioggia in arrivo: oggi non si razzola, si sguazza!',
      ],
      temporale: [
        'Tuoni e fulmini! Io mi nascondo sotto la chioccia.',
        'Temporale: meglio restare al coperto, parola di pollo.',
        'Ogni tuono è un coccodè di paura. State al sicuro!',
      ],
      neve: [
        'Nevica! Oggi faccio il pupazzo di neve... a forma di uovo.',
        'Neve fresca: cappellino di lana sulla cresta e via!',
        'Tutto bianco! Almeno le mie piume sono in tinta.',
      ],
      nebbia: [
        'Nebbia fitta: non vedo neanche il mio becco.',
        'Con questa nebbia rischio di finire nel pollaio sbagliato.',
        'Nebbia in Val Padana e nel mio cervello da pollo.',
      ],
      vento: [
        'Vento forte! Tenetevi la sciarpa, io mi tengo le piume.',
        'Oggi volo anche senza saper volare. Grazie, vento!',
        'Raffiche in arrivo: pollo avvisato, mezzo salvato.',
      ],
      caldo: [
        'Che caldo! Qui si rischia il pollo arrosto.',
        'Gradi da girarrosto: piscinetta e ghiacciolo, subito!',
        'Oggi le uova si cuociono da sole sul marciapiede.',
      ],
      freddo: [
        'Gelo! Mi sento un pollo surgelato.',
        'Fa così freddo che ho la pelle d\'oca. Ah no, di pollo.',
        'Cioccolata calda e coperta: oggi non esco dal pollaio.',
      ],
    },
  },
  {
    id: 'gatto',
    name: 'Gatto',
    emoji: '🐱',
    pack: 'base',
    tagline: 'Previsioni affidabili tra un pisolino e l\'altro',
    promptSubject: 'a fluffy orange tabby cat with big green eyes',
    phrases: {
      sole: [
        'Sole perfetto: trovo un raggio sul davanzale e non mi muovo più.',
        'Giornata da gatto in vacanza. Cioè come tutte le altre.',
        'Miao-gnifico! Occhiali da sole e pancia all\'aria.',
      ],
      notte: [
        'Notte serena: ora di correre per casa alle 3.',
        'Luna piena, miagolii garantiti. Scusate i vicini.',
        'Cielo limpido: perfetto per cacciare falene immaginarie.',
      ],
      nuvoloso: [
        'Nuvoloso: nessun raggio di sole da inseguire. Che noia.',
        'Cielo grigio, gatto grigio. Pisolino obbligatorio.',
        'Tempo da divano. Il mio preferito, in realtà.',
      ],
      pioggia: [
        'Piove. Io l\'acqua la odio: esco solo con l\'ombrello.',
        'Pioggia! Guardo le gocce sul vetro per ore. Ipnotico.',
        'Oggi niente giardino: la lettiera è il mio unico viaggio.',
      ],
      temporale: [
        'Temporale! Sono sotto il letto, non cercatemi.',
        'Tuoni? Io non ho paura. Sto solo controllando sotto il divano.',
        'Fulmini in arrivo: coda gonfia e occhi sgranati.',
      ],
      neve: [
        'Neve! La tocco con una zampa... e rientro subito.',
        'Tutto bianco: il mondo è diventato una lettiera gigante.',
        'Nevica: berretto di lana e muffole, ma solo per la foto.',
      ],
      nebbia: [
        'Nebbia: perfetta per apparire all\'improvviso e spaventare tutti.',
        'Non vedo niente, ma tanto ho i baffi-radar.',
        'Nebbia fitta: giornata ideale per un gatto ninja.',
      ],
      vento: [
        'Vento forte: pelo spettinato e dignità a rischio.',
        'Raffiche! La mia sciarpa vola, io resto aggrappato alla tenda.',
        'Oggi le foglie scappano e io le inseguo tutte.',
      ],
      caldo: [
        'Caldo torrido: mi sciolgo sulle piastrelle del bagno.',
        'Troppo caldo anche per fare le fusa.',
        'Pelo lungo e 35 gradi: chi mi ha progettato?',
      ],
      freddo: [
        'Gelo: il termosifone è mio, prenotato.',
        'Freddo polare: mi infilo sotto la coperta e non esco fino a marzo.',
        'Fa così freddo che mi faccio accarezzare volentieri. Oggi sì.',
      ],
    },
  },
  {
    id: 'cane',
    name: 'Cane',
    emoji: '🐶',
    pack: 'casa',
    tagline: 'Entusiasta di ogni tempo, soprattutto del sole',
    promptSubject: 'a happy golden retriever puppy with floppy ears',
    phrases: {
      sole: [
        'SOLE! PARCO! PALLINA! È la giornata più bella di sempre!',
        'Occhiali da sole e coda che gira: oggi si corre!',
        'Bau-tiful day! Chi mi porta fuori?',
      ],
      notte: [
        'Notte serena: ululo alla luna, ma con educazione.',
        'Cielo stellato e cuccia calda. Sogno di rincorrere gatti.',
        'Ultimo giretto e poi a nanna. Domani si ricomincia!',
      ],
      nuvoloso: [
        'Nuvoloso? Non importa, ogni passeggiata è un\'avventura!',
        'Cielo grigio, ma la mia coda è sempre allegra.',
        'Niente sole, però le pozzanghere di ieri ci sono ancora!',
      ],
      pioggia: [
        'Piove! Ombrello per voi, pozzanghere per me.',
        'Pioggia: tornerò a casa bagnato e mi scrollerò sul divano.',
        'Oggi odore di cane bagnato garantito. Scusate in anticipo.',
      ],
      temporale: [
        'Tuoni! Posso dormire nel lettone stanotte? Per favore?',
        'Temporale: mi rifugio tra le vostre gambe.',
        'Fulmini in arrivo, coraggio... ma dov\'è il divano?',
      ],
      neve: [
        'NEVE! Ci salto dentro con tutte e quattro le zampe!',
        'Nevica: oggi scavo buche bianchissime.',
        'Cappellino di lana e naso gelato. Felicità pura!',
      ],
      nebbia: [
        'Nebbia: per fortuna il mio naso vede meglio degli occhi.',
        'Non vedo il parco, ma lo sento. È lì. Andiamo!',
        'Nebbia fitta: restate vicini al guinzaglio.',
      ],
      vento: [
        'Vento! Orecchie al vento come dal finestrino dell\'auto!',
        'Raffiche forti: la sciarpa vola e io la rincorro.',
        'Oggi il vento porta mille odori nuovi. Che festa!',
      ],
      caldo: [
        'Caldo torrido: lingua di fuori e ciotola sempre piena.',
        'Troppo caldo! Portatemi al mare o almeno sotto l\'irrigatore.',
        'Passeggiate solo all\'alba e al tramonto: l\'asfalto scotta!',
      ],
      freddo: [
        'Gelo: oggi il cappottino lo metto volentieri.',
        'Fa freddo, ma la passeggiata non si salta!',
        'Zampe gelate, cuore caldo. E un biscotto, magari?',
      ],
    },
  },
  {
    id: 'pinguino',
    name: 'Pinguino',
    emoji: '🐧',
    pack: 'mare',
    tagline: 'Esperto di freddo, in crisi col caldo',
    promptSubject: 'a small round penguin with a yellow beak and rosy cheeks',
    phrases: {
      sole: [
        'Sole? Per me è già estate tropicale. Crema protezione 100!',
        'Occhiali da sole e smoking: il pinguino più elegante della spiaggia.',
        'Bella giornata, ma dov\'è il ghiaccio?',
      ],
      notte: [
        'Notte serena: sembra quasi l\'Antartide. Quasi.',
        'Stelle limpide, sogno un iceberg tutto per me.',
        'Buonanotte! Mi stringo alla colonia e dormo in piedi.',
      ],
      nuvoloso: [
        'Nuvoloso: finalmente niente sole negli occhi!',
        'Cielo grigio, piume nere e bianche. Tutto abbinato.',
        'Tempo perfetto per una lunga scivolata sulla pancia.',
      ],
      pioggia: [
        'Piove? Io sono impermeabile, ma l\'ombrello fa stile.',
        'Pioggia: finalmente il mondo è un po\' più simile al mare.',
        'Pozzanghere ovunque: ci faccio i tuffi!',
      ],
      temporale: [
        'Temporale: tutti stretti in colonia, nessuno resti fuori!',
        'Tuoni e lampi: mi infilo sotto l\'ala del vicino.',
        'Meglio restare al riparo, parola di pinguino.',
      ],
      neve: [
        'NEVE! Finalmente il mio clima. Oggi scivolo ovunque!',
        'Nevica: mi sento a casa. Qualcuno mi porti un pesce.',
        'Bufera bianca? Io la chiamo mercoledì.',
      ],
      nebbia: [
        'Nebbia fitta: come il mare d\'inverno al Polo.',
        'Non vedo niente, seguo il pinguino davanti a me.',
        'Nebbia: attenti a non scambiarmi per un bidone.',
      ],
      vento: [
        'Vento forte: la sciarpa vola, io resto piantato sulle zampette.',
        'Raffiche polari? Dilettanti.',
        'Con questo vento scivolo anche in salita!',
      ],
      caldo: [
        'CALDO TORRIDO. Sto per diventare una pozzanghera.',
        'Mi trasferisco nel freezer, citofonate lì.',
        'Oggi solo ghiaccioli e piscinetta. Aiuto!',
      ],
      freddo: [
        'Gelo? Finalmente si respira!',
        'Sotto zero: il mio numero preferito.',
        'Fa freddo? Io ho caldo. Ma la cioccolata la prendo lo stesso.',
      ],
    },
  },
  {
    id: 'rana',
    name: 'Rana',
    emoji: '🐸',
    pack: 'bosco',
    tagline: 'Più piove, più è contenta',
    promptSubject: 'a cute bright green frog with big round eyes',
    phrases: {
      sole: [
        'Sole: tintarella sulla ninfea, ma senza seccarsi troppo.',
        'Bella giornata! Salto da una foglia all\'altra con gli occhiali da sole.',
        'Sole pieno: crema idratante obbligatoria per la pelle da rana.',
      ],
      notte: [
        'Notte serena: stasera concerto di cra-cra nello stagno.',
        'Cielo stellato, zanzare in arrivo. Cena servita!',
        'Buonanotte dallo stagno. Il coro sta per cominciare.',
      ],
      nuvoloso: [
        'Nuvoloso: sento odore di pioggia. Che bello!',
        'Cielo grigio, promettente. Incrocio le zampe palmate.',
        'Nuvole in arrivo: preparo il costume.',
      ],
      pioggia: [
        'PIOVE! La giornata più bella dell\'anno!',
        'Pioggia: l\'ombrello lo porto solo per non sembrare strana.',
        'Pozzanghere ovunque: il mondo intero è il mio stagno!',
      ],
      temporale: [
        'Temporale: ottimo per lo stagno, meno per i nervi.',
        'Tuoni! Mi tuffo sott\'acqua e aspetto.',
        'Fulmini in zona: stasera niente concerto.',
      ],
      neve: [
        'Neve: io vado in letargo, svegliatemi a primavera.',
        'Nevica! Sciarpina, berretto e sonno profondo nel fango.',
        'Troppo freddo per saltare: mi congelo in stile rana.',
      ],
      nebbia: [
        'Nebbia sullo stagno: atmosfera da film horror. Cra!',
        'Non vedo la ninfea, speriamo di non saltare nel vuoto.',
        'Nebbia fitta: umidità perfetta per la mia pelle!',
      ],
      vento: [
        'Vento forte: mi aggrappo alla canna con tutte le ventose.',
        'Raffiche! La ninfea è diventata un surf.',
        'Oggi salto più lontano grazie al vento in coda.',
      ],
      caldo: [
        'Caldo torrido: lo stagno si sta asciugando, AIUTO!',
        'Troppo caldo: resto a mollo fino a sera.',
        'Pelle secca, umore secco. Serve pioggia!',
      ],
      freddo: [
        'Gelo: lo stagno è ghiacciato, pattiniamo?',
        'Sotto zero: le rane intelligenti dormono. Io sono intelligente.',
        'Fa freddissimo, cioccolata calda alla mosca?',
      ],
    },
  },
  {
    id: 'maiale',
    name: 'Maiale',
    emoji: '🐷',
    pack: 'fattoria',
    tagline: 'Ama il fango e odia le rinunce',
    promptSubject: 'a pink chubby piglet with a curly tail',
    phrases: {
      sole: [
        'Sole: bagno di fango e occhiali da sole. Relax totale.',
        'Giornata perfetta per un picnic. Porto io i panini. Tutti.',
        'Oink! Crema solare sul codino, altrimenti divento prosciutto.',
      ],
      notte: [
        'Notte serena: spuntino di mezzanotte, anzi due.',
        'Cielo stellato e pancia piena. Buonanotte!',
        'Stanotte sogno una montagna di mele.',
      ],
      nuvoloso: [
        'Nuvoloso: niente sole, ma il frigorifero è sempre aperto.',
        'Cielo grigio: giornata da divano e patatine.',
        'Nuvole? Sembrano zucchero filato. Ho fame.',
      ],
      pioggia: [
        'Piove! Il fango migliore dell\'anno sta arrivando!',
        'Pioggia: ombrello in una zampa, pozzanghera sotto le altre tre.',
        'Oggi si sguazza. Doccia dopo, forse.',
      ],
      temporale: [
        'Temporale: mi nascondo nella stalla con una scorta di ghiande.',
        'Tuoni! Il mio stomaco però brontola più forte.',
        'Meglio al coperto: il fango aspetterà.',
      ],
      neve: [
        'Neve: cappello di lana e slittino. Si scende a pancia in giù!',
        'Nevica: sembra panna montata. Posso assaggiarla?',
        'Maialino di neve: il mio capolavoro di oggi.',
      ],
      nebbia: [
        'Nebbia: seguo il profumo della cucina, non sbaglio mai.',
        'Non vedo niente, ma sento odore di torta.',
        'Nebbia fitta: occhio a dove mettete le zampe.',
      ],
      vento: [
        'Vento forte: la sciarpa vola, il codino resta arricciato.',
        'Raffiche! Tenete forte i cappelli e le merendine.',
        'Oggi il vento mi porta i profumi di tutte le cucine.',
      ],
      caldo: [
        'Caldo torrido: fango fresco e anguria. Nient\'altro.',
        'Sudo come un... no, i maiali non sudano. Per questo il fango!',
        'Troppo caldo: mi trasferisco nella piscinetta.',
      ],
      freddo: [
        'Gelo: coperta, cioccolata e biscotti. Tanti biscotti.',
        'Fa freddo: ottima scusa per mangiare di più.',
        'Sotto zero: il porcile si trasforma in igloo.',
      ],
    },
  },
  {
    id: 'panda',
    name: 'Panda',
    emoji: '🐼',
    pack: 'esotici',
    tagline: 'Previsioni lente ma sicure',
    promptSubject: 'a cuddly baby panda with black eye patches',
    phrases: {
      sole: [
        'Sole: bambù fresco e occhiali scuri. Anche se ho già le occhiaie.',
        'Bella giornata per rotolare giù dalla collina.',
        'Sole pieno: pisolino all\'ombra, ovviamente.',
      ],
      notte: [
        'Notte serena: ho dormito tutto il giorno e ora ho sonno.',
        'Cielo stellato, abbraccio il mio cuscino di bambù.',
        'Buonanotte. Ci vediamo domani, verso mezzogiorno.',
      ],
      nuvoloso: [
        'Nuvoloso: tempo perfetto per fare assolutamente niente.',
        'Cielo in bianco e nero, come me. Approvo.',
        'Nuvole morbide come la mia pancia.',
      ],
      pioggia: [
        'Piove: ombrello aperto e bambù bagnato. Croccante!',
        'Pioggia: resto sotto il mio albero preferito.',
        'Oggi rotolo nelle pozzanghere. Lentamente.',
      ],
      temporale: [
        'Temporale: mi arrotolo a palla e aspetto che passi.',
        'Tuoni! Ho fatto un salto di ben due centimetri.',
        'State al riparo e mangiate qualcosa di buono.',
      ],
      neve: [
        'Neve! Divento un panda gelato. Bianco su bianco.',
        'Nevica: slittino sulla schiena, il mio sport preferito.',
        'Berretto di lana e capriole nella neve fresca!',
      ],
      nebbia: [
        'Nebbia: sembra di stare tra le montagne cinesi.',
        'Non vedo il bambù, ma so che c\'è.',
        'Nebbia fitta: le mie occhiaie sono il faro.',
      ],
      vento: [
        'Vento forte: mi aggrappo al bambù e ondeggio.',
        'Raffiche! La sciarpa vola, io troppo pigro per rincorrerla.',
        'Oggi il vento mi pettina. Finalmente!',
      ],
      caldo: [
        'Caldo torrido: pelliccia doppia, idea pessima.',
        'Troppo caldo: mi sdraio sul ghiaccio e non mi muovo.',
        'Ghiacciolo al bambù, per favore.',
      ],
      freddo: [
        'Gelo: la mia pelliccia è pronta. Voi?',
        'Fa freddo: coperta, tè caldo e bambù.',
        'Sotto zero: giornata perfetta per un pisolino al calduccio.',
      ],
    },
  },
  {
    id: 'mucca',
    name: 'Mucca',
    emoji: '🐮',
    pack: 'fattoria',
    tagline: 'Muuuuolto precisa, parola di pascolo',
    promptSubject: 'a cute black and white spotted cow with a small bell',
    phrases: {
      sole: [
        'Sole: pascolo verde e occhiali da sole. Muuuuu-gnifico!',
        'Bella giornata: oggi il latte esce già al cioccolato.',
        'Sole pieno, erba fresca. La vita è semplice.',
      ],
      notte: [
        'Notte serena: stanotte provo a saltare la luna.',
        'Cielo stellato, campanaccio silenzioso. Buonanotte!',
        'Sogno un prato infinito di trifoglio.',
      ],
      nuvoloso: [
        'Nuvoloso: le nuvole sembrano mucche bianche. Parenti?',
        'Cielo grigio: rumino e rifletto.',
        'Tempo incerto, ma l\'erba è sempre buona.',
      ],
      pioggia: [
        'Piove: ombrello sulle corna e stivali su tutte e quattro le zampe.',
        'Pioggia: l\'erba domani sarà buonissima.',
        'Oggi niente pascolo, si rumina nella stalla.',
      ],
      temporale: [
        'Temporale: tutte nella stalla, e di corsa!',
        'Tuoni! Il campanaccio trema più di me.',
        'Fulmini in arrivo: lontani dagli alberi, mi raccomando.',
      ],
      neve: [
        'Neve: il pascolo è diventato un gelato alla panna.',
        'Nevica: berretto di lana tra le corna e via!',
        'Tutto bianco: mi mimetizzo per metà.',
      ],
      nebbia: [
        'Nebbia: seguite il campanaccio, vi porto io a casa.',
        'Non vedo il recinto. Libertà? Forse.',
        'Nebbia fitta come la panna. Muuu...',
      ],
      vento: [
        'Vento forte: il campanaccio suona da solo!',
        'Raffiche! La sciarpa vola, io resto ben piantata.',
        'Oggi il vento fa l\'onda nel prato. Che spettacolo.',
      ],
      caldo: [
        'Caldo torrido: oggi produco solo frappè.',
        'Troppo caldo: all\'ombra dell\'albero, a ruminare lentamente.',
        'Ventilatore e secchio d\'acqua fresca, grazie.',
      ],
      freddo: [
        'Gelo: latte ghiacciato in arrivo.',
        'Fa freddo: cioccolata calda, e il latte lo metto io.',
        'Sotto zero: nella stalla stretta stretta con le amiche.',
      ],
    },
  },
];

/** Tutti gli animali previsti, anche quelli ancora senza illustrazioni. */
export const ALL_ANIMALS: Animal[] = [...BASE_ANIMALS, ...EXTRA_ANIMALS];

/** Illustrazioni presenti in public/animali (elenco generato da npm run images). */
const IMAGES = ANIMAL_IMAGES as Record<string, string[]>;

export function hasImage(animal: AnimalId, condition: ConditionId) {
  return IMAGES[animal]?.includes(condition) ?? false;
}

/** Animali utilizzabili: quelli che hanno almeno l'illustrazione al sole. */
export const ANIMALS: Animal[] = ALL_ANIMALS.filter(a => hasImage(a.id, 'sole'));

/** Animali del pacchetto non ancora disegnati: mostrati come "in arrivo". */
export function comingSoonAnimals(pack: PackId): Animal[] {
  return ALL_ANIMALS.filter(a => a.pack === pack && !hasImage(a.id, 'sole'));
}

export const DEFAULT_ANIMAL: AnimalId = 'pollo';

export function getAnimal(id: string | null | undefined): Animal {
  return ANIMALS.find(a => a.id === id) ?? ANIMALS[0];
}

/** Percorso dell'illustrazione (generata con l'AI) per animale e condizione. */
export function animalImage(animal: AnimalId, condition: ConditionId) {
  return `/animali/${animal}/${condition}.webp`;
}

/**
 * Frase del giorno: stabile per tutta la giornata (non cambia a ogni refresh),
 * ma diversa da un giorno all'altro e tra una citta' e l'altra.
 */
export function pickPhrase(animal: Animal, condition: ConditionId, seed: string) {
  const list = animal.phrases[condition];
  let h = 0;
  for (const ch of `${seed}:${new Date().toDateString()}`) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return list[h % list.length];
}
