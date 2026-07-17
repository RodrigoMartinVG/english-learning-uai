import { useCallback, useEffect, useState } from 'react';
import { useAudio, useAudioState } from '../../audio/AudioProvider.tsx';
import { Waveform } from '../../ui/Waveform.tsx';
import type { MechanicViewProps } from '../types.ts';
import type { WordFocusRound } from './mechanic.ts';

export function WordFocusView({ round, onDone }: MechanicViewProps<WordFocusRound>) {
  const audio = useAudio();
  const state = useAudioState();
  const [picked, setPicked] = useState<number | null>(null);
  const { target, example } = round;
  const answered = picked !== null;
  const correct = picked === round.correctIndex;

  const speakerId = example?.speaker ?? 'narrator';

  const play = useCallback(
    (rateFactor?: number) =>
      void audio.speak({ key: target.id, text: target.word, speakerId, rateFactor }),
    [audio, target, speakerId]
  );

  useEffect(() => {
    setPicked(null);
    play();
    return () => audio.cancel();
  }, [play, audio]);

  return (
    <div className="osmosis">
      <div className="osmosis__stage">
        <Waveform active={state === 'speaking'} />
        <div className="osmosis__controls">
          <button className="btn btn--primary" onClick={() => play()}>
            {state === 'speaking' ? '◼ Sonando' : '▶ Escuchar'}
          </button>
          <button className="btn" onClick={() => play(0.7)}>
            🐢 Lento
          </button>
        </div>
        {/* La palabra escrita aparece recién al responder: si no, esto es leer. */}
        <p className="osmosis__hint">
          {answered ? <strong className="wf__word">{target.word}</strong> : '¿Qué palabra es?'}
        </p>
      </div>

      <ul className="osmosis__options">
        {round.options.map((opt, i) => (
          <li key={opt}>
            <button
              className={
                'option' +
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
              <span className="option__text">{opt}</span>
            </button>
          </li>
        ))}
      </ul>

      <div aria-live="polite" className="sr-only">
        {answered ? (correct ? 'Correcto' : `Incorrecto. Era: ${target.gloss}`) : ''}
      </div>

      {answered && (
        <div className="expansion">
          <p className={'verdict ' + (correct ? 'verdict--ok' : 'verdict--bad')}>
            {correct ? 'Correcto' : `Era “${target.gloss}”`}
          </p>

          {/* Ninguna palabra queda sola: siempre vuelve a su oración. */}
          {example && (
            <section className="expansion__group">
              <h3>En contexto</h3>
              <button
                className="chip"
                onClick={() =>
                  void audio.speak({ key: example.id, text: example.text, speakerId: example.speaker })
                }
              >
                <span aria-hidden="true">🔊</span> {example.text}
              </button>
              {example.gloss && <p className="expansion__gloss">{example.gloss}</p>}
            </section>
          )}

          {target.variantOf && (
            <p className="speak__note">
              🇬🇧 {target.variantOf.uk} · 🇺🇸 {target.variantOf.us}
            </p>
          )}
          {target.focus === 'phonetic' && target.tags?.length ? (
            <p className="speak__note">Prestá atención al sonido: {target.tags.join(' · ')}</p>
          ) : null}

          <button className="btn btn--primary btn--wide" onClick={() => onDone(correct)} autoFocus>
            Siguiente →
          </button>
        </div>
      )}
    </div>
  );
}
