/**
 * VoiceImprov — la pizarra grande de improvisación.
 *
 * Como el "grabar rápido" de la toolbar, pero a pantalla completa y con presencia:
 * hablás libre (un monólogo, una exposición ensayada) y el texto reconocido va
 * apareciendo grande, bajando de renglón solo al llegar al margen. Sirve para
 * soltarse y ver qué se te entiende, sin objetivo ni corrección — pura producción.
 *
 * Reutiliza el reconocedor y el grabador; el corte es la preferencia global.
 */

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useAudio } from '../audio/AudioProvider.tsx';
import { createRecognizer, isRecognitionSupported, type RecognitionState } from '../audio/Recognition.ts';
import { createRecorder, isRecordingSupported, type Recording } from '../audio/Recorder.ts';
import { CORTES, getCorte, setCorte, nextCorte, type Corte } from '../audio/micSettings.ts';
import './voiceimprov.css';

export function VoiceImprov() {
  const audio = useAudio();
  const recognizer = useRef(createRecognizer()).current;
  const recorder = useRef(createRecorder()).current;
  const boxRef = useRef<HTMLDivElement>(null);

  const [open, setOpen] = useState(false);
  const [state, setState] = useState<RecognitionState>(recognizer.getState());
  const [arming, setArming] = useState(false);
  const [text, setText] = useState('');
  const [mine, setMine] = useState<Recording | null>(null);
  const [micError, setMicError] = useState('');
  const [corte, setCorteState] = useState<Corte>(getCorte);

  useEffect(() => recognizer.subscribe(setState), [recognizer]);
  useEffect(
    () => () => {
      recognizer.abort();
      recorder.cancel();
      mine?.revoke();
    },
    [recognizer, recorder, mine]
  );
  // Mantener a la vista el último renglón mientras el texto crece.
  useEffect(() => {
    if (boxRef.current) boxRef.current.scrollTop = boxRef.current.scrollHeight;
  }, [text]);
  // Cortar audio/mic al cerrar.
  useEffect(() => {
    if (!open) {
      recognizer.abort();
      recorder.cancel();
    }
  }, [open, recognizer, recorder]);

  const supported = isRecognitionSupported();
  const busy = state === 'starting' || state === 'listening';
  const live = busy || arming;

  const cycleCorte = () => {
    const n = nextCorte(corte);
    setCorteState(n);
    setCorte(n);
  };

  const record = async () => {
    setText('');
    setMicError('');
    mine?.revoke();
    setMine(null);
    audio.cancel();
    setArming(true);
    if (isRecordingSupported()) {
      try {
        await recorder.start();
      } catch {
        /* sin grabación se transcribe igual */
      }
    }
    try {
      const { transcript } = await recognizer.listen({
        lang: 'en-US',
        continuous: true,
        leadMs: CORTES[corte].lead,
        silenceMs: CORTES[corte].silence,
        onProgress: setText,
      });
      const rec = await recorder.stop();
      setMine(rec);
      setText(transcript);
    } catch {
      setMicError('No se pudo reconocer la voz. En Chrome/Edge el reconocimiento usa internet: revisá la conexión y probá de nuevo.');
      recorder.cancel();
    } finally {
      setArming(false);
    }
  };

  const clear = () => {
    mine?.revoke();
    setMine(null);
    setText('');
    setMicError('');
  };

  return (
    <>
      <button
        className="vimprov__toggle"
        onClick={() => setOpen(true)}
        title="Improvisá en grande"
        aria-label="Improvisá en grande"
      >
        🗣
      </button>

      {open && createPortal(
        <div className="vimprov__overlay" role="dialog" aria-modal="true" aria-label="Improvisá">
          <div className="vimprov__card">
            <div className="vimprov__head">
              <strong>Improvisá</strong>
              <span className="vimprov__sub">Hablá libre. El texto aparece solo.</span>
              <button
                className="vimprov__x"
                onClick={() => setOpen(false)}
                aria-label="Cerrar"
              >
                ✕
              </button>
            </div>

            {!supported ? (
              <p className="vimprov__note">
                Este navegador no reconoce voz. Probá <strong>Chrome</strong> o <strong>Edge</strong>.
              </p>
            ) : state === 'denied' ? (
              <p className="vimprov__note">
                El micrófono está bloqueado. Permitilo desde el candado 🔒 y recargá.
              </p>
            ) : (
              <>
                <div className="vimprov__box" ref={boxRef} aria-live="polite">
                  {text || (
                    <span className="vimprov__placeholder">
                      {live ? 'Hablá… corta solo al terminar' : 'Tocá el micrófono y empezá a hablar.'}
                    </span>
                  )}
                </div>

                {micError && <p className="vimprov__error">{micError}</p>}

                <div className="vimprov__controls">
                  <button
                    className={'vimprov__mic' + (live ? ' vimprov__mic--live' : '')}
                    onClick={() => (live ? recognizer.stop() : void record())}
                  >
                    {live ? '⏹ Detener' : mine || text ? '🎙 Otra vez' : '🎙 Grabar'}
                  </button>
                  {mine && !live && (
                    <button className="btn" onClick={() => void audio.playClip(mine.url)}>
                      ▶ Escucharte
                    </button>
                  )}
                  {(text || mine) && !live && (
                    <button className="btn" onClick={clear}>
                      ✕ Limpiar
                    </button>
                  )}
                  <button
                    className="vimprov__opt"
                    onClick={cycleCorte}
                    title="Cuánto espera antes de cortar solo"
                  >
                    corte: {CORTES[corte].label}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
