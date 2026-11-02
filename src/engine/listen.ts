/**
 * listen.ts — qué se escucha en el Listening continuo, y en qué voz.
 *
 * El modo es una tira de ORACIONES sueltas de la unidad, barajadas, cada una en una
 * voz al azar. No es una sesión: no se evalúa nada, no se escribe en el SRS. Es el
 * oído puesto a trabajar sobre material que ya existe.
 *
 * El criterio de qué entra es el que pidió el alumno y es el correcto: oraciones.
 * Ni palabras sueltas (un `lexeme` no tiene prosodia que escuchar — es vocabulario,
 * y para eso están las otras mecánicas) ni textos largos (un párrafo de cinco
 * oraciones no es un ítem: es una lectura, y se escucha en el Lector). Las oraciones
 * DE los textos sí entran, partidas una por una: son inglés real, más largo y más
 * encadenado que las frases de diálogo, y es justo lo que cuesta seguir de oído.
 */

import {
  readingSentenceKey,
  readingBlockKey,
  type Atom,
  type Course,
} from '../../content/schema.ts';
import { splitSentences } from '../../content/sentences.ts';

export interface ListenItem {
  /** Clave base del audio. Las voces alternativas cuelgan con `.v.<voz>`. */
  key: string;
  text: string;
  /** Traducción al español. Va al lado, no debajo: se lee de reojo, no se estudia. */
  gloss?: string;
  /** Voz canónica (el personaje). Es también la que sintetiza el fallback. */
  speakerId: string;
  /** De dónde salió, para poder decirlo en la lista. */
  source: 'phrase' | 'text';
  /** Título del texto del que viene la oración. Solo en `source: 'text'`. */
  from?: string;
}

/** Una sola palabra no es una oración: no hay nada que seguir de oído. */
const MIN_WORDS = 2;

/**
 * El deletreo no es una oración hablada: es una secuencia de letras ("S. C. H. U.
 * L. Z."). Escucharlo en un tira de listening no entrena nada —no hay sintaxis que
 * seguir— y encima rompe el ritmo. Se detecta por la forma, no por el tag: cualquier
 * texto que sea mayormente iniciales sueltas.
 */
function isSpelling(text: string): boolean {
  const words = text.trim().split(/\s+/);
  const initials = words.filter((w) => /^[A-Za-z][.,]?$/.test(w)).length;
  return initials >= 3 && initials / words.length > 0.5;
}

const usable = (text: string): boolean =>
  text.trim().split(/\s+/).length >= MIN_WORDS && !isSpelling(text);

/**
 * Las oraciones escuchables de una unidad, SIN barajar (el orden lo decide la vista).
 *
 * Determinista a propósito: barajar acá haría que cada render de React devolviera
 * otra lista y la tira se reordenaría sola mientras suena.
 */
export function listenItems(all: Atom[], course: Course, unit: number): ListenItem[] {
  const pool = all.filter((a) => a.course === course && a.unit === unit);
  const items: ListenItem[] = [];

  for (const atom of pool) {
    if (atom.kind === 'phrase') {
      if (!usable(atom.text)) continue;
      items.push({
        key: atom.id,
        text: atom.text,
        gloss: atom.gloss,
        speakerId: atom.speaker,
        source: 'phrase',
      });
      continue;
    }

    if (atom.kind !== 'reading') continue;

    atom.sections.forEach((sec, si) => {
      sec.blocks.forEach((b, bi) => {
        if (b.kind !== 'para') return;
        const sents = splitSentences(b.text);
        sents.forEach((text, m) => {
          if (!usable(text)) return;
          items.push({
            // Un párrafo de UNA oración no tiene clave propia por oración: su mp3 es
            // el del bloque. Es la misma condición que aplica build-audio al generar,
            // y tiene que leerse igual de los dos lados o el audio no aparece.
            key:
              sents.length > 1
                ? readingSentenceKey(atom.id, si, bi, m)
                : readingBlockKey(atom.id, si, bi),
            text,
            gloss: b.gloss?.[m],
            speakerId: atom.speaker,
            source: 'text',
            from: atom.title,
          });
        });
      });
    });
  }

  return items;
}
