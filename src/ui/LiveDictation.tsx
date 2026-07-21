/**
 * LiveDictation — hablás y se transcribe EN VIVO, con el vocabulario del tema en
 * verde, y podés escuchar tu toma. El corazón de "Creá tu propio guion".
 *
 * No puntúa pronunciación (ningún navegador puede). El feedback honesto es doble:
 * el transcript en vivo (si se escribe bien, se te entendió) y el resaltado verde
 * (estás usando el vocabulario esperado). Ver PLAN-crea-tu-guion §4-5.
 *
 * La grabación se entrega a onDone y la DUELE el padre (para reproducir el guion
 * entero al final); por eso acá no se revoca al desmontar — solo al rehacer.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  createRecognizer,
  isRecognitionSupported,
  type RecognitionState,
} from '../audio/Recognition.ts';
import { createRecorder, isRecordingSupported, type Recording } from '../audio/Recorder.ts';
import { useAudio } from '../audio/AudioProvider.tsx';
import { normalize } from '../engine/grading/speech.ts';
import './speak.css';
import './livedictation.css';

export interface DictationResult {
  transcript: string;
  recording: Recording | null;
}

/** Pinta en verde los tokens del texto que están en el vocabulario esperado. */
export function Highlighted({ text, expected }: { text: string; expected: Set<string> }) {
  const parts = text.split(/(\s+)/);
  return (
    <>
      {parts.map((p, i) => {
        if (!p || /^\s+$/.test(p)) return <span key={i}>{p}</span>;
        const norm = normalize(p);
        return (
          <span key={i} className={norm && expected.has(norm) ? 'live__hit' : undefined}>
            {p}
          </span>
        );
      })}
    </>
  );
}

export function LiveDictation({
  expected,
  lang,
  onDone,
}: {
  expected: Set<string>;
  lang: string;
  onDone: (r: DictationResult) => void;
}) {
  const recognizer = useRef(createRecognizer()).current;
  const recorder = useRef(createRecorder()).current;
  const audio = useAudio();
  const [state, setState] = useState<RecognitionState>(recognizer.getState());
  const [interim, setInterim] = useState('');
  const [transcript, setTranscript] = useState<string | null>(null);
  const [recording, setRecording] = useState<Recording | null>(null);

  useEffect(() => recognizer.subscribe(setState), [recognizer]);
  // Al desmontar: cortar mic. NO revocar la grabación (la usa el padre).
  useEffect(() => () => {
    recognizer.abort();
    recorder.cancel();
  }, [recognizer, recorder]);

  const listen = useCallback(async () => {
    setTranscript(null);
    setInterim('');
    recording?.revoke(); // rehacer: la toma anterior se descarta
    setRecording(null);

    if (isRecordingSupported()) {
      try {
        await recorder.start();
      } catch {
        /* sin grabación se puede seguir: se pierde el "escucharte" */
      }
    }
    try {
      const { transcript: said } = await recognizer.listen({
        lang,
        continuous: true,
        leadMs: 9000,
        silenceMs: 3500,
        onInterim: setInterim,
      });
      const rec = await recorder.stop();
      setInterim('');
      setTranscript(said);
      setRecording(rec);
    } catch {
      recorder.cancel();
      setInterim('');
    }
  }, [lang, recognizer, recorder, recording]);

  if (!isRecognitionSupported()) {
    return (
      <div className="speak speak--blocked">
        <p>
          Este navegador no reconoce voz. Probá <strong>Chrome</strong> o <strong>Edge</strong>.
        </p>
        <button className="btn btn--wide" onClick={() => onDone({ transcript: '', recording: null })}>
          Saltear
        </button>
      </div>
    );
  }

  const busy = state === 'starting' || state === 'listening';

  if (transcript === null) {
    return (
      <div className="live">
        {!busy ? (
          <button className="mic" onClick={listen} aria-label="Hablá tu respuesta">
            <span className="mic__icon" aria-hidden="true">🎙</span>
            <span className="mic__label">Hablá tu respuesta</span>
          </button>
        ) : (
          <>
            <p className={'live__status' + (state === 'listening' ? ' live__status--live' : '')}>
              {state === 'starting' ? 'Iniciando…' : 'Te escucho…'}
            </p>
            <p className="live__interim" aria-live="polite">
              <Highlighted text={interim || '…'} expected={expected} />
            </p>
            <p className="live__hint">Cuando te quedes en silencio unos segundos, se cierra.</p>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="live">
      <p className="live__label">Lo que dijiste (en verde, el vocabulario del tema)</p>
      <p className="live__transcript">
        <Highlighted text={transcript || '—'} expected={expected} />
      </p>
      <div className="ab">
        {recording && (
          <button className="btn" onClick={() => void audio.playClip(recording.url)}>
            🎤 Escucharte
          </button>
        )}
        <button className="btn" onClick={listen}>
          Rehacer
        </button>
        <button
          className="btn btn--primary"
          onClick={() => onDone({ transcript: transcript || '', recording })}
          autoFocus
        >
          Siguiente →
        </button>
      </div>
    </div>
  );
}
