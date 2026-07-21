/**
 * registry.ts — el catálogo de mecánicas. Solo LÓGICA. Ver ARQUITECTURA.md §6.1.
 *
 * No importa vistas ni CSS a propósito: el motor de sesiones depende de esto, y
 * un motor que no puede correr sin un navegador no se puede testear ni razonar.
 * Las vistas viven en views.tsx y solo las conoce la capa de UI.
 *
 * Agregar una mecánica: una entrada acá y otra en views.tsx.
 */

import { osmosis } from './osmosis/mechanic.ts';
import { wordFocus } from './word-focus/mechanic.ts';
import { cloze } from './cloze/mechanic.ts';
import { listening } from './listening/mechanic.ts';
import { dictation } from './dictation/mechanic.ts';
import { echoType } from './echo-type/mechanic.ts';
import { echoSay } from './echo-say/mechanic.ts';
import { questionFormer } from './question-former/mechanic.ts';
import { syntaxBuilder } from './syntax-builder/mechanic.ts';
import { minimalPairs } from './minimal-pairs/mechanic.ts';
import { shadowing } from './shadowing/mechanic.ts';
import { pingPong } from './ping-pong/mechanic.ts';
import { rolePlay } from './role-play/mechanic.ts';
import { scriptBuilder } from './script-builder/mechanic.ts';
import { oralExam } from './oral-exam/mechanic.ts';
import type { Mechanic } from './types.ts';

/** Ordenadas por la escalera de §2.3: percepción → comprensión → producción. */
export const mechanics: Mechanic<any>[] = [
  minimalPairs,
  wordFocus,
  osmosis,
  listening,
  syntaxBuilder,
  cloze,
  dictation,
  echoType,
  pingPong,
  shadowing,
  echoSay,
  rolePlay,
  questionFormer,
  scriptBuilder,
  oralExam,
];

export const mechanicById = new Map(mechanics.map((m) => [m.id, m]));
