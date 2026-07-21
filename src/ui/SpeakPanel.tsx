/**
 * SpeakPanel — el micrófono, compartido por Shadowing y Ping-Pong.
 *
 * Las tres señales honestas de ARQUITECTURA.md §6.4:
 *  1. diff por palabra (qué palabra falló, no un porcentaje inventado)
 *  2. grammar hints (mejora el reconocimiento)
 *  3. cotejo A/B (tu voz contra la referencia — el mejor juez de prosodia que hay)
 *
 * Lo que NO hace: puntuar pronunciación. La API no lo permite y fingirlo
 * entrenaría mal al alumno.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  createRecognizer,
  isRecognitionSupported,
  type RecognitionState,
} from '../audio/Recognition.ts';
import { createRecorder, isRecordingSupported, type Recording } from '../audio/Recorder.ts';
import { useAudio } from '../audio/AudioProvider.tsx';
import { gradeSpeech, grammarHints, type SpeechVerdict } from '../engine/grading/speech.ts';
import './speak.css';

export interface SpeakPanelProps {
  /** Lo que hay que decir. En Ping-Pong hay varias respuestas válidas. */
  targets: string[];
  /** Léxico esperado, para los hints del ASR. */
  neighbourhood: string[];
  lang: string;
  /** Reproduce la referencia, para el A/B. */
  onPlayReference: () => void;
  onDone: (correct: boolean) => void;
}

export function SpeakPanel({ targets, neighbourhood, lang, onPlayReference, onDone }: SpeakPanelProps) {
  const recognizer = useRef(createRecognizer()).current;
  const recorder = useRef(createRecorder()).current;
  const audio = useAudio();

  const [state, setState] = useState<RecognitionState>(recognizer.getState());
  const [interim, setInterim] = useState('');
  const [verdict, setVerdict] = useState<SpeechVerdict | null>(null);
  const [mine, setMine] = useState<Recording | null>(null);
  // "Dar por bueno": el ASR transcribe, no juzga pronunciación. Si una palabra
  // rara no quedó bien detectada pero el alumno la dijo bien, puede darla por
  // buena y que cuente como correcta. Es honesto con lo que la API sí puede hacer.
  const [accepted, setAccepted] = useState(false);

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

  const listen = useCallback(async () => {
    setVerdict(null);
    setInterim('');
    setAccepted(false);
    mine?.revoke();
    setMine(null);

    // Grabar en paralelo al ASR: la transcripción dice QUÉ dijiste, la grabación
    // te deja oír CÓMO lo dijiste. Son dos preguntas distintas.
    if (isRecordingSupported()) {
      try {
        await recorder.start();
      } catch {
        /* sin grabación se puede seguir: solo se pierde el A/B */
      }
    }

    try {
      const { transcript } = await recognizer.listen({
        lang,
        hints: grammarHints(neighbourhood),
        // continuous + tiempos holgados: el navegador ya no corta en la primera
        // pausa. leadMs da tiempo a arrancar; silenceMs perdona una pausa para
        // pensar la palabra siguiente antes de cerrar la toma.
        continuous: true,
        leadMs: 8000,
        silenceMs: 3000,
        onInterim: setInterim,
      });
      const rec = await recorder.stop();
      setMine(rec);
      setInterim('');

      // Con varios objetivos válidos gana el mejor: en Ping-Pong no hay UNA
      // respuesta correcta a "Where are you from?".
      const best = targets
        .map((t) => gradeSpeech(t, transcript))
        .sort((a, b) => Number(b.match) - Number(a.match) || b.accuracy - a.accuracy)[0]!;
      setVerdict(best);
    } catch {
      recorder.cancel();
      setInterim('');
    }
  }, [lang, neighbourhood, targets, recognizer, recorder, mine]);

  if (!supported) {
    return (
      <div className="speak speak--blocked">
        <p>
          Este navegador no reconoce voz. Probá <strong>Chrome</strong> o <strong>Edge</strong>.
        </p>
        <button className="btn btn--wide" onClick={() => onDone(false)}>
          Saltear y seguir
        </button>
      </div>
    );
  }

  if (state === 'denied') {
    return (
      <div className="speak speak--blocked">
        <p>
          El micrófono está bloqueado. Tocá el candado 🔒 en la barra de direcciones, permití el
          micrófono y recargá.
        </p>
        <button className="btn btn--wide" onClick={() => onDone(false)}>
          Saltear y seguir
        </button>
      </div>
    );
  }

  const busy = state === 'starting' || state === 'listening';

  return (
    <div className="speak">
      {!verdict && (
        <>
          <button
            className={'mic' + (state === 'listening' ? ' mic--live' : '')}
            onClick={listen}
            disabled={busy}
            aria-label="Grabar tu voz"
          >
            <span className="mic__icon" aria-hidden="true">
              🎙
            </span>
            <span className="mic__label">
              {state === 'starting' ? 'Iniciando…' : state === 'listening' ? 'Te escucho…' : 'Hablá'}
            </span>
          </button>
          <p className="speak__interim" aria-live="polite">
            {interim || (state === 'listening' ? '…' : 'Tocá el micrófono y decilo en voz alta')}
          </p>
        </>
      )}

      {verdict && (
        <div className="expansion">
          <p className={'verdict ' + (verdict.match || accepted ? 'verdict--ok' : 'verdict--bad')}>
            {verdict.match
              ? 'Dijiste lo correcto'
              : accepted
                ? 'Dada por buena ✓'
                : 'No es lo que había que decir'}
          </p>

          <p className="speak__diff">
            {verdict.words.map((w, i) => (
              <span key={i} className={'w w--' + w.status} title={w.heard ? `oí: ${w.heard}` : undefined}>
                {w.word}
              </span>
            ))}
          </p>
          <p className="speak__heard">Se oyó: “{verdict.transcript || '—'}”</p>

          {/* El cotejo A/B: la única evaluación real de prosodia que tenemos. */}
          {mine && (
            <section className="expansion__group">
              <h3>Compará: tu voz contra la referencia</h3>
              <div className="ab">
                <button className="btn" onClick={onPlayReference}>
                  🔊 Referencia
                </button>
                <button className="btn" onClick={() => void audio.playClip(mine.url)}>
                  🎤 Vos
                </button>
              </div>
              <p className="speak__note">
                La app no puntúa pronunciación: ningún navegador puede. Tu oído sí.
              </p>
            </section>
          )}

          {!verdict.match && !accepted && (
            <button
              className="speak__accept"
              onClick={() => setAccepted(true)}
              title="El reconocedor transcribe, no puntúa pronunciación. Si la dijiste bien, contala como correcta."
            >
              ✓ La dije bien — el micro no la tomó
            </button>
          )}

          <div className="ab">
            <button className="btn" onClick={listen}>
              Reintentar
            </button>
            <button
              className="btn btn--primary"
              onClick={() => onDone(verdict.match || accepted)}
              autoFocus
            >
              Siguiente →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
