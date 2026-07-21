/**
 * Echo-say — "Al oído, decir". Escuchás la frase o la pregunta SIN verla y la
 * repetís de memoria por micrófono.
 *
 * Es Shadowing sin la muleta del texto: ahí el alumno lee y repite; acá tiene que
 * recuperar la frase del sonido y el sentido. Es la práctica de recuperación más
 * fuerte que hay para producción. El texto recién aparece al terminar, como
 * feedback (el diff de SpeakPanel). Ver ARQUITECTURA.md §2.3 (la escalera).
 */

import type { Atom } from '../../../content/schema.ts';
import type { Mechanic } from '../types.ts';

export interface EchoSayRound {
  text: string;
  audioKey: string;
  speakerId: string;
  /** Léxico para las pistas del ASR: frases/preguntas de la misma gramática. */
  neighbourhood: string[];
}

/** Más largo que esto ya no es repetir de oído, es leer una parrafada: se excluye. */
const MAX_CHARS = 90;

/** Qué se oye y hay que reproducir: la frase, o el enunciado de la pregunta. */
function echoTarget(a: Atom): { text: string; speaker: string; grammar: string[] } | null {
  if (a.kind === 'phrase') return { text: a.text, speaker: a.speaker, grammar: a.grammar };
  if (a.kind === 'qa') return { text: a.prompt, speaker: a.speaker, grammar: a.grammar };
  return null;
}

export const echoSay: Mechanic<EchoSayRound> = {
  id: 'echo-say',
  name: 'Al oído · decir',
  skill: 'production',
  level: 4,
  blurb: 'Escuchá sin ver el texto y repetilo de memoria por micrófono.',

  accepts(atom: Atom): boolean {
    const t = echoTarget(atom);
    return t !== null && t.text.length <= MAX_CHARS;
  },

  buildRound(target: Atom, pool: Atom[]): EchoSayRound | null {
    const t = echoTarget(target);
    if (!t) return null;
    const neighbourhood = pool
      .map(echoTarget)
      .filter((x): x is NonNullable<typeof x> => x !== null && x.grammar.some((g) => t.grammar.includes(g)))
      .map((x) => x.text);
    return {
      text: t.text,
      audioKey: target.id,
      speakerId: t.speaker,
      neighbourhood: [t.text, ...neighbourhood].slice(0, 40),
    };
  },
};
