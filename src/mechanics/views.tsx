/**
 * views.tsx — qué componente dibuja cada mecánica.
 *
 * Separado de registry.ts para que el motor de sesiones no arrastre React.
 */

import type { ComponentType } from 'react';
import { OsmosisView } from './osmosis/OsmosisView.tsx';
import { MinimalPairsView } from './minimal-pairs/MinimalPairsView.tsx';
import { ShadowingView } from './shadowing/ShadowingView.tsx';
import { PingPongView } from './ping-pong/PingPongView.tsx';
import { RolePlayView } from './role-play/RolePlayView.tsx';
import { OralExamView } from './oral-exam/OralExamView.tsx';
import { minimalPairs } from './minimal-pairs/mechanic.ts';
import { osmosis } from './osmosis/mechanic.ts';
import { shadowing } from './shadowing/mechanic.ts';
import { pingPong } from './ping-pong/mechanic.ts';
import { rolePlay } from './role-play/mechanic.ts';
import { oralExam } from './oral-exam/mechanic.ts';
import type { MechanicViewProps } from './types.ts';

export const views: Record<string, ComponentType<MechanicViewProps<any>>> = {
  [minimalPairs.id]: MinimalPairsView,
  [osmosis.id]: OsmosisView,
  [pingPong.id]: PingPongView,
  [shadowing.id]: ShadowingView,
  [rolePlay.id]: RolePlayView,
  [oralExam.id]: OralExamView,
};
