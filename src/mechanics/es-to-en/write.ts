/**
 * "Al inglés · escribir" — leés el español y tecleás el inglés. Producción de
 * recuperación desde L1: la más exigente de las escritas, porque no hay audio ni
 * texto inglés a la vista, solo el sentido. Se corrige como la voz (normalizado,
 * palabra por palabra), no la ortografía exacta. Ver es-to-en/target.ts.
 */

import type { Atom } from '../../../content/schema.ts';
import type { Mechanic } from '../types.ts';
import { esToEnTarget } from './target.ts';

export interface EsToEnWriteRound {
  prompt: string;
  accept: string[];
  audioKey: string;
  speakerId: string;
}

/** Tope: producir de memoria una parrafada larga es tedioso, no útil. */
const MAX_CHARS = 100;

export const esToEnWrite: Mechanic<EsToEnWriteRound> = {
  id: 'es-to-en-write',
  name: 'Al inglés · escribir',
  skill: 'retrieval',
  level: 3,
  blurb: 'Leé el español y escribilo en inglés.',

  accepts(atom: Atom): boolean {
    const t = esToEnTarget(atom);
    return t !== null && t.accept[0]!.length <= MAX_CHARS;
  },

  buildRound(target: Atom): EsToEnWriteRound | null {
    const t = esToEnTarget(target);
    if (!t) return null;
    return { prompt: t.prompt, accept: t.accept, audioKey: t.audioKey, speakerId: t.speakerId };
  },
};
