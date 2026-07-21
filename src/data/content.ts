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

import speakersFile from '../../content/speakers.json';
import coursesFile from '../../content/courses.json';
import manifestJson from '../../public/audio/audio-manifest.json';
import type { Atom, Course, PhraseAtom, QaAtom, Speaker, UnitFile } from '../../content/schema.ts';
import type { AudioManifest, AudioVoiceHints } from '../audio/AudioService.ts';

/**
 * Auto-descubre todas las unidades: `content/<curso>/unit-*.json`.
 *
 * Agregar una unidad (o un curso) es dejar el JSON en su carpeta — cero código.
 * Es lo que el diseño prometía: el contenido y src/ no se conocen. Ordena por
 * curso y número para que la home las muestre en orden.
 */
const unitModules = import.meta.glob<{ default: UnitFile }>('../../content/*/unit-*.json', {
  eager: true,
});

export const units: UnitFile[] = Object.values(unitModules)
  .map((m) => m.default)
  .sort((a, b) => a.course.localeCompare(b.course) || a.unit - b.unit);
export const speakers: Speaker[] = (speakersFile as { speakers: Speaker[] }).speakers;

/** Un nivel/curso, para el selector y el encabezado. */
export interface CourseMeta {
  id: Course;
  name: string;
  subtitle?: string;
  order: number;
}
const courseMeta = (coursesFile as { courses: CourseMeta[] }).courses;
/** Solo los cursos que YA tienen contenido, en orden. Agregar en2 = dejar sus units. */
export const courses: CourseMeta[] = courseMeta
  .filter((c) => units.some((u) => u.course === c.id))
  .sort((a, b) => a.order - b.order);
/** Nombre visible de un curso (fallback al id si no hay metadatos). */
export const courseName = (id: string): string =>
  courseMeta.find((c) => c.id === id)?.name ?? id;

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
