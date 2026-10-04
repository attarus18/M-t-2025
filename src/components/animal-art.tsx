'use client';

import { useEffect, useState } from 'react';
import { animalImage, hasImage, type Animal } from '@/lib/animals';
import { CONDITION_INFO, type ConditionId } from '@/lib/conditions';
import { cn } from '@/lib/utils';
import { BODY_MOTION } from '@/components/weather-effects';

/**
 * Illustrazione dell'animale vestito per il meteo. Se manca la scena usa
 * l'animale al sole, e in ultima istanza emoji animale + accessorio.
 */
export function AnimalArt({
  animal,
  condition,
  size = 240,
  className,
  animated = false,
}: {
  animal: Animal;
  condition: ConditionId;
  size?: number;
  className?: string;
  /** Muove l'animale intero in base al meteo (dondola, trema, saltella...). */
  animated?: boolean;
}) {
  // Ordine di ripiego: scena giusta, poi l'animale intero al sole, poi l'emoji.
  const preferred = hasImage(animal.id, condition)
    ? animalImage(animal.id, condition)
    : hasImage(animal.id, 'sole')
      ? animalImage(animal.id, 'sole')
      : null;
  const [broken, setBroken] = useState<string | null>(null);
  useEffect(() => setBroken(null), [preferred]);
  const src = preferred;
  const failed = !src || broken === src;

  const motion = animated ? cn('pa-body', BODY_MOTION[condition]) : undefined;

  if (failed) {
    return (
      <div
        className={cn('relative flex select-none items-center justify-center', motion, className)}
        style={{ width: size, height: size }}
        aria-label={`${animal.name}: ${CONDITION_INFO[condition].label}`}
      >
        <span style={{ fontSize: size * 0.58 }} className="leading-none drop-shadow-xl">
          {animal.emoji}
        </span>
        <span
          style={{ fontSize: size * 0.26 }}
          className="absolute bottom-[8%] right-[6%] leading-none drop-shadow-lg"
        >
          {CONDITION_INFO[condition].emoji}
        </span>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src!}
      alt={`${animal.name}: ${CONDITION_INFO[condition].label}`}
      width={size}
      height={size}
      onError={() => setBroken(src)}
      className={cn('select-none object-contain drop-shadow-2xl', motion, className)}
      draggable={false}
    />
  );
}
