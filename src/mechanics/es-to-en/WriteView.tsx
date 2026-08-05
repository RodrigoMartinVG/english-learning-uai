import { useCallback, useEffect, useRef, useState } from 'react';
import { useAudio } from '../../audio/AudioProvider.tsx';
import { gradeSpeech, type SpeechVerdict } from '../../engine/grading/speech.ts';
import { MoreVoices } from '../../ui/MoreVoices.tsx';
import type { MechanicViewProps } from '../types.ts';
import type { EsToEnWriteRound } from './write.ts';
import '../../ui/speak.css';

/** Elige el mejor veredicto entre las formas válidas: no hay UNA traducción correcta. */
function bestVerdict(accept: string[], input: string): SpeechVerdict {
  return accept
    .map((t) => gradeSpeech(t, input))
    .sort((a, b) => Number(b.match) - Number(a.match) || b.accuracy - a.accuracy)[0]!;
}

export function EsToEnWriteView({ round, onDone }: MechanicViewProps<EsToEnWriteRound>) {
  const audio = useAudio();
  const [text, setText] = useState('');
  const [verdict, setVerdict] = useState<SpeechVerdict | null>(null);
  // Fallar aunque sea una vez (y ver el diff/modelo) no cuenta como acierto: se graba
  // como repaso aunque después lo corrijas. Evita el falso positivo del SRS.
  const [failed, setFailed] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  // El modelo inglés SOLO como feedback: sonarlo antes regalaría la respuesta.
  const playModel = useCallback(
    () => void audio.speak({ key: round.audioKey, text: round.accept[0]!, speakerId: round.speakerId }),
    [audio, round]
  );

  useEffect(() => {
    setText('');
    setVerdict(null);
    setFailed(false);
    input.current?.focus();
    return () => audio.cancel();
  }, [round, audio]);

  const check = () => {
    const v = bestVerdict(round.accept, text);
    setVerdict(v);
    if (!v.match) setFailed(true);
  };

  return (
    <div className="cz exlr">
      <div className="osmosis__stage">
        <p className="osmosis__hint">Decilo en inglés</p>
        <p className="mp__stem">{round.prompt}</p>
        <p className="osmosis__hint">
          No importan mayúsculas ni signos. Puede haber más de una forma válida.
        </p>
      </div>

      <div className="exlr__panel">
        <input
          ref={input}
          className="dict__input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          // Enter comprueba; con el veredicto ya visible, Enter avanza. `readOnly` (no
          // `disabled`) mantiene el foco para que Enter siga funcionando después.
          onKeyDown={(e) => {
            if (e.key !== 'Enter' || e.repeat) return;
            e.preventDefault();
            if (verdict === null) {
              if (text.trim()) check();
            } else {
              onDone(verdict.match && !failed);
            }
          }}
          readOnly={verdict !== null}
          placeholder="Escribilo en inglés…"
          aria-label="Tu respuesta en inglés"
          autoComplete="off"
        />

        {verdict === null ? (
          <button className="btn btn--primary btn--wide" onClick={check} disabled={!text.trim()}>
            Comprobar
          </button>
        ) : (
          <div className="expansion">
            <p className={'verdict ' + (verdict.match ? 'verdict--ok' : 'verdict--bad')}>
              {verdict.match ? 'Bien dicho' : 'No es así'}
            </p>
            {verdict.match && failed && (
              <p className="retry-note">Lo corregiste después de fallar — se repasará pronto.</p>
            )}
            <p className="speak__diff">
              {verdict.words.map((w, i) => (
                <span key={i} className={'w w--' + w.status} title={w.heard ? `escribiste: ${w.heard}` : undefined}>
                  {w.word}
                </span>
              ))}
            </p>
            {round.accept.length > 1 && (
              <p className="speak__note">También vale: {round.accept.slice(1).join(' · ')}</p>
            )}
            <MoreVoices audioKey={round.audioKey} text={round.accept[0]!} speakerId={round.speakerId} />
            <div className="ab">
              <button
                className="btn"
                onClick={() => {
                  setVerdict(null);
                  setText('');
                  input.current?.focus();
                }}
              >
                ↻ Reintentar
              </button>
              <button className="btn" onClick={playModel}>
                🔊 Escuchar en inglés
              </button>
              <button className="btn btn--primary" onClick={() => onDone(verdict.match)}>
                Siguiente →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
