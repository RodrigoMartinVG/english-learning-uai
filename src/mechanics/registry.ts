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
import { minimalPairs } from './minimal-pairs/mechanic.ts';
import type { Mechanic } from './types.ts';

export const mechanics: Mechanic<any>[] = [minimalPairs, osmosis];

export const mechanicById = new Map(mechanics.map((m) => [m.id, m]));
