/**
 * Word Focus — el vocabulario suelto. Ver ARQUITECTURA.md §6.2.
 *
 * Suena una palabra aislada y hay que reconocer qué significa. Al acertar se
 * revela su oración de ejemplo (con audio), el foco fonético que el material
 * sugiere y la variante UK/US si la tiene.
 *
 * Rescata los 18 átomos `lexeme`, que era el grupo muerto más grande.
 */

import type { Atom, LexemeAtom, PhraseAtom } from '../../../content/schema.ts';
import { shuffle } from '../../shared/shuffle.ts';
import type { Mechanic } from '../types.ts';

export interface WordFocusRound {
  target: LexemeAtom;
  example: PhraseAtom | null;
  options: string[];
  correctIndex: number;
}


export const wordFocus: Mechanic<WordFocusRound> = {
  id: 'word-focus',
  name: 'Vocabulario',
  skill: 'comprehension',
  level: 1,
  blurb: 'Escuchá una palabra y reconocé qué significa.',

  accepts(atom: Atom): boolean {
    return atom.kind === 'lexeme';
  },

  buildRound(target: Atom, pool: Atom[]): WordFocusRound | null {
    if (target.kind !== 'lexeme') return null;

    const others = pool
      .filter((a): a is LexemeAtom => a.kind === 'lexeme' && a.id !== target.id)
      .filter((l) => l.gloss !== target.gloss);
    if (others.length < 3) return null;

    /**
     * Distractores de la MISMA clase de palabra cuando alcanza: elegir entre
     * tres sustantivos es un ejercicio; entre un sustantivo, un verbo y un
     * adverbio se resuelve por gramática y no por significado.
     */
    const sameClass = others.filter((l) => l.pos === target.pos);
    const bag = sameClass.length >= 3 ? sameClass : others;
    const distractors = shuffle(bag).slice(0, 3).map((l) => l.gloss);

    const options = shuffle([target.gloss, ...distractors]);
    const example = pool.find(
      (a): a is PhraseAtom => a.kind === 'phrase' && a.id === target.examplePhraseId
    ) ?? null;

    return { target, example, options, correctIndex: options.indexOf(target.gloss) };
  },
};
