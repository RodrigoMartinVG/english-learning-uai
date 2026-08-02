/**
 * El objetivo común de las dos mecánicas "Al inglés": partir del ESPAÑOL y producir
 * el inglés, escribiéndolo o diciéndolo. Es el puente L1→L2 que faltaba: el resto de
 * la app parte del inglés (oír, leer, repetir); acá el estímulo es el sentido en
 * español y hay que recuperar la forma inglesa desde cero.
 *
 * Estímulo = el `gloss` en español. Lo tienen TODAS las phrases (frases y preguntas)
 * y todos los lexemes (palabras): así el módulo va de "¿cómo se dice X?" a "¿cómo
 * preguntás Y?" sin distinción. No hay audio antes de responder: sonar el inglés
 * regalaría la respuesta. El modelo y las otras voces aparecen recién como feedback.
 *
 * Aceptadas = la forma + sus variantes: "¿Cómo te llamás?" admite "What's your name?"
 * y "What is your name?"; una palabra con variantOf admite UK y US (lift/elevator).
 * La consigna del usuario: las respuestas pueden ser varias.
 */

import type { Atom } from '../../../content/schema.ts';

export interface EsToEnTarget {
  /** La consigna, en español. Es lo único que ve el alumno antes de producir. */
  prompt: string;
  /** Formas inglesas válidas; `accept[0]` es la preferida (la que se muestra/oye). */
  accept: string[];
  speakerId: string;
  /** Clave de audio del modelo inglés (para oírlo y las otras voces, como feedback). */
  audioKey: string;
  grammar: string[];
}

const uniq = (xs: string[]) => [...new Set(xs.filter((x) => x.trim().length > 0))];

/** ¿La consigna en español ya contiene la respuesta inglesa? Algunos glosses aclaran
 *  entre paréntesis con inglés adentro ("tarde (Good afternoon…)"). Ahí el ejercicio
 *  no produce nada: se descarta el átomo en vez de regalar la respuesta. */
const reveals = (prompt: string, accept: string[]) => {
  const p = prompt.toLowerCase();
  return accept.some((en) => p.includes(en.toLowerCase()));
};

export function esToEnTarget(a: Atom): EsToEnTarget | null {
  let base: Omit<EsToEnTarget, 'grammar'> | null = null;

  if (a.kind === 'phrase' && a.gloss) {
    base = {
      prompt: a.gloss,
      accept: uniq([a.text, ...(a.alternatives ?? [])]),
      speakerId: a.speaker,
      audioKey: a.id,
    };
  } else if (a.kind === 'lexeme') {
    // Los lexemes no tienen speaker; su audio se sintetiza con el narrador (igual que
    // en Vocabulario). variantOf aporta las formas UK/US como respuestas válidas.
    base = {
      prompt: a.gloss,
      accept: uniq([a.word, ...(a.variantOf ? [a.variantOf.us, a.variantOf.uk] : [])]),
      speakerId: 'narrator',
      audioKey: a.id,
    };
  }

  if (!base || reveals(base.prompt, base.accept)) return null;
  return { ...base, grammar: a.grammar };
}
