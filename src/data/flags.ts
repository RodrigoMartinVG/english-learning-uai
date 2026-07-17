/**
 * flags.ts — audios que el alumno marcó como robóticos o mal pronunciados.
 *
 * Una marca solo sirve si se puede accionar. Por eso no guarda "el audio X está
 * mal" a secas: guarda el texto, el speaker y la VOZ concreta que sonó. Con eso,
 * `scripts/review-flags.ts` puede agrupar por voz y decir "cambiá esta voz" o
 * "regenerá estos", que es lo que cierra el círculo hasta un audio nuevo.
 *
 * Vive en localStorage como el progreso. Se exporta a JSON para sacarlo del
 * navegador: es el puente entre "lo escuché mal" y "lo arreglo en speakers.json".
 */

import { speakerById } from './content.ts';

const KEY = 'oda.flags.v1';

export interface AudioFlag {
  /** Clave del manifest: "en1.u1.p.007", "en1.u1.p.007.slow", etc. */
  audioKey: string;
  text: string;
  speakerId: string;
  /** La voz Kokoro que sonó, para poder señalarla en el reporte. */
  voice: string;
  at: string;
}

function load(): Record<string, AudioFlag> {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

let flags: Record<string, AudioFlag> = typeof localStorage === 'undefined' ? {} : load();
const listeners = new Set<() => void>();

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(flags));
  } catch {
    /* incógnito o cuota llena: se pierde la marca, no la sesión */
  }
  for (const fn of listeners) fn();
}

export const subscribeFlags = (fn: () => void): (() => void) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};

export const isFlagged = (audioKey: string): boolean => audioKey in flags;

/** Marca o desmarca. Devuelve el nuevo estado. */
export function toggleFlag(input: { audioKey: string; text: string; speakerId: string }): boolean {
  if (flags[input.audioKey]) {
    delete flags[input.audioKey];
    persist();
    return false;
  }
  flags[input.audioKey] = {
    audioKey: input.audioKey,
    text: input.text,
    speakerId: input.speakerId,
    voice: speakerById.get(input.speakerId)?.voice.kokoro ?? '?',
    at: new Date().toISOString(),
  };
  persist();
  return true;
}

export const flagCount = (): number => Object.keys(flags).length;
export const listFlags = (): AudioFlag[] => Object.values(flags);
export const clearFlags = (): void => {
  flags = {};
  persist();
};

/** El JSON que consume scripts/review-flags.ts. */
export const exportFlags = (): string =>
  JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), flags: listFlags() }, null, 2);
