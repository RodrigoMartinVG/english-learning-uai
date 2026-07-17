import { useCallback, useEffect } from 'react';
import { useAudio } from '../../audio/AudioProvider.tsx';
import { SpeakPanel } from '../../ui/SpeakPanel.tsx';
import type { MechanicViewProps } from '../types.ts';
import type { QuestionFormerRound } from './mechanic.ts';

export function QuestionFormerView({ round, onDone }: MechanicViewProps<QuestionFormerRound>) {
  const audio = useAudio();

  const playAnswer = useCallback(
    () => void audio.speak({ key: round.audioKey, text: round.targets[0]!, speakerId: round.speakerId }),
    [audio, round]
  );

  useEffect(() => () => audio.cancel(), [audio]);

  return (
    <div className="osmosis">
      <div className="osmosis__stage">
        {/* La afirmación se LEE. Lo que hay que producir es la pregunta, y esa
            no se muestra ni se escucha hasta el final: si no, sería repetir. */}
        <p className="osmosis__hint">Alguien te dice:</p>
        <p className="mp__stem">{round.statement}</p>
        <p className="osmosis__hint">¿Qué pregunta lleva a esa respuesta? Decila en voz alta.</p>
      </div>

      <SpeakPanel
        targets={round.targets}
        neighbourhood={round.neighbourhood}
        lang="en-US"
        onPlayReference={playAnswer}
        onDone={onDone}
      />
    </div>
  );
}
