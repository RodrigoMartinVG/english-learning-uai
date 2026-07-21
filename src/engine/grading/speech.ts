/**
 * speech.ts — comparar lo que el alumno dijo contra lo que tenía que decir.
 *
 * Ver ARQUITECTURA.md §6.4. Lo único que la Web Speech API devuelve es una
 * transcripción: no puntúa fonemas. Cualquier "85% de pronunciación" construido
 * sobre esto sería inventado. Así que acá NO se puntúa pronunciación: se compara
 * estructura, y se dice QUÉ palabra falló, que es lo accionable.
 */

import { canonicalNumbers } from './numbers.ts';

/** Contracciones del material. El ASR transcribe "I'm" o "I am" según le parece;
 *  penalizar esa diferencia sería castigar al alumno por un capricho del motor. */
const CONTRACTIONS: [RegExp, string][] = [
  [/\bi'm\b/g, 'i am'],
  [/\b(he|she|it|that|there|what|where|who|how|here)'s\b/g, '$1 is'],
  [/\b(you|we|they)'re\b/g, '$1 are'],
  [/\b(i|you|we|they)'ve\b/g, '$1 have'],
  [/\b(i|you|he|she|we|they)'ll\b/g, '$1 will'],
  [/\b(is|are|was|were|do|does|did|has|have|had|can|could|would|should)n't\b/g, '$1 not'],
  [/\bcan't\b/g, 'can not'],
  [/\bwon't\b/g, 'will not'],
  [/\blet's\b/g, 'let us'],
];

/**
 * Normaliza para comparar. El orden de los pasos importa y cada uno arregla un
 * caso donde el alumno decía bien y la app lo marcaba mal:
 *
 *  1. contracciones → "I'm" y "I am" son lo mismo; el ASR devuelve cualquiera.
 *     La regex del PRD las volvía "im" vs "i am" y nunca matcheaban.
 *  2. guiones → espacio, NO borrarlos. Borrarlos hacía "thirty-five" →
 *     "thirtyfive", que ya no matchea con "thirty five".
 *  3. números → dígitos. El material dice "tenth floor" (para que el TTS lo
 *     pronuncie) y el ASR transcribe "10th floor".
 */
export function normalize(text: string): string {
  let s = text.toLowerCase().trim();
  s = s.replace(/[’´`]/g, "'");
  for (const [re, to] of CONTRACTIONS) s = s.replace(re, to);
  s = s
    .replace(/[-–—/]/g, ' ')
    .replace(/[^\w\s]|_/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (!s) return '';
  return canonicalNumbers(s.split(' ')).join(' ');
}

export const words = (text: string): string[] => (normalize(text) ? normalize(text).split(' ') : []);

/** Palabras "gramaticales" que no cuentan como vocabulario de contenido. */
const STOP = new Set(
  ('the a an this that these those is are am was were be i you we they he she it to of and or but ' +
    'in on at for with my your his her our their so do does did not no yes can could would will ' +
    'what where when how who why also because about there here have has had one two of at as').split(' ')
);

/**
 * El conjunto de palabras de CONTENIDO de un texto (normalizadas, sin palabras
 * gramaticales). Se usa para el resaltado verde de "¿usaste el vocabulario del
 * tema?" en la dictación en vivo (Creá tu propio guion / Role-play improvisado).
 */
export function contentWords(text: string): Set<string> {
  return new Set(words(text).filter((t) => t.length > 2 && !STOP.has(t)));
}

export type WordStatus = 'ok' | 'missing' | 'wrong' | 'extra';

export interface WordResult {
  /** La palabra esperada; en 'extra', la que sobró. */
  word: string;
  status: WordStatus;
  /** Lo que se oyó en su lugar, si difiere. */
  heard?: string;
}

export interface SpeechVerdict {
  /** Match estructural: dijo lo que había que decir. NO es "pronunció bien". */
  match: boolean;
  /** 0..1 — proporción de palabras acertadas. Es una medida de estructura. */
  accuracy: number;
  /** Palabra por palabra, para poder señalar dónde falló. */
  words: WordResult[];
  transcript: string;
}

/**
 * Alineación por distancia de edición a nivel palabra (Levenshtein con backtrace).
 *
 * No alcanza con comparar strings: si el alumno se come una palabra al principio,
 * un diff ingenuo marca todo el resto como error y el feedback es inútil. La
 * alineación encuentra la correspondencia real y aísla el fallo.
 */
export function gradeSpeech(target: string, transcript: string): SpeechVerdict {
  const a = words(target);
  const b = words(transcript);

  const n = a.length;
  const m = b.length;
  const d: number[][] = Array.from({ length: n + 1 }, () => new Array<number>(m + 1).fill(0));
  for (let i = 0; i <= n; i++) d[i]![0] = i;
  for (let j = 0; j <= m; j++) d[0]![j] = j;
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i]![j] = Math.min(d[i - 1]![j]! + 1, d[i]![j - 1]! + 1, d[i - 1]![j - 1]! + cost);
    }
  }

  const out: WordResult[] = [];
  let i = n;
  let j = m;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && a[i - 1] === b[j - 1]) {
      out.push({ word: a[i - 1]!, status: 'ok' });
      i--;
      j--;
    } else if (i > 0 && j > 0 && d[i]![j] === d[i - 1]![j - 1]! + 1) {
      out.push({ word: a[i - 1]!, status: 'wrong', heard: b[j - 1]! });
      i--;
      j--;
    } else if (i > 0 && d[i]![j] === d[i - 1]![j]! + 1) {
      out.push({ word: a[i - 1]!, status: 'missing' });
      i--;
    } else {
      out.push({ word: b[j - 1]!, status: 'extra' });
      j--;
    }
  }
  out.reverse();

  const ok = out.filter((w) => w.status === 'ok').length;
  const accuracy = n ? ok / n : 0;

  return {
    // Match exacto, o el objetivo contenido en lo transcripto (el ASR agrega
    // relleno: "um, I'm a developer"). El includes recíproco lo tolera.
    match:
      normalize(target) === normalize(transcript) ||
      (normalize(transcript).includes(normalize(target)) && n > 0),
    accuracy,
    words: out,
    transcript,
  };
}

/**
 * Léxico esperado, para `SpeechRecognitionList`.
 *
 * Es la propiedad infrautilizada que señala el PRD: darle al navegador las
 * palabras que puede esperar mejora bastante el reconocimiento de frases cortas.
 *
 * OJO: acá NO se usa normalize(). Los hints son palabras que el alumno va a
 * PRONUNCIAR, y normalize() canoniza a dígitos: pasarle "10th" o "93" a un motor
 * de voz no le dice nada sobre qué sonido esperar. Se le pasa "tenth", "ninety".
 */
export function grammarHints(targets: string[]): string {
  const vocab = [
    ...new Set(
      targets.flatMap((t) =>
        t
          .toLowerCase()
          .replace(/[’´`]/g, "'")
          .replace(/[-–—/]/g, ' ')
          .replace(/[^\w\s]|_/g, '')
          .split(/\s+/)
          .filter(Boolean)
      )
    ),
  ];
  return `#JSGF V1.0; grammar phrases; public <phrase> = ${vocab.join(' | ')};`;
}
