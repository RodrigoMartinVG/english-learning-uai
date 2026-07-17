/**
 * Dictation — el único ejercicio que NO se resuelve de oído. Ver §6.3.
 *
 * La Ejercitación 4 de la U1 es puntuación: mayúsculas, apóstrofes y signos.
 * Nada de eso suena: "its" y "it's" son acústicamente idénticos, y "french" y
 * "French" también. Forzarlo a una mecánica auditiva sería mentir.
 *
 * La conversión honesta es dictado: oís la frase y la escribís bien, con sus
 * mayúsculas y su apóstrofe. El oído da el estímulo; la ortografía es la tarea.
 */

import type { Atom, ExerciseAtom } from '../../../content/schema.ts';
import type { Mechanic } from '../types.ts';

export interface DictationRound {
  atom: ExerciseAtom;
  itemIndex: number;
  /** Lo que suena y hay que escribir, con su puntuación. */
  targets: string[];
  /** La versión cruda del material, sin puntuar. Es la pista. */
  raw: string;
  audioKey: string;
  speakerId: string;
}

export const dictation: Mechanic<DictationRound> = {
  id: 'dictation',
  name: 'Dictado',
  skill: 'retrieval',
  level: 3,
  blurb: 'Escuchá y escribí la frase con su puntuación exacta.',

  accepts(atom: Atom): boolean {
    return atom.kind === 'exercise' && atom.format === 'punctuate' && atom.items.some((i) => i.answer);
  },

  buildRound(target: Atom): DictationRound | null {
    if (target.kind !== 'exercise' || target.format !== 'punctuate') return null;
    const usable = target.items.map((item, i) => ({ item, i })).filter(({ item }) => item.answer);
    const pick = usable[Math.floor(Math.random() * usable.length)];
    if (!pick?.item.answer) return null;

    return {
      atom: target,
      itemIndex: pick.i,
      targets: pick.item.answer.accept,
      raw: pick.item.stem,
      audioKey: `${target.id}.item.${pick.i}`,
      speakerId: pick.item.speaker ?? 'narrator',
    };
  },
};
