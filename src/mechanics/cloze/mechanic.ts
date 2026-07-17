/**
 * Cloze auditivo — completar lo que falta, de oído. Ver ARQUITECTURA.md §6.2.
 *
 * Suena la oración COMPLETA y en pantalla está con huecos. Hay que reponer las
 * piezas que faltan eligiendo del banco.
 *
 * Es la traducción honesta de media Ejercitación del TP: la 1 (I/you/my/your),
 * la 2 (la caja de contracciones), la 3, la 6, la 8 y la 9 (a/an/the). El
 * material las pensó como escritura; acá el estímulo es el oído y la decisión
 * sigue siendo gramatical, que es lo que esos ejercicios entrenan.
 *
 * Rescata los 8 átomos `exercise` de formato cloze.
 */

import { BLANK, type Atom, type ExerciseAtom } from '../../../content/schema.ts';
import type { Mechanic } from '../types.ts';

export interface ClozeRound {
  atom: ExerciseAtom;
  itemIndex: number;
  stem: string;
  /** Una entrada por hueco, en orden. */
  blanks: { accept: string[]; officialKey?: string; note?: string }[];
  /** El banco de opciones. Incluye las correctas y distractores del mismo ejercicio. */
  bank: string[];
  speakerId: string;
  audioKey: string;
  /** La oración ya completa: es lo que suena. */
  spoken: string;
}

const shuffle = <T,>(a: T[]): T[] => {
  const x = [...a];
  for (let i = x.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [x[i], x[j]] = [x[j]!, x[i]!];
  }
  return x;
};

export const fill = (stem: string, answers: string[]): string => {
  let i = 0;
  return stem.split(BLANK).reduce((acc, part, idx) => (idx === 0 ? part : acc + (answers[i++] ?? BLANK) + part));
};

export const cloze: Mechanic<ClozeRound> = {
  id: 'cloze',
  name: 'Completar',
  skill: 'retrieval',
  level: 3,
  blurb: 'Escuchá la oración completa y reponé las palabras que faltan.',

  accepts(atom: Atom): boolean {
    return (
      atom.kind === 'exercise' &&
      atom.format === 'cloze' &&
      atom.audioViable !== 'text-only' &&
      atom.items.some((i) => (i.blanks?.length ?? 0) > 0)
    );
  },

  buildRound(target: Atom): ClozeRound | null {
    if (target.kind !== 'exercise' || target.format !== 'cloze') return null;

    const usable = target.items
      .map((item, i) => ({ item, i }))
      .filter(({ item }) => (item.blanks?.length ?? 0) > 0);
    const pick = usable[Math.floor(Math.random() * usable.length)];
    if (!pick?.item.blanks) return null;

    const answers = pick.item.blanks.map((b) => b.accept[0]!);

    /**
     * El banco sale del EJERCICIO ENTERO, no solo del ítem: así los distractores
     * son las otras opciones reales de la consigna (la "caja" que el material ya
     * da en la Ejercitación 2), y no palabras traídas de cualquier lado.
     */
    const bank = [
      ...new Set(target.items.flatMap((it) => (it.blanks ?? []).flatMap((b) => b.accept))),
    ];

    return {
      atom: target,
      itemIndex: pick.i,
      stem: pick.item.stem,
      blanks: pick.item.blanks,
      bank: shuffle(bank),
      speakerId: pick.item.speaker ?? 'narrator',
      audioKey: `${target.id}.item.${pick.i}`,
      spoken: fill(pick.item.stem, answers),
    };
  },
};
