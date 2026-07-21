/**
 * Script Builder — "Reconstruir el guion". Ver PLAN-unidad-5 y la decisión del
 * usuario (reconstruir los scripts modelo respondiendo preguntas en orden).
 *
 * El escalón que faltaba entre Ping-Pong (respuestas sueltas) y el Examen Oral
 * (el monólogo entero): una secuencia de preguntas guía que, al contestarlas,
 * arma el script pedazo a pedazo. Nivel 4: producción encadenada.
 *
 * Consume las `production` que declaran `steps`.
 */

import type { Atom, ProductionAtom } from '../../../content/schema.ts';
import { contentWords } from '../../engine/grading/speech.ts';
import type { Mechanic } from '../types.ts';

export interface ScriptBuilderRound {
  target: ProductionAtom;
}

/**
 * El vocabulario "esperado" de un guion, para pintar en verde lo que el alumno usa
 * al crear el suyo. Derivado (sin curar): sale del modelo + los fragmentos de los
 * pasos. Ver PLAN-crea-tu-guion §4.
 */
export function expectedWords(p: ProductionAtom): Set<string> {
  return contentWords([p.modelAnswer, ...(p.steps ?? []).map((s) => s.segment)].join(' '));
}

export const scriptBuilder: Mechanic<ScriptBuilderRound> = {
  id: 'script-builder',
  name: 'Armá el guion',
  skill: 'production',
  level: 4,
  blurb: 'Reconstruí el modelo, o creá el tuyo con transcripción en vivo. Guiado por preguntas.',

  accepts(atom: Atom): boolean {
    return atom.kind === 'production' && (atom.steps?.length ?? 0) >= 2;
  },

  buildRound(target: Atom): ScriptBuilderRound | null {
    if (target.kind !== 'production' || !target.steps || target.steps.length < 2) return null;
    return { target };
  },
};
