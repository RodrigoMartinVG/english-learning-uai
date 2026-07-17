/**
 * Question Former — oís una afirmación, producís la pregunta.
 * Ver ARQUITECTURA.md §6.2. Nace de la Ejercitación 10 de la U1.
 *
 * Nivel 5: es lo más parecido a un examinador que hay antes del examen. No
 * repetís ni elegís: tenés que construir una interrogativa desde cero, con la
 * palabra Wh- correcta y la inversión bien hecha, y decirla.
 *
 * La reconstrucción ya lo marcaba: "excelente ejercicio de producción libre
 * guiada de voz".
 */

import type { Atom, ExerciseAtom } from '../../../content/schema.ts';
import type { Mechanic } from '../types.ts';

export interface QuestionFormerRound {
  atom: ExerciseAtom;
  itemIndex: number;
  /** La afirmación que suena. */
  statement: string;
  /** Las preguntas que damos por válidas. */
  targets: string[];
  audioKey: string;
  speakerId: string;
  neighbourhood: string[];
}

export const questionFormer: Mechanic<QuestionFormerRound> = {
  id: 'question-former',
  name: 'Formular la pregunta',
  skill: 'production',
  level: 5,
  blurb: 'Escuchá una afirmación y preguntá lo que corresponde.',

  accepts(atom: Atom): boolean {
    return atom.kind === 'exercise' && atom.format === 'transform' && atom.items.some((i) => i.answer);
  },

  buildRound(target: Atom): QuestionFormerRound | null {
    if (target.kind !== 'exercise' || target.format !== 'transform') return null;
    const usable = target.items.map((item, i) => ({ item, i })).filter(({ item }) => item.answer);
    const pick = usable[Math.floor(Math.random() * usable.length)];
    if (!pick?.item.answer) return null;

    return {
      atom: target,
      itemIndex: pick.i,
      statement: pick.item.stem,
      targets: pick.item.answer.accept,
      // El audio del ítem es la RESPUESTA (la pregunta correcta): sirve de
      // referencia al terminar, no antes. La afirmación se lee en pantalla.
      audioKey: `${target.id}.item.${pick.i}`,
      speakerId: pick.item.speaker ?? 'narrator',
      neighbourhood: target.items.flatMap((it) => it.answer?.accept ?? []),
    };
  },
};
