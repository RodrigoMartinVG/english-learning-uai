/**
 * VoiceScratch — el banco de pruebas de voz, siempre a mano en la toolbar.
 *
 * Nada que ver con la corrección de un ejercicio: es para probar en cualquier
 * momento si te sale una palabra o una frase. Grabás, ves el texto llenarse con lo
 * que el reconocedor entiende, y escuchás tu propia voz por el MISMO reproductor del
 * header (playClip → transporte). Reutiliza el reconocedor y el grabador de siempre.
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

  const [open, setOpen] = useState(false);
  const [state, setState] = useState<RecognitionState>(recognizer.getState());
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

  const supported = isRecognitionSupported();
  const busy = state === 'starting' || state === 'listening';

  const record = async () => {
    setText('');
    mine?.revoke();
    setMine(null);
    audio.cancel(); // que no pelee con una reproducción anterior

    if (isRecordingSupported()) {
      try {
        await recorder.start();
      } catch {
        /* sin grabación se puede transcribir igual, solo no se reproduce */
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
    }
  };

  const stop = () => recognizer.stop();

  return (
    <div className="vscratch">
      <button
        className={'vscratch__toggle' + (busy ? ' vscratch__toggle--live' : '')}
        onClick={() => setOpen((v) => !v)}
        title="Probá tu voz"
        aria-label="Probá tu voz"
        aria-expanded={open}
      >
        🎙
      </button>

      {open && (
        <div className="vscratch__panel" role="dialog" aria-label="Probá tu voz">
          <div className="vscratch__head">
            <strong>Probá tu voz</strong>
            <button className="vscratch__x" onClick={() => setOpen(false)} aria-label="Cerrar">
              ✕
            </button>
          </div>

          {!supported ? (
            <p className="vscratch__note">
              Este navegador no reconoce voz. Probá <strong>Chrome</strong> o <strong>Edge</strong>.
            </p>
          ) : state === 'denied' ? (
            <p className="vscratch__note">
              El micrófono está bloqueado. Permitilo desde el candado 🔒 de la barra y recargá.
            </p>
          ) : (
            <>
              <p className="vscratch__hint">Grabá y probá si te sale una palabra o una frase.</p>

              <div className="vscratch__box" aria-live="polite">
                {text || <span className="vscratch__placeholder">Lo que digas aparece acá…</span>}
              </div>

              <div className="vscratch__actions">
                {busy ? (
                  <button className="btn btn--primary" onClick={stop}>
                    ⏹ Detener
                  </button>
                ) : (
                  <button className="btn btn--primary" onClick={record}>
                    🎙 {mine ? 'Grabar otra vez' : 'Grabar'}
                  </button>
                )}
                {mine && !busy && (
                  <button className="btn" onClick={() => void audio.playClip(mine.url)}>
                    ▶ Escuchar mi voz
                  </button>
                )}
              </div>
              {mine && !busy && (
                <p className="vscratch__note">
                  Usá los controles de arriba (⏸ barra ⟲) para pausar, moverte o repetir.
                </p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
