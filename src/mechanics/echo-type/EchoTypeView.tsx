import { useCallback, useEffect, useRef, useState } from 'react';
import { useAudio, useAudioState } from '../../audio/AudioProvider.tsx';
import { Waveform } from '../../ui/Waveform.tsx';
import { gradeSpeech, type SpeechVerdict } from '../../engine/grading/speech.ts';
import type { MechanicViewProps } from '../types.ts';
import type { EchoTypeRound } from './mechanic.ts';
import '../../ui/speak.css';

export function EchoTypeView({ round, onDone }: MechanicViewProps<EchoTypeRound>) {
  const audio = useAudio();
  const state = useAudioState();
  const [text, setText] = useState('');
  const [verdict, setVerdict] = useState<SpeechVerdict | null>(null);
  const input = useRef<HTMLInputElement>(null);

  const play = useCallback(
    (rateFactor?: number) =>
      void audio.speak({ key: round.audioKey, text: round.text, speakerId: round.speakerId, rateFactor }),
    [audio, round]
  );

  useEffect(() => {
    setText('');
    setVerdict(null);
    play();
    input.current?.focus();
    return () => audio.cancel();
  }, [round, play, audio]);

  // Se corrige como la voz: normaliza contracciones/números y compara por palabra.
  const check = () => {
    audio.cancel();
    setVerdict(gradeSpeech(round.text, text));
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
          Escribí lo que oíste, <strong>sin verlo</strong>. No importan mayúsculas ni signos.
        </p>
      </div>

      <input
        ref={input}
        className="dict__input"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && text.trim() && verdict === null && check()}
        disabled={verdict !== null}
        placeholder="Escribí lo que oíste…"
        aria-label="Tu respuesta"
        autoComplete="off"
      />

      {verdict === null ? (
        <button className="btn btn--primary btn--wide" onClick={check} disabled={!text.trim()}>
          Comprobar
        </button>
      ) : (
        <div className="expansion">
          <p className={'verdict ' + (verdict.match ? 'verdict--ok' : 'verdict--bad')}>
            {verdict.match ? 'Lo escribiste bien' : 'No es lo que se oía'}
          </p>
          <p className="speak__diff">
            {verdict.words.map((w, i) => (
              <span key={i} className={'w w--' + w.status} title={w.heard ? `escribiste: ${w.heard}` : undefined}>
                {w.word}
              </span>
            ))}
          </p>
          <div className="ab">
            <button className="btn" onClick={() => play()}>
              🔊 Escuchar
            </button>
            <button className="btn btn--primary" onClick={() => onDone(verdict.match)} autoFocus>
              Siguiente →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
