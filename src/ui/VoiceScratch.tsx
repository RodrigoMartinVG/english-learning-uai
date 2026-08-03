/**
 * VoiceScratch — el banco de pruebas de voz, en la toolbar y sin popup.
 *
 * Para probar en cualquier momento si te sale una palabra o una frase. UN click en
 * el micro empieza a grabar (el botón se pone rojo); el texto reconocido se va
 * escribiendo EN LA MISMA toolbar, al lado del botón. Corta solo por silencio o con
 * otro click. Después, ▶ reproduce tu voz por el MISMO reproductor del header.
 *
 * Dos extras sin romper el minimalismo (idle = solo el micro):
 *  · Objetivo (🎯): post-grabación, escribís lo que querías lograr y se marca el diff
 *    palabra por palabra contra lo que se transcribió — no hay que configurar antes.
 *  · Corte: cuánto espera antes de cerrar la toma, en un cyclador de texto tenue.
 */

import { useEffect, useRef, useState } from 'react';
import { useAudio } from '../audio/AudioProvider.tsx';
import { createRecognizer, isRecognitionSupported, type RecognitionState } from '../audio/Recognition.ts';
import { createRecorder, isRecordingSupported, type Recording } from '../audio/Recorder.ts';
import { gradeSpeech } from '../engine/grading/speech.ts';
import './speak.css'; // clases .w / .w--ok… del diff, compartidas con SpeakPanel
import './voicescratch.css';

/** Cuánto espera el micro antes de cortar. Persiste; default "normal" (lo de antes). */
type Corte = 'rapido' | 'normal' | 'paciente';
const CORTES: Record<Corte, { lead: number; silence: number; label: string }> = {
  rapido: { lead: 5000, silence: 1500, label: 'rápido' },
  normal: { lead: 8000, silence: 3000, label: 'normal' },
  paciente: { lead: 12000, silence: 5000, label: 'paciente' },
};
const CORTE_ORDER: Corte[] = ['rapido', 'normal', 'paciente'];
const CORTE_KEY = 'oda.vscratch.corte';

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
  const [showTarget, setShowTarget] = useState(false);
  const [target, setTarget] = useState('');
  const [corte, setCorte] = useState<Corte>(() => {
    try {
      const v = localStorage.getItem(CORTE_KEY) as Corte | null;
      return v && v in CORTES ? v : 'normal';
    } catch {
      return 'normal';
    }
  });

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
        leadMs: CORTES[corte].lead,
        silenceMs: CORTES[corte].silence,
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
    setTarget('');
    setShowTarget(false);
    setAttempted(false);
  };

  const cycleCorte = () => {
    const next = CORTE_ORDER[(CORTE_ORDER.indexOf(corte) + 1) % CORTE_ORDER.length]!;
    setCorte(next);
    try {
      localStorage.setItem(CORTE_KEY, next);
    } catch {
      /* ignore */
    }
  };

  const note = !supported
    ? 'Este navegador no reconoce voz (probá Chrome o Edge)'
    : state === 'denied'
      ? 'Micrófono bloqueado: permitilo 🔒 y recargá'
      : '';
  const showStrip = live || !!text || !!mine || (attempted && !!note);
  // Diff solo cuando hay objetivo y ya se transcribió (post-grabación).
  const diff = !live && target.trim() && text.trim() ? gradeSpeech(target, text) : null;

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

      {showStrip && (
        <div className="vscratch__strip">
          {showTarget && !live && (
            <input
              className="vscratch__target"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              placeholder="objetivo…"
              aria-label="Objetivo a comparar"
              autoComplete="off"
              autoCapitalize="off"
              spellCheck={false}
            />
          )}

          {attempted && note ? (
            <span className="vscratch__note">{note}</span>
          ) : diff ? (
            // Objetivo vs. lo que se oyó, palabra por palabra.
            <span className="vscratch__text vscratch__diff" title={`se oyó: ${text}`}>
              {diff.words.map((w, i) => (
                <span key={i} className={'w w--' + w.status}>
                  {w.word}
                </span>
              ))}
            </span>
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

          {!live && (
            <button
              className={'vscratch__mini' + (showTarget ? ' vscratch__mini--on' : '')}
              onClick={() => setShowTarget((v) => !v)}
              title="Comparar con un objetivo"
              aria-label="Comparar con un objetivo"
              aria-pressed={showTarget}
            >
              🎯
            </button>
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
          {!live && (text || mine || target || (attempted && note)) && (
            <button className="vscratch__mini" onClick={clear} title="Borrar" aria-label="Borrar">
              ✕
            </button>
          )}
          {!live && (
            <button
              className="vscratch__opt"
              onClick={cycleCorte}
              title="Cuánto espera antes de cortar la grabación"
            >
              corte: {CORTES[corte].label}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
