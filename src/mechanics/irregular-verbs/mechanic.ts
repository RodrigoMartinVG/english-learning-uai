/**
 * irregular-verbs — drill de formas: dado el infinitivo, producir pasado y participio.
 *
 * Acepta cualquier `lexeme` que tenga `forms` (los verbos irregulares del núcleo).
 * Es el ángulo "por patrón" del tema Verbos irregulares: no enseña el significado
 * (eso lo hace Vocabulario), sino las tres formas.
 */

import type { Atom, LexemeAtom } from '../../../content/schema.ts';
import type { Mechanic } from '../types.ts';

export interface IrregularRound {
  base: string;
  gloss: string;
  past: string;
  participle: string;
  pattern: 'same' | 'aba' | 'abb' | 'vowel' | 'other';
  /** Clave de audio del infinitivo (la palabra), para escucharlo. */
  audioKey: string;
  speakerId: string;
}

const hasForms = (a: Atom): a is LexemeAtom => a.kind === 'lexeme' && !!a.forms;

export const irregularVerbs: Mechanic<IrregularRound> = {
  id: 'irregular-verbs',
  name: 'Verbos irregulares',
  skill: 'retrieval',
  level: 3,
  blurb: 'Dado el infinitivo, completá el pasado y el participio.',
  accepts: hasForms,
  buildRound(target: Atom): IrregularRound | null {
    if (!hasForms(target)) return null;
    const f = target.forms!;
    return {
      base: target.word,
      gloss: target.gloss,
      past: f.past,
      participle: f.participle,
      pattern: f.pattern,
      audioKey: target.id,
      speakerId: 'narrator',
    };
  },
};
