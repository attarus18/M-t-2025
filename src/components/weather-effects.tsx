'use client';

import { memo, type CSSProperties } from 'react';
import type { ConditionId } from '@/lib/conditions';

/** Movimento del corpo dell'animale per ogni condizione (classi in app/animations.css). */
export const BODY_MOTION: Record<ConditionId, string> = {
  sole: 'pa-move-bob',
  nuvoloso: 'pa-move-bob',
  notte: 'pa-move-breathe',
  pioggia: 'pa-move-hop',
  neve: 'pa-move-hop',
  temporale: 'pa-move-shiver',
  freddo: 'pa-move-shiver',
  vento: 'pa-move-lean',
  caldo: 'pa-move-melt',
  nebbia: 'pa-move-drift',
};

/** Pseudo-casuale ma stabile: le particelle non "saltano" a ogni render. */
const rand = (i: number, salt: number) => {
  const x = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return x - Math.floor(x);
};
const range = (n: number) => Array.from({ length: n }, (_, i) => i);

function Rain({ count, fast = false }: { count: number; fast?: boolean }) {
  return (
    <>
      {range(count).map(i => (
        <span
          key={i}
          className="pa-drop"
          style={{
            left: `${rand(i, 1) * 115}%`,
            animationDuration: `${(fast ? 0.45 : 0.7) + rand(i, 2) * 0.4}s`,
            animationDelay: `${-rand(i, 3) * 2}s`,
            opacity: 0.4 + rand(i, 4) * 0.6,
          }}
        />
      ))}
    </>
  );
}

function Snow({ count, slow = false }: { count: number; slow?: boolean }) {
  return (
    <>
      {range(count).map(i => {
        const size = 3 + rand(i, 5) * 6;
        return (
          <span
            key={i}
            className="pa-flake"
            style={{
              left: `${rand(i, 6) * 100}%`,
              width: size,
              height: size,
              animationDuration: `${(slow ? 12 : 7) + rand(i, 7) * 6}s`,
              animationDelay: `${-rand(i, 8) * 12}s`,
              opacity: 0.5 + rand(i, 9) * 0.5,
            }}
          />
        );
      })}
    </>
  );
}

function Clouds({ count, dark = false }: { count: number; dark?: boolean }) {
  return (
    <>
      {range(count).map(i => {
        const w = 140 + rand(i, 10) * 140;
        return (
          <span
            key={i}
            className="pa-cloud"
            style={
              {
                top: `${4 + rand(i, 11) * 30}%`,
                width: w,
                height: w * 0.32,
                animationDuration: `${45 + rand(i, 12) * 40}s`,
                animationDelay: `${-rand(i, 13) * 80}s`,
                background: dark ? 'rgba(40, 44, 56, 0.6)' : undefined,
              } as CSSProperties
            }
          />
        );
      })}
    </>
  );
}

function Effects({ condition }: { condition: ConditionId }) {
  switch (condition) {
    case 'sole':
      return (
        <>
          <span className="pa-sunrays" />
          <span className="pa-sunglow" />
          <Clouds count={2} />
        </>
      );
    case 'caldo':
      return (
        <>
          <span className="pa-sunrays" style={{ width: 460, height: 460 }} />
          <span className="pa-sunglow" style={{ width: 280, height: 280 }} />
          {range(6).map(i => (
            <span
              key={i}
              className="pa-heat"
              style={{
                left: `${rand(i, 20) * 80}%`,
                animationDuration: `${4 + rand(i, 21) * 3}s`,
                animationDelay: `${-rand(i, 22) * 6}s`,
              }}
            />
          ))}
        </>
      );
    case 'notte':
      return (
        <>
          {range(40).map(i => {
            const size = 1.5 + rand(i, 30) * 2.5;
            return (
              <span
                key={i}
                className="pa-star"
                style={{
                  left: `${rand(i, 31) * 100}%`,
                  top: `${rand(i, 32) * 55}%`,
                  width: size,
                  height: size,
                  animationDuration: `${2 + rand(i, 33) * 3}s`,
                  animationDelay: `${-rand(i, 34) * 4}s`,
                }}
              />
            );
          })}
          <span className="pa-shooting" />
        </>
      );
    case 'nuvoloso':
      return <Clouds count={6} />;
    case 'pioggia':
      return (
        <>
          <Clouds count={3} dark />
          <Rain count={70} />
        </>
      );
    case 'temporale':
      return (
        <>
          <Clouds count={4} dark />
          <Rain count={110} fast />
          <span className="pa-lightning" />
        </>
      );
    case 'neve':
      return <Snow count={55} />;
    case 'freddo':
      return (
        <>
          <Snow count={15} slow />
          {range(14).map(i => (
            <span
              key={i}
              className="pa-sparkle"
              style={{
                left: `${rand(i, 40) * 95}%`,
                top: `${rand(i, 41) * 90}%`,
                fontSize: 10 + rand(i, 42) * 14,
                animationDuration: `${1.8 + rand(i, 43) * 2.5}s`,
                animationDelay: `${-rand(i, 44) * 3}s`,
              }}
            >
              ✦
            </span>
          ))}
        </>
      );
    case 'nebbia':
      return (
        <>
          {range(5).map(i => (
            <span
              key={i}
              className="pa-fog"
              style={{
                top: `${10 + i * 18}%`,
                height: 90 + rand(i, 50) * 80,
                animationDuration: `${30 + rand(i, 51) * 25}s`,
                animationDelay: `${-rand(i, 52) * 50}s`,
              }}
            />
          ))}
        </>
      );
    case 'vento':
      return (
        <>
          {range(14).map(i => (
            <span
              key={i}
              className="pa-streak"
              style={{
                top: `${5 + rand(i, 60) * 85}%`,
                width: 80 + rand(i, 61) * 160,
                animationDuration: `${0.9 + rand(i, 62) * 0.9}s`,
                animationDelay: `${-rand(i, 63) * 2}s`,
              }}
            />
          ))}
          {range(7).map(i => (
            <span
              key={`l${i}`}
              className="pa-leaf"
              style={{
                top: `${15 + rand(i, 64) * 70}%`,
                fontSize: 18 + rand(i, 65) * 14,
                animationDuration: `${3 + rand(i, 66) * 2.5}s`,
                animationDelay: `${-rand(i, 67) * 5}s`,
              }}
            >
              {i % 3 === 0 ? '🍂' : '🍃'}
            </span>
          ))}
        </>
      );
  }
}

/** Effetti meteo animati a tutto schermo, dietro ai contenuti. */
export const WeatherEffects = memo(function WeatherEffects({ condition }: { condition: ConditionId }) {
  return (
    <div className="pa-fx" aria-hidden="true">
      <Effects condition={condition} />
    </div>
  );
});
