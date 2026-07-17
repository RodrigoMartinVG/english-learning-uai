import { useCallback, useEffect, useRef, useState } from 'react';
import { useAudio, useAudioState } from '../../audio/AudioProvider.tsx';
import { Waveform } from '../../ui/Waveform.tsx';
import type { MechanicViewProps } from '../types.ts';
import type { DictationRound } from './mechanic.ts';

/**
 * Acá la comparación es ESTRICTA, al revés que en el resto de la app.
 *
 * En las mecánicas de voz normalizamos todo (contracciones, números, mayúsculas)
 * porque castigar al alumno por un capricho del ASR sería injusto. Pero este
 * ejercicio ES la ortografía: si aceptáramos "its" por "it's" no quedaría
 * ejercicio ninguno. Solo se perdona el espacio sobrante.
 */
const tidy = (s: string) => s.trim().replace(/\s+/g, ' ');

export function DictationView({ round, onDone }: MechanicViewProps<DictationRound>) {
  const audio = useAudio();
  const state = useAudioState();
  const [text, setText] = useState('');
  const [checked, setChecked] = useState<null | boolean>(null);
  const input = useRef<HTMLInputElement>(null);

  const play = useCallback(
    (rateFactor?: number) =>
      void audio.speak({ key: round.audioKey, text: round.targets[0]!, speakerId: round.speakerId, rateFactor }),
    [audio, round]
  );

  useEffect(() => {
    setText('');
    setChecked(null);
    play();
    input.current?.focus();
    return () => audio.cancel();
  }, [round, play, audio]);

  const check = () => {
    audio.cancel();
    setChecked(round.targets.some((t) => tidy(t) === tidy(text)));
  };

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
        <p className="osmosis__hint">
          Escribila con mayúsculas, apóstrofes y signos. Eso es lo que se evalúa.
        </p>
      </div>

      {/* La pista del material: la frase cruda, sin puntuar. */}
      <p className="dict__raw">{round.raw}</p>

      <input
        ref={input}
        className="dict__input"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && text.trim() && checked === null && check()}
        disabled={checked !== null}
        placeholder="Escribí lo que oíste…"
        aria-label="Tu respuesta"
        autoComplete="off"
        autoCapitalize="off"
        spellCheck={false}
      />

      {checked === null ? (
        <button className="btn btn--primary btn--wide" onClick={check} disabled={!text.trim()}>
          Comprobar
        </button>
      ) : (
        <div className="expansion">
          <p className={'verdict ' + (checked ? 'verdict--ok' : 'verdict--bad')}>
            {checked ? 'Exacto' : 'No es exacto'}
          </p>
          {!checked && (
            <>
              <p className="dict__diff">
                <span className="dict__label">Escribiste</span> {text}
              </p>
              <p className="dict__diff">
                <span className="dict__label">Era</span> <strong>{round.targets[0]}</strong>
              </p>
            </>
          )}
          <div className="ab">
            <button className="btn" onClick={() => play()}>
              🔊 Escuchar
            </button>
            <button className="btn btn--primary" onClick={() => onDone(checked)} autoFocus>
              Siguiente →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
