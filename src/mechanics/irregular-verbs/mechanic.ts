/**
 * irregular-verbs — drill de formas: dada UNA forma, producir las otras dos.
 *
 * Acepta cualquier `lexeme` con `forms` (los verbos irregulares).
 *
 * Arranca por la forma que diga la variante, no siempre por el infinitivo. Reconocer
 * *brought* y llegar a *bring* es una memoria distinta de producir *bring → brought*,
 * y el SRS las trata como tarjetas separadas — el mismo criterio que el Role-play usa
 * para los papeles de un diálogo.
 *
 * Dos variantes y no tres: agregar "desde el participio" multiplicaría por 1,5 el
 * repaso de 186 verbos para entrenar el camino menos frecuente.
 */

import type { Atom, LexemeAtom } from '../../../content/schema.ts';
import { verbPastKey, verbParticipleKey } from '../../../content/schema.ts';
import type { Mechanic } from '../types.ts';

/** Desde qué forma se arranca. */
export type VerbForm = 'base' | 'past' | 'participle';

export interface IrregularRound {
  base: string;
  gloss: string;
  past: string;
  participle: string;
  pattern: 'same' | 'aba' | 'abb' | 'vowel' | 'other';
  /** Qué forma se MUESTRA; las otras dos hay que producirlas. */
  given: VerbForm;
  /** Clave de audio de la forma mostrada. */
  audioKey: string;
  speakerId: string;
}

const hasForms = (a: Atom): a is LexemeAtom => a.kind === 'lexeme' && !!a.forms;

/** La clave de audio de cada forma: la base es el id del átomo, las otras dos derivan. */
export const keyOf = (atomId: string, form: VerbForm): string =>
  form === 'base' ? atomId : form === 'past' ? verbPastKey(atomId) : verbParticipleKey(atomId);

export const irregularVerbs: Mechanic<IrregularRound> = {
  id: 'irregular-verbs',
  name: 'Verbos irregulares',
  skill: 'retrieval',
  level: 3,
  blurb: 'Te damos una forma; producí las otras dos.',
  accepts: hasForms,

  // El orden importa: primero desde el infinitivo, que es como se aprenden.
  variants: (a: Atom) => (hasForms(a) ? ['base', 'past'] : []),

  buildRound(target: Atom, _pool: Atom[], variant?: string): IrregularRound | null {
    if (!hasForms(target)) return null;
    const f = target.forms!;
    const given: VerbForm = variant === 'past' ? 'past' : 'base';
    return {
      base: target.word,
      gloss: target.gloss,
      past: f.past,
      participle: f.participle,
      pattern: f.pattern,
      given,
      audioKey: keyOf(target.id, given),
      speakerId: 'narrator',
    };
  },
};
