/**
 * Ósmosis — escuchar y reconocer. Ver ARQUITECTURA.md §6.2 (mecánica 3).
 *
 * Suena una frase a ciegas; hay que elegir cuál era entre cuatro textos.
 * Entrena decodificación: mapear sonido → significado, sin apoyo visual previo.
 */

import type { Atom, PhraseAtom } from '../../../content/schema.ts';
import { shuffle } from '../../shared/shuffle.ts';
import type { Mechanic } from '../types.ts';

export interface OsmosisRound {
  target: PhraseAtom;
  options: PhraseAtom[];
  correctIndex: number;
}


const overlaps = (a: readonly string[], b: readonly string[]) => a.some((x) => b.includes(x));

export const osmosis: Mechanic<OsmosisRound> = {
  id: 'osmosis',
  name: 'Ósmosis',
  skill: 'comprehension',
  level: 2,
  blurb: 'Escuchá una frase y reconocé cuál era. Sin leerla antes.',

  accepts(atom: Atom): boolean {
    // Una frase de una sola palabra ("Karel.") no da para elegir entre cuatro.
    return atom.kind === 'phrase' && atom.text.split(/\s+/).length >= 3;
  },

  buildRound(target: Atom, pool: Atom[]): OsmosisRound | null {
    if (target.kind !== 'phrase') return null;
    // El pool es solo para distractores: quién es el objetivo lo decide la sesión.
    const rest = pool
      .filter((a): a is PhraseAtom => a.kind === 'phrase')
      .filter((p) => p.id !== target.id && p.text !== target.text);

    /**
     * Los distractores comparten gramática y NO comparten tema.
     *
     * Es más exigente que filtrar solo por categoría, como hacían los prototipos:
     * si las cuatro opciones tienen la misma estructura, el alumno no puede
     * descartarlas por la forma y tiene que decodificar el significado. Que es,
     * justamente, lo único que esta mecánica dice entrenar.
     */
    const ideal = rest.filter(
      (p) => overlaps(p.grammar, target.grammar) && !overlaps(p.topic, target.topic)
    );

    // Si el contenido no da para tanto, se relaja antes que no haber ronda.
    const distractors = shuffle(ideal).slice(0, 3);
    if (distractors.length < 3) {
      const ids = new Set([target.id, ...distractors.map((d) => d.id)]);
      distractors.push(...shuffle(rest.filter((p) => !ids.has(p.id))).slice(0, 3 - distractors.length));
    }
    if (distractors.length < 3) return null;

    const options = shuffle([target, ...distractors]);
    return { target, options, correctIndex: options.findIndex((o) => o.id === target.id) };
  },
};
