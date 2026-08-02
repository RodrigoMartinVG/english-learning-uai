/**
 * "Al inglés · decir" — leés el español y lo decís en inglés por micrófono. La
 * producción más libre de la escalera después del examen: sin audio modelo ni
 * texto inglés, solo el sentido en español. El inglés correcto aparece recién como
 * feedback (el diff y el A/B de SpeakPanel). Ver es-to-en/target.ts.
 */

import type { Atom } from '../../../content/schema.ts';
import type { Mechanic } from '../types.ts';
import { esToEnTarget } from './target.ts';

export interface EsToEnSayRound {
  prompt: string;
  accept: string[];
  audioKey: string;
  speakerId: string;
  /** Léxico para las pistas del ASR: formas inglesas de la misma gramática. */
  neighbourhood: string[];
}

/** Más largo que esto ya no es producir una frase, es recitar un párrafo. */
const MAX_CHARS = 90;

export const esToEnSay: Mechanic<EsToEnSayRound> = {
  id: 'es-to-en-say',
  name: 'Al inglés · decir',
  skill: 'production',
  level: 4,
  blurb: 'Leé el español y decilo en inglés en voz alta.',

  accepts(atom: Atom): boolean {
    const t = esToEnTarget(atom);
    return t !== null && t.accept[0]!.length <= MAX_CHARS;
  },

  buildRound(target: Atom, pool: Atom[]): EsToEnSayRound | null {
    const t = esToEnTarget(target);
    if (!t) return null;
    const neighbourhood = pool
      .map(esToEnTarget)
      .filter((x): x is NonNullable<typeof x> => x !== null && x.grammar.some((g) => t.grammar.includes(g)))
      .flatMap((x) => x.accept);
    return {
      prompt: t.prompt,
      accept: t.accept,
      audioKey: t.audioKey,
      speakerId: t.speakerId,
      neighbourhood: [...t.accept, ...neighbourhood].slice(0, 40),
    };
  },
};
