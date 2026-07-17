import { useCallback, useEffect, useState } from 'react';
import { useAudio, useAudioState } from '../../audio/AudioProvider.tsx';
import { Waveform } from '../../ui/Waveform.tsx';
import type { MechanicViewProps } from '../types.ts';
import type { MinimalPairsRound } from './mechanic.ts';

/** La clave del manifest para el ejemplo i de un contraste. La fija build-audio.ts. */
const audioKey = (round: MinimalPairsRound) =>
  `${round.atom.id}.ex.${round.atom.examples.indexOf(round.example)}`;

export function MinimalPairsView({ round, onDone }: MechanicViewProps<MinimalPairsRound>) {
  const audio = useAudio();
  const state = useAudioState();
  const [picked, setPicked] = useState<number | null>(null);
  const answered = picked !== null;
  const correct = picked === round.correctIndex;

  const play = useCallback(
    (rateFactor?: number) => {
      void audio.speak({
        key: audioKey(round),
        text: round.spoken,
        speakerId: 'narrator',
        rateFactor,
      });
    },
    [audio, round]
  );

  useEffect(() => {
    setPicked(null);
    play();
    return () => audio.cancel();
  }, [round, play, audio]);

  return (
    <div className="osmosis">
      <div className="osmosis__stage">
        <Waveform active={state === 'speaking'} />
        <div className="osmosis__controls">
          <button className="btn btn--primary" onClick={() => play()} aria-label="Escuchar de nuevo">
            {state === 'speaking' ? '◼ Sonando' : '▶ Escuchar'}
          </button>
          <button className="btn" onClick={() => play(0.7)} aria-label="Escuchar más lento">
            🐢 Lento
          </button>
        </div>
        <p className="osmosis__hint">
          {round.atom.discriminator === 'syntax'
            ? 'Suenan igual: decidilo por el contexto, no por el oído'
            : 'Escuchá bien: la diferencia está en el sonido'}
        </p>
      </div>

      <p className="mp__stem">
        {round.example.text.split('___').map((part, i) => (
          <span key={i}>
            {i > 0 && (
              <b className={answered ? (correct ? 'mp__slot--ok' : 'mp__slot--bad') : 'mp__slot'}>
                {answered ? round.options[round.correctIndex] : '?'}
              </b>
            )}
            {part}
          </span>
        ))}
      </p>

      <ul className="osmosis__options mp__options">
        {round.options.map((opt, i) => (
          <li key={opt}>
            <button
              className={
                'option option--center' +
                (answered && i === round.correctIndex ? ' option--correct' : '') +
                (answered && i === picked && !correct ? ' option--wrong' : '')
              }
              onClick={() => {
                if (answered) return;
                setPicked(i);
                audio.cancel();
              }}
              disabled={answered}
            >
              <span className="mp__word">{opt}</span>
            </button>
          </li>
        ))}
      </ul>

      <div aria-live="polite" className="sr-only">
        {answered ? (correct ? 'Correcto' : `Incorrecto. Era ${round.options[round.correctIndex]}`) : ''}
      </div>

      {answered && (
        <div className="expansion">
          <p className={'verdict ' + (correct ? 'verdict--ok' : 'verdict--bad')}>
            {correct ? 'Correcto' : `Era “${round.options[round.correctIndex]}”`}
          </p>
          {round.atom.source.note && <p className="expansion__gloss">{round.atom.source.note}</p>}
          <button className="btn btn--primary btn--wide" onClick={() => onDone(correct)} autoFocus>
            Siguiente →
          </button>
        </div>
      )}
    </div>
  );
}
