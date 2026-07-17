import { useCallback, useEffect, useState } from 'react';
import { useAudio, useAudioState } from '../../audio/AudioProvider.tsx';
import { Waveform } from '../../ui/Waveform.tsx';
import { AltVoices } from '../../ui/AltVoices.tsx';
import { SpeakPanel } from '../../ui/SpeakPanel.tsx';
import { speakerById } from '../../data/content.ts';
import type { MechanicViewProps } from '../types.ts';
import type { PingPongRound } from './mechanic.ts';

export function PingPongView({ round, onDone }: MechanicViewProps<PingPongRound>) {
  const audio = useAudio();
  const state = useAudioState();
  const [peek, setPeek] = useState(false);
  const { target } = round;
  const asker = speakerById.get(target.speaker);

  const ask = useCallback(
    () => void audio.speak({ key: target.id, text: target.prompt, speakerId: target.speaker }),
    [audio, target]
  );

  useEffect(() => {
    setPeek(false);
    ask();
    return () => audio.cancel();
  }, [ask, audio]);

  return (
    <div className="osmosis">
      <div className="osmosis__stage">
        <Waveform active={state === 'speaking'} />
        {/* La pregunta NO se muestra: en un final oral el examinador no te la escribe. */}
        <div className="osmosis__controls">
          <button className="btn btn--primary" onClick={ask}>
            {state === 'speaking' ? '◼ Preguntando' : '▶ Repetir pregunta'}
          </button>
        </div>
        <AltVoices audioKey={target.id} text={target.prompt} speakerId={target.speaker} />
        <p className="osmosis__hint">
          Te pregunta <strong>{asker?.displayName ?? target.speaker}</strong>. Contestá en voz alta.
        </p>
      </div>

      <SpeakPanel
        targets={round.accepted}
        neighbourhood={round.neighbourhood}
        lang={asker?.accent ?? 'en-US'}
        onPlayReference={() =>
          void audio.speak({
            key: `${target.id}.reply.0`,
            text: round.accepted[0]!,
            speakerId: target.replySpeaker,
          })
        }
        onDone={onDone}
      />

      {/* Rendirse es legítimo, pero explícito: si se lo damos gratis, no produce. */}
      {!peek ? (
        <button className="btn" onClick={() => setPeek(true)}>
          No me sale — mostrar la pregunta
        </button>
      ) : (
        <div className="expansion">
          <p className="expansion__gloss">“{target.prompt}”</p>
          <p className="speak__note">Respuestas válidas: {round.accepted.join(' · ')}</p>
        </div>
      )}
    </div>
  );
}
