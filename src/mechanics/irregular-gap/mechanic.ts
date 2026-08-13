/**
 * irregular-gap — se ven dos formas, falta una. El escalón previo al drill completo.
 *
 * Existe porque el drill de dos formas es todo-o-nada: si sabías el pasado pero no el
 * participio, fallabas entero y el SRS no se enteraba de la mitad que sí tenías. Acá
 * cada ronda pide UNA sola forma, así que el fallo es informativo.
 *
 * Nivel 2 (contra el 3 del drill completo) y sin variantes: cuál falta se sortea por
 * ronda. Es la misma memoria mirada desde otro ángulo, no otra tarjeta — multiplicar
 * tarjetas sobre 186 verbos inundaría el repaso.
 */

import type { Atom, LexemeAtom } from '../../../content/schema.ts';
import type { Mechanic } from '../types.ts';
import { keyOf, type VerbForm } from '../irregular-verbs/mechanic.ts';

export interface IrregularGapRound {
  base: string;
  gloss: string;
  past: string;
  participle: string;
  /** Cuál está tapada. */
  missing: VerbForm;
  answer: string;
  audioKey: string;
  speakerId: string;
}

const hasForms = (a: Atom): a is LexemeAtom => a.kind === 'lexeme' && !!a.forms;

export const irregularGap: Mechanic<IrregularGapRound> = {
  id: 'irregular-gap',
  name: 'Completá la forma que falta',
  skill: 'retrieval',
  level: 2,
  blurb: 'Ves dos formas del verbo; escribí la que falta.',
  accepts: hasForms,

  buildRound(target: Atom): IrregularGapRound | null {
    if (!hasForms(target)) return null;
    const f = target.forms!;
    const formas: VerbForm[] = ['base', 'past', 'participle'];
    const missing = formas[Math.floor(Math.random() * formas.length)]!;
    const answer = missing === 'base' ? target.word : missing === 'past' ? f.past : f.participle;
    return {
      base: target.word,
      gloss: target.gloss,
      past: f.past,
      participle: f.participle,
      missing,
      answer,
      // Se oye la forma que hay que producir, pero recién al revelar.
      audioKey: keyOf(target.id, missing),
      speakerId: 'narrator',
    };
  },
};
