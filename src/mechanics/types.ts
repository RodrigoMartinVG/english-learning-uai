/**
 * types.ts — el contrato de una mecánica. Ver ARQUITECTURA.md §6.1.
 *
 * Una mecánica declara qué átomos sabe consumir (`accepts`) y cómo arma una ronda.
 * No conoce el contenido: recibe átomos. Por eso agregar una unidad no toca
 * mecánicas, y agregar una mecánica no toca contenido.
 */

import type { Atom, Skill } from '../../content/schema.ts';

export interface MechanicMeta {
  id: string;
  name: string;
  /** Qué entrena. Define también qué tarjeta de SRS actualiza: (atomId, skill). */
  skill: Skill;
  /** Ruta de dificultad de §2.3: de lo más guiado a lo más libre. */
  level: 1 | 2 | 3 | 4 | 5;
  /** Una línea, para la home. Qué hace el alumno, no cómo está implementado. */
  blurb: string;
}

export interface Mechanic<TRound> extends MechanicMeta {
  /** El selector. Decide si un átomo sirve para esta mecánica. */
  accepts(atom: Atom): boolean;
  /** Cuántos átomos aceptados hacen falta para poder jugar. */
  minAtoms: number;
  /** Arma una ronda. `pool` ya viene filtrado por accepts(). */
  buildRound(pool: Atom[]): TRound | null;
}
