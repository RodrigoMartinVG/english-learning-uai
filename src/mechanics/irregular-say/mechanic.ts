/**
 * irregular-say — decir las tres formas en voz alta, encadenadas.
 *
 * Es como se estudian de verdad —"go, went, gone"— y es el único modo que ataca lo
 * que el teclado no puede: `read → read` pasa de /riːd/ a /red/ sin cambiar una sola
 * letra, y *bought* no se lee como se escribe.
 *
 * Habilidad `production`: tarjeta propia, distinta de la del drill escrito. Un alumno
 * puede escribir las tres formas y no poder decirlas de corrido.
 */

import type { Atom, LexemeAtom } from '../../../content/schema.ts';
import type { Mechanic } from '../types.ts';

export interface IrregularSayRound {
  base: string;
  gloss: string;
  past: string;
  participle: string;
  /** Lo que hay que decir, encadenado, tal como se recita. */
  target: string;
  /** Claves de audio de las tres formas, para escuchar la referencia. */
  keys: { base: string; past: string; participle: string };
  speakerId: string;
}

const hasForms = (a: Atom): a is LexemeAtom => a.kind === 'lexeme' && !!a.forms;

export const irregularSay: Mechanic<IrregularSayRound> = {
  id: 'irregular-say',
  name: 'Decí las tres formas',
  skill: 'production',
  level: 4,
  blurb: 'Recitá el verbo entero en voz alta: base, pasado y participio.',
  accepts: hasForms,

  buildRound(target: Atom): IrregularSayRound | null {
    if (!hasForms(target)) return null;
    const f = target.forms!;
    return {
      base: target.word,
      gloss: target.gloss,
      past: f.past,
      participle: f.participle,
      // El ASR recibe las tres separadas por coma: es como se recitan.
      target: `${target.word}, ${f.past}, ${f.participle}`,
      keys: { base: target.id, past: `${target.id}.past`, participle: `${target.id}.part` },
      speakerId: 'narrator',
    };
  },
};
