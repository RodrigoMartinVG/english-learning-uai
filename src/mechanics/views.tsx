/**
 * views.tsx — qué componente dibuja cada mecánica.
 *
 * Separado de registry.ts para que el motor de sesiones no arrastre React.
 */

import type { ComponentType } from 'react';
import { OsmosisView } from './osmosis/OsmosisView.tsx';
import { WordFocusView } from './word-focus/WordFocusView.tsx';
import { ClozeView } from './cloze/ClozeView.tsx';
import { ListeningView } from './listening/ListeningView.tsx';
import { DictationView } from './dictation/DictationView.tsx';
import { QuestionFormerView } from './question-former/QuestionFormerView.tsx';
import { SyntaxBuilderView } from './syntax-builder/SyntaxBuilderView.tsx';
import { MinimalPairsView } from './minimal-pairs/MinimalPairsView.tsx';
import { ShadowingView } from './shadowing/ShadowingView.tsx';
import { PingPongView } from './ping-pong/PingPongView.tsx';
import { RolePlayView } from './role-play/RolePlayView.tsx';
import { OralExamView } from './oral-exam/OralExamView.tsx';
import { minimalPairs } from './minimal-pairs/mechanic.ts';
import { osmosis } from './osmosis/mechanic.ts';
import { wordFocus } from './word-focus/mechanic.ts';
import { cloze } from './cloze/mechanic.ts';
import { listening } from './listening/mechanic.ts';
import { dictation } from './dictation/mechanic.ts';
import { questionFormer } from './question-former/mechanic.ts';
import { syntaxBuilder } from './syntax-builder/mechanic.ts';
import { shadowing } from './shadowing/mechanic.ts';
import { pingPong } from './ping-pong/mechanic.ts';
import { rolePlay } from './role-play/mechanic.ts';
import { oralExam } from './oral-exam/mechanic.ts';
import type { MechanicViewProps } from './types.ts';

export const views: Record<string, ComponentType<MechanicViewProps<any>>> = {
  [minimalPairs.id]: MinimalPairsView,
  [osmosis.id]: OsmosisView,
  [wordFocus.id]: WordFocusView,
  [cloze.id]: ClozeView,
  [listening.id]: ListeningView,
  [dictation.id]: DictationView,
  [questionFormer.id]: QuestionFormerView,
  [syntaxBuilder.id]: SyntaxBuilderView,
  [pingPong.id]: PingPongView,
  [shadowing.id]: ShadowingView,
  [rolePlay.id]: RolePlayView,
  [oralExam.id]: OralExamView,
};
