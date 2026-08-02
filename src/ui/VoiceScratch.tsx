/**
 * VoiceScratch — el banco de pruebas de voz, siempre a mano en la toolbar.
 *
 * Nada que ver con la corrección de un ejercicio: es para probar en cualquier
 * momento si te sale una palabra o una frase. UN solo click en el micro ya empieza
 * a grabar (el botón se pone rojo); corta solo al detectar silencio, o con otro
 * click. Después ves el texto que entendió y podés escuchar tu voz por el MISMO
 * reproductor del header (playClip → transporte). Reutiliza el reconocedor y el
 * grabador de siempre.
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
  const [arming, setArming] = useState(false);
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
  // 'starting' | 'listening' = grabando de verdad; 'arming' cubre el hueco hasta que
  // el micro arranca, para que el botón se ilumine apenas se toca.
  const busy = state === 'starting' || state === 'listening';
  const live = busy || arming;

  const record = async () => {
    setText('');
    mine?.revoke();
    setMine(null);
    audio.cancel(); // que no pelee con una reproducción anterior
    setArming(true);

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
    } finally {
      setArming(false);
    }
  };

  // El botón ES el disparador: si está grabando, corta; si no, arranca ya mismo.
  const onToggle = () => {
    if (!supported) {
      setOpen(true);
      return;
    }
    if (live) {
      recognizer.stop();
      return;
    }
    setOpen(true);
    void record();
  };

  const close = () => {
    if (live) recognizer.stop();
    setOpen(false);
  };

  return (
    <div className="vscratch">
      <button
        className={'vscratch__toggle' + (live ? ' vscratch__toggle--live' : '')}
        onClick={onToggle}
        title={live ? 'Detener grabación' : 'Probá tu voz'}
        aria-label={live ? 'Detener grabación' : 'Probá tu voz'}
        aria-pressed={live}
      >
        🎙
      </button>

      {open && (
        <div className="vscratch__panel" role="dialog" aria-label="Probá tu voz">
          <div className="vscratch__head">
            <strong>{live ? 'Grabando…' : 'Probá tu voz'}</strong>
            <button className="vscratch__x" onClick={close} aria-label="Cerrar">
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
              <div className="vscratch__box" aria-live="polite">
                {text || (
                  <span className="vscratch__placeholder">
                    {live ? 'Hablá… corta solo al terminar' : 'Tocá el micro y hablá'}
                  </span>
                )}
              </div>

              <div className="vscratch__actions">
                {live ? (
                  <button className="btn" onClick={() => recognizer.stop()}>
                    ⏹ Detener
                  </button>
                ) : (
                  <>
                    {mine && (
                      <button className="btn btn--primary" onClick={() => void audio.playClip(mine.url)}>
                        ▶ Escuchar mi voz
                      </button>
                    )}
                    <button className="btn" onClick={() => void record()}>
                      🎙 {mine ? 'Otra vez' : 'Grabar'}
                    </button>
                  </>
                )}
              </div>
              {mine && !live && (
                <p className="vscratch__note">
                  Con los controles de arriba (⏸ barra ⟲) pausás, te movés o repetís.
                </p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
