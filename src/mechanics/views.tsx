/**
 * views.tsx — qué componente dibuja cada mecánica.
 *
 * Separado de registry.ts para que el motor de sesiones no arrastre React.
 */

import type { ComponentType } from 'react';
import { OsmosisView } from './osmosis/OsmosisView.tsx';
import { MinimalPairsView } from './minimal-pairs/MinimalPairsView.tsx';
import { minimalPairs } from './minimal-pairs/mechanic.ts';
import { osmosis } from './osmosis/mechanic.ts';
import type { MechanicViewProps } from './types.ts';

export const views: Record<string, ComponentType<MechanicViewProps<any>>> = {
  [minimalPairs.id]: MinimalPairsView,
  [osmosis.id]: OsmosisView,
};
