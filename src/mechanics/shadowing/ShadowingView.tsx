import { useCallback, useEffect } from 'react';
import { useAudio, useAudioState } from '../../audio/AudioProvider.tsx';
import { Waveform } from '../../ui/Waveform.tsx';
import { SpeakPanel } from '../../ui/SpeakPanel.tsx';
import { speakerById } from '../../data/content.ts';
import type { MechanicViewProps } from '../types.ts';
import type { ShadowingRound } from './mechanic.ts';

export function ShadowingView({ round, onDone }: MechanicViewProps<ShadowingRound>) {
  const audio = useAudio();
  const state = useAudioState();
  const { target } = round;
  const speaker = speakerById.get(target.speaker);

  const play = useCallback(
    (rateFactor?: number) =>
      void audio.speak({ key: target.id, text: target.text, speakerId: target.speaker, rateFactor }),
    [audio, target]
  );

  useEffect(() => {
    play();
    return () => audio.cancel();
  }, [play, audio]);

  return (
    <div className="osmosis">
      <div className="osmosis__stage">
        <Waveform active={state === 'speaking'} />
        {/* Acá el texto SÍ se muestra: shadowing es imitar, no adivinar. */}
        <p className="mp__stem">{target.text}</p>
        {target.ipa && (
          <p className="osmosis__hint" style={{ fontFamily: 'var(--mono)' }}>
            {target.ipa}
          </p>
        )}
        <div className="osmosis__controls">
          <button className="btn btn--primary" onClick={() => play()}>
            {state === 'speaking' ? '◼ Sonando' : '▶ Escuchar'}
          </button>
          <button className="btn" onClick={() => play(0.75)}>
            🐢 Lento
          </button>
        </div>
        <p className="osmosis__hint">
          Imitá a <strong>{speaker?.displayName ?? target.speaker}</strong>: el ritmo y la
          entonación, no solo las palabras
        </p>
      </div>

      <SpeakPanel
        targets={[target.text]}
        neighbourhood={round.neighbourhood}
        lang={speaker?.accent ?? 'en-US'}
        onPlayReference={() => play()}
        onDone={onDone}
      />
    </div>
  );
}
