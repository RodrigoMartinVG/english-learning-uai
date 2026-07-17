import { useCallback, useEffect, useState } from 'react';
import { useAudio, useAudioState } from '../../audio/AudioProvider.tsx';
import { Waveform } from '../../ui/Waveform.tsx';
import { normalize } from '../../engine/grading/speech.ts';
import { BLANK } from '../../../content/schema.ts';
import type { MechanicViewProps } from '../types.ts';
import type { ClozeRound } from './mechanic.ts';
import './cloze.css';

export function ClozeView({ round, onDone }: MechanicViewProps<ClozeRound>) {
  const audio = useAudio();
  const state = useAudioState();
  const [filled, setFilled] = useState<(string | null)[]>(() => round.blanks.map(() => null));
  const [active, setActive] = useState(0);
  const [checked, setChecked] = useState<null | boolean[]>(null);

  const play = useCallback(
    (rateFactor?: number) =>
      void audio.speak({ key: round.audioKey, text: round.spoken, speakerId: round.speakerId, rateFactor }),
    [audio, round]
  );

  useEffect(() => {
    setFilled(round.blanks.map(() => null));
    setActive(0);
    setChecked(null);
    play();
    return () => audio.cancel();
  }, [round, play, audio]);

  const put = (word: string) => {
    if (checked) return;
    setFilled((prev) => {
      const next = [...prev];
      next[active] = word;
      return next;
    });
    // Salta al primer hueco que siga vacío: escribir de izquierda a derecha.
    const nextEmpty = filled.findIndex((f, i) => i > active && f === null);
    setActive(nextEmpty === -1 ? Math.min(active + 1, round.blanks.length - 1) : nextEmpty);
  };

  const check = () => {
    audio.cancel();
    setChecked(
      round.blanks.map((b, i) =>
        b.accept.some((a) => normalize(a) === normalize(filled[i] ?? ''))
      )
    );
  };

  const allFilled = filled.every((f) => f !== null);
  const allOk = checked?.every(Boolean) ?? false;
  const parts = round.stem.split(BLANK);

  return (
    <div className="cz">
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
        <p className="osmosis__hint">Suena completa. Reponé lo que falta.</p>
      </div>

      <p className="cz__stem">
        {parts.map((part, i) => (
          <span key={i}>
            {part}
            {i < round.blanks.length && (
              <button
                className={
                  'cz__slot' +
                  (i === active && !checked ? ' cz__slot--active' : '') +
                  (checked ? (checked[i] ? ' cz__slot--ok' : ' cz__slot--bad') : '')
                }
                onClick={() => !checked && setActive(i)}
                disabled={!!checked}
                aria-label={`Hueco ${i + 1}`}
              >
                {filled[i] ?? '   '}
              </button>
            )}
          </span>
        ))}
      </p>

      <div className="cz__bank">
        {round.bank.map((w) => (
          <button key={w} className="sb__chip" onClick={() => put(w)} disabled={!!checked}>
            {w}
          </button>
        ))}
      </div>

      {!checked ? (
        <div className="ab">
          <button className="btn" onClick={() => setFilled(round.blanks.map(() => null))}>
            Limpiar
          </button>
          <button className="btn btn--primary" onClick={check} disabled={!allFilled}>
            Comprobar
          </button>
        </div>
      ) : (
        <div className="expansion">
          <p className={'verdict ' + (allOk ? 'verdict--ok' : 'verdict--bad')}>
            {allOk ? 'Correcto' : 'Revisá los huecos en rojo'}
          </p>
          {!allOk && (
            <p className="cz__solution">
              {round.blanks
                .map((b, i) => (checked[i] ? null : `${i + 1}: ${b.accept[0]}`))
                .filter(Boolean)
                .join(' · ')}
            </p>
          )}
          {/* Cuando la grilla de la cátedra discute con nosotros, se dice. */}
          {round.blanks.map((b, i) =>
            b.note ? (
              <p key={i} className="speak__note">
                ⚠ {b.note}
              </p>
            ) : null
          )}
          <div className="ab">
            <button className="btn" onClick={() => play()}>
              🔊 Escuchar
            </button>
            <button className="btn btn--primary" onClick={() => onDone(allOk)} autoFocus>
              Siguiente →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
