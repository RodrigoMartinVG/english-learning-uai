/**
 * ScriptBuilderView — armar el guion, de dos maneras (mismas preguntas guía):
 *
 *  · Reconstruir → recuperás el modelo (revelar, o decir por voz). Andamiaje.
 *  · Crear el tuyo → producís el tuyo con transcripción en vivo (vocabulario del
 *    tema en verde) y te podés escuchar. Producción libre guiada. Ver
 *    PLAN-crea-tu-guion.md.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAudio } from '../../audio/AudioProvider.tsx';
import { SpeakPanel } from '../../ui/SpeakPanel.tsx';
import { LiveDictation, Highlighted, type DictationResult } from '../../ui/LiveDictation.tsx';
import { stepQuestionKey, stepSegmentKey } from '../../../content/schema.ts';
import { expectedWords } from './mechanic.ts';
import type { MechanicViewProps } from '../types.ts';
import type { ScriptBuilderRound } from './mechanic.ts';
import './script-builder.css';

type Flow = 'reconstruct' | 'create' | 'dictate';
type Phase = 'brief' | 'run' | 'report';

export function ScriptBuilderView({ round, onDone }: MechanicViewProps<ScriptBuilderRound>) {
  const { target } = round;
  const steps = target.steps ?? [];
  const audio = useAudio();
  const expected = useMemo(() => expectedWords(target), [target]);

  const [phase, setPhase] = useState<Phase>('brief');
  const [flow, setFlow] = useState<Flow>('reconstruct');
  const [exam, setExam] = useState(false); // sub-modo de reconstruir
  const [idx, setIdx] = useState(0);
  const [revealed, setRevealed] = useState(false); // reconstruir
  const [built, setBuilt] = useState<string[]>([]); // reconstruir: fragmentos modelo
  const [mine, setMine] = useState<DictationResult[]>([]); // crear: tus respuestas

  // Grabaciones a revocar al desmontar (solo viven durante la sesión).
  const recs = useRef<DictationResult[]>([]);
  useEffect(() => () => recs.current.forEach((r) => r.recording?.revoke()), []);

  const step = steps[idx];

  const askQuestion = useCallback(() => {
    if (!step) return;
    void audio.speak({ key: stepQuestionKey(target.id, idx), text: step.prompt, speakerId: 'narrator' });
  }, [audio, target.id, idx, step]);

  useEffect(() => {
    if (phase !== 'run') return;
    setRevealed(false);
    askQuestion();
    return () => audio.cancel();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, idx]);

  const playSegment = () =>
    step && void audio.speak({ key: stepSegmentKey(target.id, idx), text: step.segment, speakerId: target.speaker });

  const start = (f: Flow) => {
    setFlow(f);
    setIdx(0);
    setBuilt([]);
    setMine([]);
    setPhase('run');
  };
  const reset = () => {
    setIdx(0);
    setBuilt([]);
    setMine([]);
    setRevealed(false);
    setPhase('brief');
  };

  // reconstruir
  const reveal = () => {
    setRevealed(true);
    playSegment();
  };
  const nextReconstruct = () => {
    if (!step) return;
    setBuilt([...built, step.segment]);
    if (idx + 1 < steps.length) setIdx(idx + 1);
    else setPhase('report');
  };

  // crear
  const onDictated = (r: DictationResult) => {
    recs.current.push(r);
    setMine((prev) => [...prev, r]);
    if (idx + 1 < steps.length) setIdx(idx + 1);
    else setPhase('report');
  };
  // Dictado libre: una sola toma con todo.
  const onDictateWhole = (r: DictationResult) => {
    recs.current.push(r);
    setMine([r]);
    setPhase('report');
  };
  const outline = target.scaffold ?? steps.map((s) => s.prompt);
  const playMine = async () => {
    const urls = mine.map((m) => m.recording?.url).filter((u): u is string => Boolean(u));
    // Por el canal único del servicio: si lo cortan (Parar / navegar), playClip
    // devuelve 'interrupted' y frenamos la secuencia.
    for (const url of urls) {
      if ((await audio.playClip(url)) === 'interrupted') break;
    }
  };

  /* ─────────────────────────────── brief ──────────────────────────────── */
  if (phase === 'brief') {
    return (
      <div className="build">
        <p className="build__eyebrow">Armá el guion</p>
        <h2>Tres maneras de armarlo</h2>
        <p className="build__note">
          Las mismas preguntas guía, tres caminos: reconstruir el modelo, crear el tuyo, o dictarlo
          entero.
        </p>

        <div className="build__choice">
          <button className="btn btn--primary btn--wide" onClick={() => start('reconstruct')}>
            Reconstruir el modelo →
          </button>
          <p className="build__choice-note">Recuperás el guion modelo pedazo a pedazo.</p>
          <label className="build__toggle">
            <input type="checkbox" checked={exam} onChange={(e) => setExam(e.target.checked)} />
            <span>
              Modo examen: decir cada parte en voz alta. <em>Sin esto, solo revelás el modelo.</em>
            </span>
          </label>
        </div>

        <div className="build__choice">
          <button className="btn btn--wide" onClick={() => start('create')}>
            Crear tu propio guion →
          </button>
          <p className="build__choice-note">
            Paso a paso: respondés cada pregunta guía. Se transcribe <strong>en vivo</strong> (el
            vocabulario del tema en verde) y podés escucharte.
          </p>
        </div>

        <div className="build__choice">
          <button className="btn btn--wide" onClick={() => start('dictate')}>
            Dictado libre →
          </button>
          <p className="build__choice-note">
            Lo decís <strong>todo de corrido</strong>, con la guía a la vista. El mayor desafío: tu
            exposición entera, transcripta en vivo.
          </p>
        </div>
      </div>
    );
  }

  /* ─────────────────────────── run · dictado libre ─────────────────────── */
  if (phase === 'run' && flow === 'dictate') {
    return (
      <div className="build">
        <p className="build__eyebrow">Dictado libre</p>
        <h2>Decilo todo de corrido</h2>
        {outline.length > 0 && (
          <div className="build__outline">
            <p className="build__soFar-label">Guía para apoyarte</p>
            <ol>
              {outline.map((o) => (
                <li key={o}>{o}</li>
              ))}
            </ol>
          </div>
        )}
        <LiveDictation expected={expected} lang="en-US" onDone={onDictateWhole} />
      </div>
    );
  }

  /* ─────────────────────────────── run ────────────────────────────────── */
  if (phase === 'run' && step) {
    return (
      <div className="build">
        <div className="build__progress">
          <span>Paso {idx + 1} de {steps.length}</span>
          <div className="build__bar">
            <span style={{ width: `${(idx / steps.length) * 100}%` }} />
          </div>
        </div>

        <div className="build__q">
          <button className="build__play" onClick={askQuestion} aria-label="Repetir la pregunta">🔊</button>
          <p>{step.prompt}</p>
        </div>
        {step.hint && (flow === 'reconstruct' ? !revealed : true) && (
          <p className="build__hint">Pista: {step.hint}</p>
        )}

        {flow === 'reconstruct' ? (
          !revealed ? (
            exam ? (
              <SpeakPanel
                targets={[step.segment]}
                neighbourhood={steps.map((s) => s.segment)}
                lang="en-US"
                onPlayReference={playSegment}
                onDone={() => setRevealed(true)}
              />
            ) : (
              <button className="btn btn--primary btn--wide" onClick={reveal}>Revelar esta parte →</button>
            )
          ) : (
            <div className="build__revealed">
              <div className="build__seg">
                <button className="build__play" onClick={playSegment} aria-label="Escuchar la parte">🔊</button>
                <p>{step.segment}</p>
              </div>
              <button className="btn btn--primary btn--wide" onClick={nextReconstruct} autoFocus>
                {idx + 1 < steps.length ? 'Siguiente pregunta →' : 'Ver el guion completo →'}
              </button>
            </div>
          )
        ) : (
          <>
            <LiveDictation key={idx} expected={expected} lang="en-US" onDone={onDictated} />
            {mine.length > 0 && (
              <div className="build__soFar">
                <p className="build__soFar-label">Tu guion hasta acá</p>
                <p className="build__script">
                  <Highlighted text={mine.map((m) => m.transcript).join(' ')} expected={expected} />
                </p>
              </div>
            )}
          </>
        )}

        {flow === 'reconstruct' && built.length > 0 && (
          <div className="build__soFar">
            <p className="build__soFar-label">El guion hasta acá</p>
            <p className="build__script">{built.join(' ')}</p>
          </div>
        )}
      </div>
    );
  }

  /* ────────────────────────────── report ──────────────────────────────── */
  if (flow !== 'reconstruct') {
    const yours = mine.map((m) => m.transcript).join(' ').trim();
    const anyRec = mine.some((m) => m.recording);
    return (
      <div className="build">
        <p className="build__eyebrow">Tu guion</p>
        <h2>Lo creaste vos</h2>

        <section className="build__block">
          <div className="build__block-head">
            <h3>Tu producción</h3>
            {anyRec && <button className="btn" onClick={playMine}>🔊 Escucharte entero</button>}
          </div>
          <p className="build__script">
            {yours ? <Highlighted text={yours} expected={expected} /> : '— no se transcribió nada —'}
          </p>
          <p className="build__hint">En verde, el vocabulario del tema que usaste.</p>
        </section>

        <section className="build__block">
          <div className="build__block-head">
            <h3>Versión modelo (para comparar)</h3>
            <button className="btn" onClick={() => void audio.speak({ key: `${target.id}.model`, text: target.modelAnswer, speakerId: target.speaker })}>
              🔊 Escuchar
            </button>
          </div>
          <p className="build__script build__script--model">{target.modelAnswer}</p>
        </section>

        <div className="ab">
          <button className="btn" onClick={reset}>Volver a empezar</button>
          <button className="btn btn--primary" onClick={() => onDone(true)} autoFocus>Terminar →</button>
        </div>
      </div>
    );
  }

  // report reconstruir
  const yours = built.join(' ');
  return (
    <div className="build">
      <p className="build__eyebrow">Guion reconstruido</p>
      <h2>Lo armaste entero</h2>

      <section className="build__block">
        <div className="build__block-head">
          <h3>Lo que reconstruiste</h3>
          <button className="btn" onClick={() => void audio.speak({ key: 'sb-yours', text: yours, speakerId: target.speaker })}>🔊 Escuchar</button>
        </div>
        <p className="build__script">{yours}</p>
      </section>

      <section className="build__block">
        <div className="build__block-head">
          <h3>Versión modelo</h3>
          <button className="btn" onClick={() => void audio.speak({ key: `${target.id}.model`, text: target.modelAnswer, speakerId: target.speaker })}>🔊 Escuchar</button>
        </div>
        <p className="build__script build__script--model">{target.modelAnswer}</p>
      </section>

      <div className="ab">
        <button className="btn" onClick={reset}>Reconstruir de nuevo</button>
        <button className="btn btn--primary" onClick={() => onDone(true)} autoFocus>Terminar →</button>
      </div>
    </div>
  );
}
