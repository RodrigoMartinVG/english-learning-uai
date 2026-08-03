/**
 * VoicePractice — el banco de práctica de una frase, en su propio popup.
 *
 * A diferencia de "grabar rápido" (VoiceScratch, en la toolbar), acá el flujo es:
 *  1. seteás un OBJETIVO que queda fijo,
 *  2. lo podés OÍR (la voz del navegador, vía el pipeline de audio),
 *  3. grabás las veces que quieras contra ese objetivo, viendo el diff y tu % y
 *     pudiendo escuchar cada intento.
 *
 * Tiene más opciones (objetivo, pronunciación, corte, intentos) → merece su propio
 * espacio, y por eso va en un panel y no apretado en la toolbar. Honesto igual que
 * el resto: el ASR dice si te ENTENDIÓ, no puntúa fonemas.
 */

import { useEffect, useRef, useState } from 'react';
import { useAudio } from '../audio/AudioProvider.tsx';
import { createRecognizer, isRecognitionSupported, type RecognitionState } from '../audio/Recognition.ts';
import { createRecorder, isRecordingSupported, type Recording } from '../audio/Recorder.ts';
import { gradeSpeech, grammarHints, type SpeechVerdict } from '../engine/grading/speech.ts';
import { CORTES, getCorte, setCorte, nextCorte, type Corte } from '../audio/micSettings.ts';
import './speak.css'; // clases .w del diff, compartidas
import './voicepractice.css';

const TARGET_KEY = 'oda.practice.target';

export function VoicePractice() {
  const audio = useAudio();
  const recognizer = useRef(createRecognizer()).current;
  const recorder = useRef(createRecorder()).current;

  const [open, setOpen] = useState(false);
  const [state, setState] = useState<RecognitionState>(recognizer.getState());
  const [arming, setArming] = useState(false);
  const [target, setTarget] = useState(() => {
    try {
      return localStorage.getItem(TARGET_KEY) ?? '';
    } catch {
      return '';
    }
  });
  const [corte, setCorteState] = useState<Corte>(getCorte);
  const [interim, setInterim] = useState('');
  const [verdict, setVerdict] = useState<SpeechVerdict | null>(null);
  const [mine, setMine] = useState<Recording | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [best, setBest] = useState(0);
  const [micError, setMicError] = useState('');

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
  const live = busy || arming;
  const hasTarget = target.trim().length > 0;

  const saveTarget = (v: string) => {
    setTarget(v);
    try {
      localStorage.setItem(TARGET_KEY, v);
    } catch {
      /* ignore */
    }
    // Cambiar el objetivo invalida los intentos previos.
    setVerdict(null);
    setAttempts(0);
    setBest(0);
  };

  const cycleCorte = () => {
    const n = nextCorte(corte);
    setCorteState(n);
    setCorte(n);
  };

  // Oír el objetivo con la voz del navegador (no hay mp3 para texto arbitrario:
  // speak() cae al sintetizador con la voz del narrador).
  const hearTarget = () => {
    if (hasTarget) void audio.speak({ key: 'practice.target', text: target.trim(), speakerId: 'narrator' });
  };

  const record = async () => {
    setInterim('');
    setMicError('');
    mine?.revoke();
    setMine(null);
    setVerdict(null);
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
      const { transcript, alternatives } = await recognizer.listen({
        lang: 'en-US',
        hints: hasTarget ? grammarHints([target]) : undefined,
        continuous: true,
        leadMs: CORTES[corte].lead,
        silenceMs: CORTES[corte].silence,
        onInterim: setInterim,
      });
      const rec = await recorder.stop();
      setMine(rec);
      setInterim('');
      // Elegimos, entre las hipótesis del reconocedor, la que mejor matchea el objetivo.
      const goal = target.trim() || transcript;
      const hyps = alternatives.length ? alternatives : [transcript];
      const v = hyps
        .map((h) => gradeSpeech(goal, h))
        .sort((a, b) => Number(b.match) - Number(a.match) || b.accuracy - a.accuracy)[0]!;
      setVerdict(v);
      if (hasTarget) {
        setAttempts((n) => n + 1);
        setBest((b) => Math.max(b, v.accuracy));
      }
    } catch {
      setMicError('No se pudo reconocer la voz. En Chrome/Edge el reconocimiento usa internet: revisá la conexión y probá de nuevo.');
      recorder.cancel();
      setInterim('');
    } finally {
      setArming(false);
    }
  };

  const onMic = () => {
    if (!supported) return;
    if (live) recognizer.stop();
    else void record();
  };

  return (
    <div className="vpractice">
      <button
        className="vpractice__toggle"
        onClick={() => setOpen((v) => !v)}
        title="Banco de práctica"
        aria-label="Banco de práctica"
        aria-expanded={open}
      >
        🎯
      </button>

      {open && (
        <div className="vpractice__panel" role="dialog" aria-label="Banco de práctica">
          <div className="vpractice__head">
            <strong>Practicá una frase</strong>
            <button className="vpractice__x" onClick={() => setOpen(false)} aria-label="Cerrar">
              ✕
            </button>
          </div>

          {!supported ? (
            <p className="vpractice__note">
              Este navegador no reconoce voz. Probá <strong>Chrome</strong> o <strong>Edge</strong>.
            </p>
          ) : state === 'denied' ? (
            <p className="vpractice__note">
              El micrófono está bloqueado. Permitilo desde el candado 🔒 y recargá.
            </p>
          ) : (
            <>
              <div className="vpractice__targetrow">
                <input
                  className="vpractice__target"
                  value={target}
                  onChange={(e) => saveTarget(e.target.value)}
                  placeholder="Escribí la frase a practicar…"
                  aria-label="Frase objetivo"
                  autoComplete="off"
                />
                <button
                  className="btn"
                  onClick={hearTarget}
                  disabled={!hasTarget}
                  title="Oír el objetivo"
                >
                  🔊 Oír
                </button>
              </div>

              <div className="vpractice__controls">
                <button
                  className={'btn btn--primary' + (live ? ' vpractice__rec--live' : '')}
                  onClick={onMic}
                >
                  {live ? '⏹ Detener' : verdict || attempts ? '🎙 Otra vez' : '🎙 Grabar'}
                </button>
                <button
                  className="vpractice__opt"
                  onClick={cycleCorte}
                  title="Cuánto espera antes de cortar la grabación"
                >
                  corte: {CORTES[corte].label}
                </button>
              </div>

              {live && (
                <p className="vpractice__interim" aria-live="polite">
                  {interim || 'Hablá… corta solo al terminar'}
                </p>
              )}
              {micError && !live && <p className="speak__error">{micError}</p>}

              {verdict && !live && (
                <div className="vpractice__result">
                  {hasTarget && (
                    <p className={'verdict ' + (verdict.match ? 'verdict--ok' : 'verdict--bad')}>
                      {verdict.match ? 'Te entendió' : `${Math.round(verdict.accuracy * 100)}% cerca`}
                    </p>
                  )}
                  <p className="speak__diff">
                    {verdict.words.map((w, i) => (
                      <span key={i} className={'w w--' + w.status} title={w.heard ? `oí: ${w.heard}` : undefined}>
                        {w.word}
                      </span>
                    ))}
                  </p>
                  <p className="vpractice__heard">Se oyó: “{verdict.transcript || '—'}”</p>
                  <div className="vpractice__ab">
                    {mine && (
                      <button className="btn" onClick={() => void audio.playClip(mine.url)}>
                        🎤 Escucharte
                      </button>
                    )}
                    {hasTarget && (
                      <button className="btn" onClick={hearTarget}>
                        🔊 El objetivo
                      </button>
                    )}
                  </div>
                </div>
              )}

              {hasTarget && attempts > 0 && (
                <p className="vpractice__stats">
                  {attempts} {attempts === 1 ? 'intento' : 'intentos'} · mejor {Math.round(best * 100)}%
                </p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
