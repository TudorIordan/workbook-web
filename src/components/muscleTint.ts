import type { MuscleGroup } from '../domain/types';

/** [background var, ink var] pair for the muscle-group tint. */
export function muscleTint(muscle: MuscleGroup | string): [string, string] {
  switch (muscle) {
    case 'Chest':
    case 'Shoulders':
      return ['var(--wb-rose-tint)', 'var(--wb-accent-ink)'];
    case 'Back':
    case 'Arms':
      return ['var(--wb-green-tint)', 'var(--wb-green-ink)'];
    case 'Legs':
    case 'Core':
    default:
      return ['var(--wb-sand-tint)', 'var(--wb-sand-ink)'];
  }
}
