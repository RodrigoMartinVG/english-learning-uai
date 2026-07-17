import { useCallback, useEffect, useState } from 'react';
import { useAudio, useAudioState } from '../../audio/AudioProvider.tsx';
import { Waveform } from '../../ui/Waveform.tsx';
import type { MechanicViewProps } from '../types.ts';
import type { ListeningRound } from './mechanic.ts';

export function ListeningView({ round, onDone }: MechanicViewProps<ListeningRound>) {
  const audio = useAudio();
  const state = useAudioState();
  const { target } = round;

  const [phase, setPhase] = useState<'listen' | 'answer'>('listen');
  const [q, setQ] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState<boolean[]>([]);
  const [showText, setShowText] = useState(false);

  const play = useCallback(
    (rateFactor?: number) =>
      void audio.speak({ key: target.id, text: target.narrative, speakerId: target.speaker, rateFactor }),
    [audio, target]
  );

  useEffect(() => {
    play();
    return () => audio.cancel();
  }, [play, audio]);

  const current = round.questions[q];
  const answered = picked !== null;

  if (phase === 'listen') {
    return (
      <div className="osmosis">
        <div className="osmosis__stage">
          <Waveform active={state === 'speaking'} />
          <div className="osmosis__controls">
            <button className="btn btn--primary" onClick={() => play()}>
              {state === 'speaking' ? '◼ Sonando' : '▶ Escuchar de nuevo'}
            </button>
            <button className="btn" onClick={() => play(0.75)}>
              🐢 Lento
            </button>
          </div>
          <p className="osmosis__hint">
            Es un relato largo. Escuchalo las veces que quieras antes de contestar.
          </p>
        </div>
        <button className="btn btn--primary btn--wide" onClick={() => { audio.cancel(); setPhase('answer'); }}>
          Estoy listo, preguntame →
        </button>
      </div>
    );
  }

  if (!current) {
    const ok = score.filter(Boolean).length;
    return (
      <div className="expansion">
        <p className={'verdict ' + (ok === score.length ? 'verdict--ok' : 'verdict--bad')}>
          {ok} de {score.length}
        </p>
        {/* El texto recién acá: mostrarlo antes convertiría esto en lectura. */}
        {!showText ? (
          <button className="btn btn--wide" onClick={() => setShowText(true)}>
            Ver la transcripción
          </button>
        ) : (
          <p className="expansion__gloss">{target.narrative}</p>
        )}
        <button className="btn btn--primary btn--wide" onClick={() => onDone(ok === score.length)} autoFocus>
          Siguiente →
        </button>
      </div>
    );
  }

  return (
    <div className="osmosis">
      <div className="osmosis__stage">
        <p className="mp__stem">{current.q}</p>
        <div className="osmosis__controls">
          <button className="btn" onClick={() => play()}>
            🔊 Escuchar el relato otra vez
          </button>
        </div>
        <p className="osmosis__hint">
          Pregunta {q + 1} de {round.questions.length}
        </p>
      </div>

      <ul className="osmosis__options">
        {current.options.map((opt, i) => (
          <li key={opt}>
            <button
              className={
                'option' +
                (answered && i === current.correctIndex ? ' option--correct' : '') +
                (answered && i === picked && i !== current.correctIndex ? ' option--wrong' : '')
              }
              onClick={() => {
                if (answered) return;
                setPicked(i);
                audio.cancel();
              }}
              disabled={answered}
            >
              <span className="option__text">{opt}</span>
            </button>
          </li>
        ))}
      </ul>

      {answered && (
        <button
          className="btn btn--primary btn--wide"
          onClick={() => {
            setScore((s) => [...s, picked === current.correctIndex]);
            setPicked(null);
            setQ((n) => n + 1);
          }}
          autoFocus
        >
          {q + 1 < round.questions.length ? 'Siguiente pregunta →' : 'Ver resultado →'}
        </button>
      )}
    </div>
  );
}
