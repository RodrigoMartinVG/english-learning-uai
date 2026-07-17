/**
 * Oral Exam Simulator — la mecánica destino. Ver ARQUITECTURA.md §6.5.
 *
 * Nivel 5. Es la que justifica el proyecto entero: el examinador pregunta, sin
 * texto en pantalla y sin ayudas, y el alumno habla. Después se le dice qué
 * estructuras usó y cuáles se olvidó, contra la rúbrica.
 *
 * Consume los átomos `production`: los capítulos de "My Life", que son un hilo
 * acumulativo. Los cuatro juntos SON el final oral (§2.2).
 */

import { normalize } from '../../engine/grading/speech.ts';
import type { Atom, ProductionAtom } from '../../../content/schema.ts';
import type { Mechanic } from '../types.ts';

export interface OralExamRound {
  target: ProductionAtom;
}

export interface RubricCheck {
  text: string;
  /** true/false si hay detector; null si es de auto-chequeo. */
  hit: boolean | null;
}

/**
 * Corre la rúbrica contra lo que dijo el alumno.
 *
 * Los ítems sin `detect` devuelven null a propósito: no se puede verificar
 * "coloca los adjetivos antes del sustantivo" con un regex, y marcarlos como
 * cumplidos o fallados sería inventar. Se los muestra como auto-chequeo.
 */
export function checkRubric(target: ProductionAtom, transcript: string): RubricCheck[] {
  const said = normalize(transcript);
  return target.rubric.map((r) => ({
    text: r.text,
    hit: r.detect ? new RegExp(r.detect, 'i').test(said) : null,
  }));
}

export const oralExam: Mechanic<OralExamRound> = {
  id: 'oral-exam',
  name: 'Examen oral',
  skill: 'production',
  level: 5,
  blurb: 'El examinador pregunta. Sin texto, sin ayudas. Hablá.',

  accepts(atom: Atom): boolean {
    return atom.kind === 'production';
  },

  buildRound(target: Atom): OralExamRound | null {
    return target.kind === 'production' ? { target } : null;
  },
};
