/**
 * OsmosisView — la ronda de Ósmosis.
 *
 * Flujo: suena la frase → 4 opciones → veredicto → panel de expansión con las
 * otras formas de decir lo mismo y las respuestas naturales.
 *
 * El panel de expansión es lo que separa esto de un quiz: acertar no es el
 * final, es el permiso para ver la familia de la frase.
 */

import { useCallback, useEffect, useState } from 'react';
import { useAudio, useAudioState } from '../../audio/AudioProvider.tsx';
import { Waveform } from '../../ui/Waveform.tsx';
import { AltVoices } from '../../ui/AltVoices.tsx';
import { speakerById } from '../../data/content.ts';
import type { PhraseAtom } from '../../../content/schema.ts';
import type { MechanicViewProps } from '../types.ts';
import type { OsmosisRound } from './mechanic.ts';
import './osmosis.css';

export function OsmosisView({ round, onDone }: MechanicViewProps<OsmosisRound>) {
  const audio = useAudio();
  const state = useAudioState();
  const [picked, setPicked] = useState<number | null>(null);

  const speaker = speakerById.get(round.target.speaker);
  const answered = picked !== null;
  const correct = picked === round.correctIndex;

  const play = useCallback(
    (rateFactor?: number) => {
      void audio.speak({
        key: round.target.id,
        text: round.target.text,
        speakerId: round.target.speaker,
        rateFactor,
      });
    },
    [audio, round.target]
  );

  // Al entrar a una ronda nueva, suena sola: la mecánica empieza por el oído.
  useEffect(() => {
    setPicked(null);
    play();
    return () => audio.cancel();
  }, [round.target.id, play, audio]);

  const choose = (i: number) => {
    if (answered) return;
    setPicked(i);
    audio.cancel();
  };

  return (
    <div className="osmosis">
      <div className="osmosis__stage">
        <Waveform active={state === 'speaking'} />
        <div className="osmosis__controls">
          <button className="btn btn--primary" onClick={() => play()} aria-label="Escuchar la frase de nuevo">
            {state === 'speaking' ? '◼ Sonando' : '▶ Escuchar'}
          </button>
          <button className="btn" onClick={() => play(0.75)} aria-label="Escuchar más lento">
            🐢 Lento
          </button>
        </div>
        <AltVoices audioKey={round.target.id} text={round.target.text} speakerId={round.target.speaker} />
        <p className="osmosis__hint">
          {answered ? (
            <>Habla <strong>{speaker?.displayName ?? round.target.speaker}</strong></>
          ) : (
            'Escuchá y elegí qué frase era'
          )}
        </p>
      </div>

      <ul className="osmosis__options">
        {round.options.map((opt, i) => (
          <li key={opt.id}>
            <button
              className={
                'option' +
                (answered && i === round.correctIndex ? ' option--correct' : '') +
                (answered && i === picked && !correct ? ' option--wrong' : '')
              }
              onClick={() => choose(i)}
              disabled={answered}
            >
              <span className="option__text">{opt.text}</span>
              {answered && i === round.correctIndex && <span aria-hidden="true">✓</span>}
              {answered && i === picked && !correct && <span aria-hidden="true">✗</span>}
            </button>
          </li>
        ))}
      </ul>

      <div aria-live="polite" className="sr-only">
        {answered ? (correct ? 'Correcto' : `Incorrecto. Era: ${round.target.text}`) : ''}
      </div>

      {answered && <Expansion phrase={round.target} onNext={() => onDone(correct)} correct={correct} />}
    </div>
  );
}

/** El panel que aparece al responder: la frase deja de estar sola. */
function Expansion({
  phrase,
  correct,
  onNext,
}: {
  phrase: PhraseAtom;
  correct: boolean;
  onNext: () => void;
}) {
  const audio = useAudio();
  const say = (text: string, key: string, speakerId: string) =>
    void audio.speak({ key, text, speakerId });

  return (
    <div className="expansion">
      <p className={'verdict ' + (correct ? 'verdict--ok' : 'verdict--bad')}>
        {correct ? 'Correcto' : 'Era otra'}
      </p>

      {phrase.gloss && <p className="expansion__gloss">{phrase.gloss}</p>}

      {phrase.alternatives?.length ? (
        <section className="expansion__group">
          <h3>Otras formas de decir lo mismo</h3>
          {phrase.alternatives.map((alt, i) => (
            <button
              key={alt}
              className="chip"
              onClick={() => say(alt, `${phrase.id}.alt.${i}`, phrase.speaker)}
            >
              <span aria-hidden="true">🔊</span> {alt}
            </button>
          ))}
        </section>
      ) : null}

      {phrase.replies?.length ? (
        <section className="expansion__group">
          <h3>Respuestas naturales</h3>
          {phrase.replies.map((r) => (
            // Sin mp3 propio: estas replies viven en un átomo qa, que sabe con qué
            // voz se responden. Acá cae al fallback, y está bien.
            <button key={r} className="chip" onClick={() => say(r, `${phrase.id}.reply`, phrase.speaker)}>
              <span aria-hidden="true">🔊</span> {r}
            </button>
          ))}
        </section>
      ) : null}

      <button className="btn btn--primary btn--wide" onClick={onNext} autoFocus>
        Siguiente →
      </button>
    </div>
  );
}
