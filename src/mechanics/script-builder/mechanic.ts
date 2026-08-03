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
  /** Qué versión se practica: 0 = A (modelAnswer), k = modelVariants[k-1]. Cada
   *  versión es un ejercicio distinto (una `variant` propia), no una opción interna. */
  version: number;
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

  // Una variante por versión del modelo (A + modelVariants). Así el motor arma un
  // ejercicio —y una tarjeta SRS— separado por versión, en vez de un selector interno.
  variants(atom: Atom): string[] {
    if (atom.kind !== 'production') return [];
    const n = 1 + (atom.modelVariants?.length ?? 0);
    return Array.from({ length: n }, (_, v) => String(v));
  },

  buildRound(target: Atom, _pool: Atom[], variant?: string): ScriptBuilderRound | null {
    if (target.kind !== 'production' || !target.steps || target.steps.length < 2) return null;
    const version = variant ? Number(variant) : 0;
    if (!Number.isFinite(version) || version < 0) return null;
    return { target, version };
  },
};
