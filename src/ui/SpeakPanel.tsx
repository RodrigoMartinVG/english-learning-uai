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
import { CORTES, getCorte, setCorte, nextCorte, type Corte } from '../audio/micSettings.ts';
import './speak.css';

export interface SpeakPanelProps {
  /** Lo que hay que decir. En Ping-Pong hay varias respuestas válidas. */
  targets: string[];
  /** Léxico esperado, para los hints del ASR. */
  neighbourhood: string[];
  lang: string;
  /** Reproduce la referencia, para el A/B. */
  onPlayReference: () => void;
  /**
   * Se avanza con el resultado. El 2º argumento entrega la GRABACIÓN del alumno para
   * que quien la use pueda reproducirla después (p. ej. "escucharte" en Armá el
   * guion). Al entregarla, SpeakPanel deja de ser su dueño: no la revoca. Quien la
   * recibe se hace cargo de revocarla.
   */
  onDone: (correct: boolean, recording?: Recording | null) => void;
}

export function SpeakPanel({ targets, neighbourhood, lang, onPlayReference, onDone }: SpeakPanelProps) {
  const recognizer = useRef(createRecognizer()).current;
  const recorder = useRef(createRecorder()).current;
  const audio = useAudio();

  const [state, setState] = useState<RecognitionState>(recognizer.getState());
  const [interim, setInterim] = useState('');
  const [verdict, setVerdict] = useState<SpeechVerdict | null>(null);
  const [mine, setMine] = useState<Recording | null>(null);
  // Las hipótesis del reconocedor (ordenadas por su ranking) y cuál elegimos por
  // ser la que mejor matchea el objetivo. Sirve de feedback: si tu forma correcta
  // no quedó 1ª, con mejor pronunciación puede trepar.
  const [alts, setAlts] = useState<string[]>([]);
  const [chosenIdx, setChosenIdx] = useState(0);
  // El reconocimiento falló (no fue cancelación ni permiso): se muestra en vez de
  // cancelar en silencio, que parecía "no grabó nada". El caso típico: sin internet
  // (en Chrome/Edge el reconocimiento es en la nube).
  const [micError, setMicError] = useState('');
  // "Dar por bueno": el ASR transcribe, no juzga pronunciación. Si una palabra
  // rara no quedó bien detectada pero el alumno la dijo bien, puede darla por
  // buena y que cuente como correcta. Es honesto con lo que la API sí puede hacer.
  const [accepted, setAccepted] = useState(false);
  // El alumno canceló la toma: la promesa de listen() igual resuelve, pero no hay
  // que calificar nada — se vuelve al micro para reintentar.
  const canceled = useRef(false);
  // La grabación se entregó al padre (onDone): no revocarla al desmontar.
  const handedOff = useRef(false);
  // Cuánto espera el micro antes de cortar solo. Preferencia global (compartida
  // con el Banco de práctica), configurable acá mismo antes de grabar.
  const [corte, setCorteState] = useState<Corte>(getCorte);
  const cycleCorte = () => {
    const n = nextCorte(corte);
    setCorteState(n);
    setCorte(n);
  };

  useEffect(() => recognizer.subscribe(setState), [recognizer]);
  useEffect(
    () => () => {
      recognizer.abort();
      recorder.cancel();
      if (!handedOff.current) mine?.revoke();
    },
    [recognizer, recorder, mine]
  );

  const supported = isRecognitionSupported();

  const listen = useCallback(async () => {
    setVerdict(null);
    setInterim('');
    setAccepted(false);
    setAlts([]);
    setChosenIdx(0);
    setMicError('');
    canceled.current = false;
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
      const { transcript, alternatives } = await recognizer.listen({
        lang,
        hints: grammarHints(neighbourhood),
        // continuous + tiempos holgados: el navegador ya no corta en la primera
        // pausa. leadMs da tiempo a arrancar; silenceMs perdona una pausa para
        // pensar la palabra siguiente antes de cerrar la toma.
        continuous: true,
        leadMs: CORTES[corte].lead,
        silenceMs: CORTES[corte].silence,
        onInterim: setInterim,
      });
      // Cancelado a mano: no calificar, volver al micro para reintentar.
      if (canceled.current) {
        recorder.cancel();
        setInterim('');
        return;
      }
      const rec = await recorder.stop();
      setMine(rec);
      setInterim('');

      // Elegimos, entre las hipótesis del reconocedor (rankeadas), la que mejor
      // matchea algún objetivo. Así una pronunciación válida que el motor dejó 2ª no
      // se pierde. `chosen` (su ranking) es la señal: si no quedó 1ª, hay que afinar.
      // Con varios objetivos válidos gana el mejor (en Ping-Pong no hay UNA respuesta).
      const hyps = alternatives.length ? alternatives : [transcript];
      const gradeOf = (text: string) =>
        targets
          .map((t) => gradeSpeech(t, text))
          .sort((a, b) => Number(b.match) - Number(a.match) || b.accuracy - a.accuracy)[0]!;
      let chosen = 0;
      let chosenV = gradeOf(hyps[0]!);
      for (let i = 1; i < hyps.length; i++) {
        const v = gradeOf(hyps[i]!);
        if (Number(v.match) - Number(chosenV.match) > 0 || (v.match === chosenV.match && v.accuracy > chosenV.accuracy)) {
          chosenV = v;
          chosen = i;
        }
      }
      setAlts(hyps);
      setChosenIdx(chosen);
      setVerdict(chosenV);
    } catch {
      // No fue cancelación del usuario: hubo un error real (típico: sin internet).
      if (!canceled.current)
        setMicError(
          'No se pudo reconocer la voz. En Chrome/Edge el reconocimiento usa internet: revisá la conexión y probá de nuevo.'
        );
      recorder.cancel();
      setInterim('');
    }
  }, [lang, neighbourhood, targets, recognizer, recorder, mine, corte]);

  // Terminar a mano: cierra la toma y califica lo dicho hasta ahí (no espera el
  // auto-corte por silencio, que a veces tarda).
  const finishNow = () => recognizer.stop();
  // Cancelar: descarta la toma y vuelve al micro, sin calificar.
  const cancelNow = () => {
    canceled.current = true;
    recognizer.abort();
    recorder.cancel();
    setInterim('');
    setVerdict(null);
  };

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
          {micError && <p className="speak__error">{micError}</p>}
          {!busy && (
            // Cuánto espera antes de cortar solo. Preferencia global; se toca antes de grabar.
            <button
              className="speak__corte"
              onClick={cycleCorte}
              title="Cuánto espera el micrófono antes de cortar solo"
            >
              corte: {CORTES[corte].label}
            </button>
          )}
          {busy && (
            // Cortar a mano: terminar ya (y calificar) o cancelar (descartar y
            // reintentar), sin esperar el auto-corte por silencio. Sutiles: no compiten
            // con el micrófono, solo están ahí si los necesitás.
            <div className="speak__live">
              <button className="speak__livebtn" onClick={finishNow}>
                ⏹ Terminar
              </button>
              <button className="speak__livebtn" onClick={cancelNow}>
                ✕ Cancelar
              </button>
            </div>
          )}
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

          {/* La señal honesta del ranking: si tu forma correcta no quedó 1ª, el micro
              te entendió pero dudó — con mejor pronunciación puede trepar al 1º. */}
          {alts.length > 1 && chosenIdx > 0 && (
            <p className="speak__climb">
              El micro puso 1º a “{alts[0]}”. Tu forma quedó {chosenIdx + 1}ª — afiná la
              pronunciación para que suba al 1º.
            </p>
          )}
          {alts.length > 1 && (
            <details className="speak__alts">
              <summary>Ver las {alts.length} opciones que escuchó</summary>
              <ol>
                {alts.map((a, i) => (
                  <li key={i} className={i === chosenIdx ? 'speak__alts--chosen' : ''}>
                    {a}
                    {i === chosenIdx ? ' ✓' : ''}
                  </li>
                ))}
              </ol>
            </details>
          )}

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
              onClick={() => {
                handedOff.current = true; // el padre se hace cargo de la grabación
                onDone(verdict.match || accepted, mine);
              }}
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
