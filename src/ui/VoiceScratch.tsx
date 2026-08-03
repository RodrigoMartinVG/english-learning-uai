/**
 * VoiceScratch — grabar rápido, en la toolbar y sin popup.
 *
 * El scratch pad inmediato: UN click en el micro empieza a grabar (el botón se pone
 * rojo), el texto reconocido se escribe en la misma toolbar, corta solo por silencio
 * o con otro click, y ▶ reproduce tu voz por el reproductor del header. Nada más:
 * para setear un objetivo y practicarlo con varios intentos está el Banco de práctica
 * (VoicePractice), que vive en su propio espacio.
 */

import { useEffect, useRef, useState } from 'react';
import { useAudio } from '../audio/AudioProvider.tsx';
import { createRecognizer, isRecognitionSupported, type RecognitionState } from '../audio/Recognition.ts';
import { createRecorder, isRecordingSupported, type Recording } from '../audio/Recorder.ts';
import './voicescratch.css';

export function VoiceScratch() {
  const audio = useAudio();
  const recognizer = useRef(createRecognizer()).current;
  const recorder = useRef(createRecorder()).current;
  const textRef = useRef<HTMLSpanElement>(null);

  const [state, setState] = useState<RecognitionState>(recognizer.getState());
  const [arming, setArming] = useState(false);
  const [attempted, setAttempted] = useState(false);
  const [text, setText] = useState('');
  const [mine, setMine] = useState<Recording | null>(null);

  useEffect(() => recognizer.subscribe(setState), [recognizer]);
  useEffect(
    () => () => {
      recognizer.abort();
      recorder.cancel();
      mine?.revoke();
    },
    [recognizer, recorder, mine]
  );

  // Mantener a la vista lo último dictado mientras el texto crece.
  useEffect(() => {
    if (textRef.current) textRef.current.scrollLeft = textRef.current.scrollWidth;
  }, [text]);

  const supported = isRecognitionSupported();
  const busy = state === 'starting' || state === 'listening';
  const live = busy || arming;

  const record = async () => {
    setText('');
    mine?.revoke();
    setMine(null);
    audio.cancel();
    setArming(true);

    if (isRecordingSupported()) {
      try {
        await recorder.start();
      } catch {
        /* sin grabación se transcribe igual, solo no se reproduce */
      }
    }

    try {
      const { transcript } = await recognizer.listen({
        lang: 'en-US',
        continuous: true,
        leadMs: 8000,
        silenceMs: 3000,
        onProgress: setText,
      });
      const rec = await recorder.stop();
      setMine(rec);
      setText(transcript);
    } catch {
      recorder.cancel();
    } finally {
      setArming(false);
    }
  };

  // El botón ES el disparador: grabando → corta; si no → arranca ya.
  const onToggle = () => {
    setAttempted(true);
    if (!supported) return;
    if (live) {
      recognizer.stop();
      return;
    }
    void record();
  };

  const clear = () => {
    mine?.revoke();
    setMine(null);
    setText('');
    setAttempted(false);
  };

  const note = !supported
    ? 'Este navegador no reconoce voz (probá Chrome o Edge)'
    : state === 'denied'
      ? 'Micrófono bloqueado: permitilo 🔒 y recargá'
      : '';
  const showStrip = live || !!text || !!mine || (attempted && !!note);

  return (
    <div className="vscratch">
      <button
        className={'vscratch__toggle' + (live ? ' vscratch__toggle--live' : '')}
        onClick={onToggle}
        title={live ? 'Detener grabación' : 'Grabar rápido'}
        aria-label={live ? 'Detener grabación' : 'Grabar rápido'}
        aria-pressed={live}
      >
        🎙
      </button>

      {showStrip && (
        <div className="vscratch__strip">
          {attempted && note ? (
            <span className="vscratch__note">{note}</span>
          ) : (
            <span
              ref={textRef}
              className={'vscratch__text' + (text ? '' : ' vscratch__text--dim')}
              title={text || undefined}
              aria-live="polite"
            >
              {text || (live ? 'Hablá… corta solo al terminar' : '')}
            </span>
          )}

          {mine && !live && (
            <button
              className="vscratch__mini"
              onClick={() => void audio.playClip(mine.url)}
              title="Escuchar mi voz"
              aria-label="Escuchar mi voz"
            >
              ▶
            </button>
          )}
          {!live && (text || mine || (attempted && note)) && (
            <button className="vscratch__mini" onClick={clear} title="Borrar" aria-label="Borrar">
              ✕
            </button>
          )}
        </div>
      )}
    </div>
  );
}
