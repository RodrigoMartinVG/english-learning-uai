import { useCallback, useEffect } from 'react';
import { useAudio } from '../../audio/AudioProvider.tsx';
import { SpeakPanel } from '../../ui/SpeakPanel.tsx';
import type { MechanicViewProps } from '../types.ts';
import type { EsToEnSayRound } from './say.ts';

export function EsToEnSayView({ round, onDone }: MechanicViewProps<EsToEnSayRound>) {
  const audio = useAudio();

  // La referencia inglesa suena SOLO como feedback (el A/B de SpeakPanel, después de
  // grabar). Antes de hablar no hay audio: sonarlo sería regalar la respuesta.
  const playModel = useCallback(
    () => void audio.speak({ key: round.audioKey, text: round.accept[0]!, speakerId: round.speakerId }),
    [audio, round]
  );

  useEffect(() => () => audio.cancel(), [audio]);

  return (
    <div className="osmosis exlr">
      <div className="osmosis__stage">
        <p className="osmosis__hint">Decilo en inglés, en voz alta</p>
        <p className="mp__stem">{round.prompt}</p>
        <p className="osmosis__hint">Puede haber más de una forma válida. El inglés aparece al terminar.</p>
      </div>

      <div className="exlr__panel">
        <SpeakPanel
          targets={round.accept}
          neighbourhood={round.neighbourhood}
          lang="en-US"
          onPlayReference={playModel}
          onDone={onDone}
        />
      </div>
    </div>
  );
}
