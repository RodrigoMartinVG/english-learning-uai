import { useCallback, useEffect } from 'react';
import { useAudio, useAudioState } from '../../audio/AudioProvider.tsx';
import { Waveform } from '../../ui/Waveform.tsx';
import { SpeakPanel } from '../../ui/SpeakPanel.tsx';
import { speakerById } from '../../data/content.ts';
import type { MechanicViewProps } from '../types.ts';
import type { EchoSayRound } from './mechanic.ts';

export function EchoSayView({ round, onDone }: MechanicViewProps<EchoSayRound>) {
  const audio = useAudio();
  const state = useAudioState();
  const speaker = speakerById.get(round.speakerId);

  const play = useCallback(
    (rateFactor?: number) =>
      void audio.speak({ key: round.audioKey, text: round.text, speakerId: round.speakerId, rateFactor }),
    [audio, round]
  );

  // Suena solo al entrar: el estímulo es el audio, no el texto.
  useEffect(() => {
    play();
    return () => audio.cancel();
  }, [play, audio]);

  return (
    <div className="osmosis">
      <div className="osmosis__stage">
        <Waveform active={state === 'speaking'} />
        {/* Sin texto a la vista: la gracia es recuperarlo de oído. Aparece al terminar. */}
        <p className="osmosis__hint">
          Escuchá y repetilo <strong>sin leer</strong>. El texto aparece recién cuando terminás.
        </p>
        <div className="osmosis__controls">
          <button className="btn btn--primary" onClick={() => play()}>
            {state === 'speaking' ? '◼ Sonando' : '▶ Escuchar de nuevo'}
          </button>
          <button className="btn" onClick={() => play(0.75)}>
            🐢 Lento
          </button>
        </div>
      </div>

      <SpeakPanel
        targets={[round.text]}
        neighbourhood={round.neighbourhood}
        lang={speaker?.accent ?? 'en-US'}
        onPlayReference={() => play()}
        onDone={onDone}
      />
    </div>
  );
}
