/**
 * irregular-pattern — dadas las tres formas, ¿de qué familia es este verbo?
 *
 * Es el ángulo que convierte 186 memorizaciones en 5 reglas más excepciones. La vista
 * del drill ya mostraba el patrón, pero como dato decorativo: nunca lo preguntaba, así
 * que el alumno podía completar cien verbos sin notar que `buy` y `teach` son el mismo
 * caso.
 *
 * Habilidad `comprehension` y no `retrieval`: acá no se produce una forma, se
 * reconoce una regularidad. Eso además le da su propia tarjeta de SRS sin competir
 * con las del drill.
 */

import type { Atom, LexemeAtom } from '../../../content/schema.ts';
import type { Mechanic } from '../types.ts';

export type Pattern = 'same' | 'aba' | 'abb' | 'vowel' | 'other';

export interface IrregularPatternRound {
  base: string;
  gloss: string;
  past: string;
  participle: string;
  correct: Pattern;
  /** Las opciones, ya mezcladas. */
  options: Pattern[];
  audioKey: string;
  speakerId: string;
}

const hasForms = (a: Atom): a is LexemeAtom => a.kind === 'lexeme' && !!a.forms;

/** Los cinco patrones, siempre en el mismo orden conceptual (de más simple a menos). */
export const PATTERNS: Pattern[] = ['same', 'aba', 'abb', 'vowel', 'other'];

export const irregularPattern: Mechanic<IrregularPatternRound> = {
  id: 'irregular-pattern',
  name: 'Patrón del verbo',
  skill: 'comprehension',
  level: 2,
  blurb: 'Mirá las tres formas y decidí a qué familia pertenece.',
  accepts: hasForms,

  buildRound(target: Atom): IrregularPatternRound | null {
    if (!hasForms(target)) return null;
    const f = target.forms!;
    return {
      base: target.word,
      gloss: target.gloss,
      past: f.past,
      participle: f.participle,
      correct: f.pattern,
      // Siempre las cinco: el valor está en compararlas, no en adivinar entre dos.
      options: PATTERNS,
      audioKey: target.id,
      speakerId: 'narrator',
    };
  },
};
