/**
 * Ping-Pong — la app pregunta, el alumno responde por voz.
 * Ver ARQUITECTURA.md §6.2 (mecánica 11).
 *
 * Nivel 4: recuperación bajo presión. No es repetir: es producir una respuesta
 * propia y válida. Rescata los 12 átomos `qa`, que ninguna mecánica consumía.
 */

import type { Atom, QaAtom } from '../../../content/schema.ts';
import type { Mechanic } from '../types.ts';

export interface PingPongRound {
  target: QaAtom;
  /** Todas las respuestas que damos por buenas. */
  accepted: string[];
  neighbourhood: string[];
}

export const pingPong: Mechanic<PingPongRound> = {
  id: 'ping-pong',
  name: 'Ping-Pong',
  skill: 'retrieval',
  level: 4,
  blurb: 'La app pregunta. Respondé en voz alta, sin leer.',

  accepts(atom: Atom): boolean {
    return atom.kind === 'qa' && atom.replies.length > 0;
  },

  buildRound(target: Atom, pool: Atom[]): PingPongRound | null {
    if (target.kind !== 'qa') return null;
    // Cualquier respuesta natural vale: no hay UNA respuesta correcta a
    // "Where are you from?". Aceptamos todas las que el material da por buenas.
    const accepted = target.replies;
    const neighbourhood = pool
      .filter((a): a is QaAtom => a.kind === 'qa')
      .flatMap((q) => q.replies)
      .slice(0, 40);
    return { target, accepted, neighbourhood: [...accepted, ...neighbourhood] };
  },
};
