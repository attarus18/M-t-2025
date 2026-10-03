'use client';

import { usePurchases } from '@/context/purchases-context';
import { DEFAULT_ANIMAL, getAnimal, type AnimalId } from './animals';
import { KEYS, useStored } from './storage';

/**
 * Animale scelto dall'utente. Se il suo pacchetto non risulta (piu') acquistato,
 * ad esempio dopo un rimborso, si torna al pollo senza perdere la scelta.
 */
export function useAnimal() {
  const { isAnimalUnlocked } = usePurchases();
  const [storedId, setStoredId] = useStored<AnimalId>(KEYS.animal, DEFAULT_ANIMAL);
  const chosen = getAnimal(storedId);
  const animal = isAnimalUnlocked(chosen) ? chosen : getAnimal(DEFAULT_ANIMAL);
  return { animal, setAnimal: setStoredId };
}
