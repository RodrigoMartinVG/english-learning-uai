/**
 * Transform — leés una pista y producís la frase transformada en voz alta.
 * Ver ARQUITECTURA.md §6.2. Consume los ejercicios `format: 'transform'`.
 *
 * Nivel 5: producción libre guiada. No repetís ni elegís: transformás desde cero
 * (la Wh- correcta, la inversión, el posesivo, el adverbio en su lugar…) y lo decís.
 *
 * El material NO trae un solo tipo de transformación: hay "Ask questions"
 * (respuesta→pregunta), "requests with can" (situación→pedido), "third person",
 * "frequency adverb", posesivo, etc. Por eso NO se hardcodea una consigna: se
 * pasa el `prompt` real del ejercicio y la vista muestra el encuadre que
 * corresponde. Antes se enmarcaba todo como "¿qué pregunta lleva a esa
 * respuesta?", y con una situación ("You want a student's phone number") o una
 * reescritura ("the desk of Sam") eso quedaba meta o directamente incorrecto.
 */

import type { Atom, ExerciseAtom } from '../../../content/schema.ts';
import type { Mechanic } from '../types.ts';

export interface QuestionFormerRound {
  atom: ExerciseAtom;
  itemIndex: number;
  /** La consigna original del ejercicio (define cómo se encuadra en pantalla). */
  prompt: string;
  /** La pista: la respuesta, la situación o la frase a reescribir. */
  statement: string;
  /** Las formas que damos por válidas. */
  targets: string[];
  audioKey: string;
  speakerId: string;
  neighbourhood: string[];
}

export const questionFormer: Mechanic<QuestionFormerRound> = {
  id: 'question-former',
  name: 'Transformá la frase',
  skill: 'production',
  level: 5,
  blurb: 'Leé la pista y producí la frase transformada en voz alta.',

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
      prompt: target.prompt,
      statement: pick.item.stem,
      targets: pick.item.answer.accept,
      // El audio del ítem es el RESULTADO (la frase correcta): referencia al
      // terminar, no antes. La pista se lee en pantalla.
      audioKey: `${target.id}.item.${pick.i}`,
      speakerId: pick.item.speaker ?? 'narrator',
      neighbourhood: target.items.flatMap((it) => it.answer?.accept ?? []),
    };
  },
};
