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

/** Cuántos átomos tienen su audio ya generado. Si es 0, la app corre en fallback. */
export function audioCoverage(): { withFile: number; total: number } {
  const keys = atoms.map((a) => a.id);
  return {
    withFile: keys.filter((k) => k in manifest.entries).length,
    total: keys.length,
  };
}
