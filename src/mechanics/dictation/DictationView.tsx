import { useCallback, useEffect, useRef, useState } from 'react';
import { useAudio, useAudioState } from '../../audio/AudioProvider.tsx';
import { Waveform } from '../../ui/Waveform.tsx';
import { MoreVoices } from '../../ui/MoreVoices.tsx';
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
  // Si fallaste aunque sea una vez en esta aparición, ver la respuesta y reintentar
  // no cuenta como acierto: se graba como repaso. Evita el falso positivo del SRS.
  const [failed, setFailed] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  const play = useCallback(
    (rateFactor?: number) =>
      void audio.speak({ key: round.audioKey, text: round.targets[0]!, speakerId: round.speakerId, rateFactor }),
    [audio, round]
  );

  useEffect(() => {
    setText('');
    setChecked(null);
    setFailed(false);
    play();
    input.current?.focus();
    return () => audio.cancel();
  }, [round, play, audio]);

  const check = () => {
    audio.cancel();
    const ok = round.targets.some((t) => tidy(t) === tidy(text));
    setChecked(ok);
    if (!ok) setFailed(true);
  };

  return (
    <div className="cz exlr">
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

      <div className="exlr__panel">
      {/* La pista del material: la frase cruda, sin puntuar. */}
      <p className="dict__raw">{round.raw}</p>

      <input
        ref={input}
        className="dict__input"
        value={text}
        onChange={(e) => setText(e.target.value)}
        // Enter comprueba; con el resultado ya visible, Enter avanza. `e.repeat` evita
        // que un Enter sostenido haga las dos cosas. `readOnly` mantiene el foco acá.
        onKeyDown={(e) => {
          if (e.key !== 'Enter' || e.repeat) return;
          e.preventDefault();
          if (checked === null) {
            if (text.trim()) check();
          } else {
            onDone(checked && !failed);
          }
        }}
        readOnly={checked !== null}
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
          {checked && failed && (
            <p className="retry-note">Lo corregiste después de fallar — se repasará pronto.</p>
          )}
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
          <MoreVoices audioKey={round.audioKey} text={round.targets[0]!} speakerId={round.speakerId} />
          <div className="ab">
            <button
              className="btn"
              onClick={() => {
                setChecked(null);
                setText('');
                input.current?.focus();
              }}
            >
              ↻ Reintentar
            </button>
            <button className="btn" onClick={() => play()}>
              🔊 Escuchar
            </button>
            <button className="btn btn--primary" onClick={() => onDone(checked)}>
              Siguiente →
            </button>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
