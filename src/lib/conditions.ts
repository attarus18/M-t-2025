import { kmh, type WeatherCondition } from './weather';

/**
 * Le "scene" che ogni animale sa interpretare. Ogni animale ha un'illustrazione
 * per ognuna, in public/animali/<animale>/<condizione>.webp.
 */
export const CONDITIONS = [
  'sole',
  'notte',
  'nuvoloso',
  'pioggia',
  'temporale',
  'neve',
  'nebbia',
  'vento',
  'caldo',
  'freddo',
] as const;

export type ConditionId = (typeof CONDITIONS)[number];

export const CONDITION_INFO: Record<
  ConditionId,
  { label: string; emoji: string; background: string; /** cosa indossa/fa l'animale nell'illustrazione */ scene: string }
> = {
  sole: {
    label: 'Sole',
    emoji: '😎',
    background: 'from-[#2c88f7] to-[#86c0f8]',
    scene: 'wearing cool sunglasses, relaxed and happy under a bright sun',
  },
  notte: {
    label: 'Notte serena',
    emoji: '🌙',
    background: 'from-[#0f1026] via-[#1a1c38] to-[#2b2d55]',
    scene: 'wearing a nightcap and pajamas, sleepy, holding a small lantern, with a crescent moon and stars',
  },
  nuvoloso: {
    label: 'Nuvoloso',
    emoji: '☁️',
    background: 'from-[#6b7b8c] to-[#a3b1c2]',
    scene: 'lying on a fluffy cloud, looking bored and a little grumpy',
  },
  pioggia: {
    label: 'Pioggia',
    emoji: '☔',
    background: 'from-[#3a4b66] to-[#6a7a92]',
    scene: 'holding a colorful umbrella and wearing rain boots, raindrops falling, jumping in a puddle',
  },
  temporale: {
    label: 'Temporale',
    emoji: '⚡',
    background: 'from-[#23252d] to-[#4a4d5a]',
    scene: 'hiding scared under a blanket with a lightning bolt and dark storm cloud above',
  },
  neve: {
    label: 'Neve',
    emoji: '⛄',
    background: 'from-[#8f9bb0] to-[#d3dcea]',
    scene: 'wearing a woolly hat and mittens, building a small snowman, snowflakes falling',
  },
  nebbia: {
    label: 'Nebbia',
    emoji: '🌫️',
    background: 'from-[#5d6973] to-[#9aa4ac]',
    scene: 'squinting through thick fog, holding a flashlight, looking confused',
  },
  vento: {
    label: 'Vento',
    emoji: '🧣',
    background: 'from-[#4f86c6] to-[#9cc3e6]',
    scene: 'with a long scarf flapping wildly in strong wind, leaves flying, leaning against the wind',
  },
  caldo: {
    label: 'Caldo torrido',
    emoji: '🥵',
    background: 'from-[#f7792c] to-[#fbc76b]',
    scene: 'sweating, sitting in a small inflatable pool with an ice cream, under a scorching sun',
  },
  freddo: {
    label: 'Gelo',
    emoji: '🥶',
    background: 'from-[#3b6fa8] to-[#a9d4f5]',
    scene: 'shivering wrapped in a thick blanket, holding a hot cup of cocoa, frost around',
  },
};

/** Soglie oltre le quali la temperatura o il vento "vincono" sul cielo. */
const HOT_C = 32;
const COLD_C = 0;
const WINDY_KMH = 38;

/**
 * Sceglie la scena da mostrare. Ordine: fenomeni forti (temporale, neve, pioggia,
 * nebbia) > vento forte > caldo/gelo > cielo (sole/notte/nuvoloso).
 * Codici OpenWeatherMap: https://openweathermap.org/weather-conditions
 */
export function pickCondition(input: {
  weather: WeatherCondition;
  temp: number;
  windMs: number;
  gustMs?: number;
}): ConditionId {
  const { id, icon } = input.weather;
  const isNight = icon.endsWith('n');
  const wind = kmh(Math.max(input.windMs, (input.gustMs ?? 0) * 0.7));

  if (id >= 200 && id < 300) return 'temporale';
  if (id >= 600 && id < 700) return 'neve';
  if ((id >= 300 && id < 400) || (id >= 500 && id < 600)) return 'pioggia';
  if (id === 781 || id === 771) return 'vento'; // tornado, raffiche
  if (id >= 700 && id < 800) return 'nebbia';
  if (wind >= WINDY_KMH) return 'vento';
  if (input.temp >= HOT_C && !isNight) return 'caldo';
  if (input.temp <= COLD_C) return 'freddo';
  if (id === 800 || id === 801) return isNight ? 'notte' : 'sole';
  return 'nuvoloso';
}
