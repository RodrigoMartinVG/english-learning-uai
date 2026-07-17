/**
 * Listening Comprehension — el micro-relato. Ver ARQUITECTURA.md §6.2.
 *
 * Suena una narración y después vienen las preguntas oficiales del material.
 * Es la única mecánica con un estímulo largo (35s en la U1): entrena sostener
 * información en memoria, no reconocer una frase suelta.
 *
 * Rescata el átomo `listening`, el último que quedaba sin mecánica.
 */

import type { Atom, ListeningAtom } from '../../../content/schema.ts';
import type { Mechanic } from '../types.ts';

export interface ListeningRound {
  target: ListeningAtom;
  questions: { q: string; options: string[]; correctIndex: number }[];
}

const shuffle = <T,>(a: T[]): T[] => {
  const x = [...a];
  for (let i = x.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [x[i], x[j]] = [x[j]!, x[i]!];
  }
  return x;
};

export const listening: Mechanic<ListeningRound> = {
  id: 'listening',
  name: 'Comprensión auditiva',
  skill: 'comprehension',
  level: 2,
  blurb: 'Escuchá un relato y respondé sobre lo que oíste.',

  accepts(atom: Atom): boolean {
    return atom.kind === 'listening' && atom.questions.length >= 2;
  },

  buildRound(target: Atom): ListeningRound | null {
    if (target.kind !== 'listening') return null;

    const questions = target.questions.map((q, i) => {
      /**
       * Los distractores son las respuestas de las OTRAS preguntas del mismo
       * relato. Es lo más honesto que hay: son plausibles, están en el mismo
       * registro y salen del material, no de una invención nuestra.
       */
      const others = target.questions
        .filter((_, k) => k !== i)
        .map((o) => o.accept[0]!)
        .filter((t) => t !== q.accept[0]);
      const options = shuffle([q.accept[0]!, ...others.slice(0, 3)]);
      return { q: q.q, options, correctIndex: options.indexOf(q.accept[0]!) };
    });

    return { target, questions };
  },
};
