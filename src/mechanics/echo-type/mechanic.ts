/**
 * Echo-type — "Al oído, escribir". Escuchás la frase o la pregunta SIN verla y la
 * escribís de memoria con el teclado.
 *
 * Es el Dictado (que hoy solo cubre el ejercicio de puntuación) abierto a los
 * ítems de las etapas. A diferencia de ese, acá NO se evalúa la ortografía exacta:
 * se normaliza (contracciones, números) y se corrige palabra por palabra con el
 * mismo motor que la voz. Recuperar del sonido, no calcar signos.
 */

import type { Atom } from '../../../content/schema.ts';
import type { Mechanic } from '../types.ts';

export interface EchoTypeRound {
  text: string;
  audioKey: string;
  speakerId: string;
}

/** Un tope generoso: escribir de oído una parrafada larga es tedioso, no útil. */
const MAX_CHARS = 120;

function echoTarget(a: Atom): { text: string; speaker: string } | null {
  if (a.kind === 'phrase') return { text: a.text, speaker: a.speaker };
  if (a.kind === 'qa') return { text: a.prompt, speaker: a.speaker };
  return null;
}

export const echoType: Mechanic<EchoTypeRound> = {
  id: 'echo-type',
  name: 'Al oído · escribir',
  skill: 'retrieval',
  level: 3,
  blurb: 'Escuchá sin ver el texto y escribí lo que oíste.',

  accepts(atom: Atom): boolean {
    const t = echoTarget(atom);
    return t !== null && t.text.length <= MAX_CHARS;
  },

  buildRound(target: Atom): EchoTypeRound | null {
    const t = echoTarget(target);
    if (!t) return null;
    return { text: t.text, audioKey: target.id, speakerId: t.speaker };
  },
};
