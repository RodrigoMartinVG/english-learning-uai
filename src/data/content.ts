/**
 * content.ts — carga el contenido y lo indexa.
 *
 * Es el único punto donde src/ toca content/. Todo lo demás consume estos índices.
 * El contenido se valida en build/CI (npm run validate), así que acá se confía en
 * la forma: revalidar 91 átomos en cada arranque sería pagar dos veces.
 *
 * El audio NO vive en el contenido: el manifest es un índice aparte que se cruza
 * por clave. Así los mp3 se regeneran sin tocar una sola línea de content/.
 */

import unit1 from '../../content/en1/unit-1.json';
import speakersFile from '../../content/speakers.json';
import manifestJson from '../../public/audio/audio-manifest.json';
import type { Atom, PhraseAtom, QaAtom, Speaker, UnitFile } from '../../content/schema.ts';
import type { AudioManifest, AudioVoiceHints } from '../audio/AudioService.ts';

export const units: UnitFile[] = [unit1 as UnitFile];
export const speakers: Speaker[] = (speakersFile as { speakers: Speaker[] }).speakers;

export const atoms: Atom[] = units.flatMap((u) => u.atoms);
export const atomById = new Map(atoms.map((a) => [a.id, a]));
export const speakerById = new Map(speakers.map((s) => [s.id, s]));

export const manifest = manifestJson as AudioManifest;

/** Lo que el AudioService necesita de un speaker, sin arrastrarle todo el schema. */
export const voiceHints: Record<string, AudioVoiceHints> = Object.fromEntries(
  speakers.map((s) => [
    s.id,
    {
      ttsVoice: s.voice.kokoro,
      accent: s.accent,
      fallbackHint: s.fallbackHint,
      rate: s.rate,
    } satisfies AudioVoiceHints,
  ])
);

export const isPhrase = (a: Atom): a is PhraseAtom => a.kind === 'phrase';
export const isQa = (a: Atom): a is QaAtom => a.kind === 'qa';

/** Símbolos IPA que consideramos "fonema entrenables" para el diagnóstico. */
const PHONEMES = new Set([
  'θ', 'ð', 'tʃ', 'dʒ', 'ʃ', 'ʒ', 'ŋ', 'j', 'w', 'r', 'z', 'v',
  'æ', 'e', 'ɪ', 'iː', 'ʊ', 'uː', 'ɔː', 'ɜː', 'ə',
  'eɪ', 'aɪ', 'ɔɪ', 'əʊ', 'aʊ', 'ɪə', 'eə', 'ʊə',
]);

/**
 * Las dimensiones por las que se diagnostican los errores de un átomo.
 *
 * Cuando fallás algo, no falla "el átomo en abstracto": falla una estructura
 * gramatical y/o un sonido concreto. Agregar por estas etiquetas es lo que
 * convierte "22 errores" en "fallás /θ/ y el interrogativo de be".
 */
export function diagnosticTags(atom: Atom): { grammar: string[]; phonemes: string[] } {
  const grammar = [...atom.grammar];
  const raw: string[] = [];
  if (atom.kind === 'phrase') raw.push(...(atom.phoneticFocus ?? []));
  if ('tags' in atom && atom.tags) raw.push(...atom.tags);
  const phonemes = [...new Set(raw.filter((t) => PHONEMES.has(t)))];
  return { grammar, phonemes };
}

/**
 * Tipos de átomo que publican audio bajo su propio id.
 *
 * Los otros no son un agujero, son diseño: un `dialogue` reusa el audio de sus
 * `phrase`, y `contrast`/`exercise` publican bajo claves derivadas (".pair.0",
 * ".item.3") porque una sola pista no los representa.
 */
const OWNS_AUDIO = new Set(['phrase', 'qa', 'lexeme', 'production', 'listening']);

/**
 * Cobertura de audio pregenerado.
 *
 * Cuenta solo lo que DEBERÍA tener pista propia. Contar los 91 átomos daría
 * 75/91 con el audio completo, y la app avisaría de una falta que no existe:
 * una métrica que miente es peor que no tenerla.
 */
export function audioCoverage(): { withFile: number; total: number } {
  const expected = atoms.filter((a) => OWNS_AUDIO.has(a.kind));
  return {
    withFile: expected.filter((a) => a.id in manifest.entries).length,
    total: expected.length,
  };
}
