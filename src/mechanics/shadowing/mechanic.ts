/**
 * Shadowing Lab — escuchar y repetir. Ver ARQUITECTURA.md §6.2 (mecánica 10).
 *
 * Nivel 4: producción. La primera mecánica que le pide al alumno ABRIR LA BOCA.
 * Hasta acá la app era 100% receptiva, y el objetivo del proyecto es un final oral.
 */

import type { Atom, PhraseAtom } from '../../../content/schema.ts';
import type { Mechanic } from '../types.ts';

export interface ShadowingRound {
  target: PhraseAtom;
  /** Léxico de frases parecidas, para los grammar hints del ASR. */
  neighbourhood: string[];
}

export const shadowing: Mechanic<ShadowingRound> = {
  id: 'shadowing',
  name: 'Shadowing',
  skill: 'production',
  level: 4,
  blurb: 'Escuchá, repetí en voz alta y compará con la referencia.',

  accepts(atom: Atom): boolean {
    // Frases muy largas no son shadowing, son lectura: el alumno pierde el hilo.
    return atom.kind === 'phrase' && atom.text.length <= 90;
  },

  buildRound(target: Atom, pool: Atom[]): ShadowingRound | null {
    if (target.kind !== 'phrase') return null;
    const neighbourhood = pool
      .filter((a): a is PhraseAtom => a.kind === 'phrase')
      .filter((p) => p.grammar.some((g) => target.grammar.includes(g)))
      .map((p) => p.text)
      .slice(0, 40);
    return { target, neighbourhood: [target.text, ...neighbourhood] };
  },
};
