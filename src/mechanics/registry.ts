/**
 * registry.ts — el catálogo de mecánicas.
 *
 * Agregar una mecánica es agregar una entrada acá. Nada más. Ninguna otra parte
 * de la app enumera mecánicas a mano. Ver ARQUITECTURA.md §6.1.
 *
 * Hoy hay una sola: la Fase 2 es un slice vertical deliberado. Una mecánica
 * funcionando de punta a punta prueba el diseño; catorce a medias no prueban nada.
 */

import { osmosis } from './osmosis/mechanic.ts';
import type { MechanicMeta } from './types.ts';

export const mechanics = [osmosis] as const;

export const mechanicById = new Map<string, MechanicMeta>(mechanics.map((m) => [m.id, m]));
