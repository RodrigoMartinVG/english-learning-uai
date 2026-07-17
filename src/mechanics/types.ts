/**
 * types.ts — el contrato de una mecánica. Ver ARQUITECTURA.md §6.1 y §14.
 *
 * Una mecánica declara qué átomos sabe consumir (`accepts`) y cómo arma una ronda
 * para UNO de ellos. No elige qué se entrena: eso lo decide la sesión. Por eso
 * `buildRound` recibe el objetivo desde afuera y el pool solo para distractores.
 *
 * Es el cambio que convierte a las mecánicas en pasos y no en destinos.
 */

import type { ComponentType } from 'react';
import type { Atom, Skill } from '../../content/schema.ts';

export interface MechanicMeta {
  id: string;
  name: string;
  /** Qué entrena. Define qué tarjeta de SRS actualiza: (atomId, skill). */
  skill: Skill;
  /** Peldaño de la escalera de §2.3: de lo más guiado a lo más libre. */
  level: 1 | 2 | 3 | 4 | 5;
  /** Una línea: qué hace el alumno, no cómo está implementado. */
  blurb: string;
}

export interface Mechanic<TRound = unknown> extends MechanicMeta {
  /** El selector. ¿Este átomo sirve para esta mecánica? */
  accepts(atom: Atom): boolean;

  /**
   * Formas distintas de entrenar el MISMO átomo, si las hay.
   *
   * Existe por el Role-play: un diálogo se practica desde cada papel, y no son
   * intercambiables. Medido en la U1: en el diálogo de la recepción, solo la
   * recepcionista formula preguntas y solo Karel da respuestas cortas y números.
   * Haciendo siempre el mismo papel se pierde la mitad de la gramática.
   *
   * El orden importa: la primera variante es la que conviene practicar antes.
   * Sin variantes, el átomo da un solo paso.
   */
  variants?(atom: Atom): string[];

  /**
   * Arma una ronda para `target`. `pool` es el resto del contenido, solo para
   * construir distractores; no para elegir el objetivo.
   * Devuelve null si el pool no alcanza.
   */
  buildRound(target: Atom, pool: Atom[], variant?: string): TRound | null;
}

export interface MechanicViewProps<TRound> {
  round: TRound;
  /** La mecánica reporta el resultado; la sesión decide qué viene después. */
  onDone: (correct: boolean) => void;
}

export interface MechanicEntry<TRound = any> {
  mechanic: Mechanic<TRound>;
  View: ComponentType<MechanicViewProps<TRound>>;
}
