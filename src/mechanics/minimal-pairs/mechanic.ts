/**
 * Minimal Pairs — ¿oís la diferencia? Ver ARQUITECTURA.md §6.2 (mecánicas 1 y 2).
 *
 * Nivel 1: percepción pura. Suena una oración y hay que elegir cuál de dos formas
 * casi idénticas era: it's/its, they're/their, a/an, pen/pan.
 *
 * Rescata los 5 átomos `contrast`, que hasta ahora ninguna mecánica consumía.
 *
 * El campo `discriminator` cambia la consigna, y no es un detalle:
 *  · phoneme → se oye la diferencia (pen/pan). Se entrena el oído.
 *  · syntax  → NO se oye (it's/its son idénticos). Solo el contexto decide, y
 *    la app tiene que decirlo en vez de fingir que es un ejercicio auditivo.
 */

import type { Atom, ContrastAtom } from '../../../content/schema.ts';
import type { Mechanic } from '../types.ts';

export interface MinimalPairsRound {
  atom: ContrastAtom;
  /** El ejemplo elegido, ya con el hueco resuelto. */
  example: ContrastAtom['examples'][number];
  /** La frase completa, que es lo que suena. */
  spoken: string;
  options: [string, string];
  correctIndex: 0 | 1;
}

export const minimalPairs: Mechanic<MinimalPairsRound> = {
  id: 'minimal-pairs',
  name: 'Pares mínimos',
  skill: 'perception',
  level: 1,
  blurb: 'Dos formas casi idénticas. Escuchá cuál era.',

  accepts(atom: Atom): boolean {
    return atom.kind === 'contrast' && atom.examples.length > 0;
  },

  buildRound(target: Atom): MinimalPairsRound | null {
    if (target.kind !== 'contrast') return null;
    const example = target.examples[Math.floor(Math.random() * target.examples.length)];
    if (!example) return null;

    return {
      atom: target,
      example,
      spoken: example.text.replace('___', target.pair[example.correct]!),
      options: target.pair,
      correctIndex: example.correct,
    };
  },
};
