/**
 * ScriptBuilderView — armar el guion, de tres maneras (elegís la versión A/B/C):
 *
 *  · Copiar el modelo (sombra) → oís cada frase y la repetís. Copia guiada, frase
 *    por frase. Funciona para cualquier versión (A por sus `steps`; B/C partiendo
 *    la variante en oraciones, con audio propio por frase).
 *  · Reconstruir de memoria → recordás cada parte y después revelás. Con las
 *    preguntas guía en la Versión A; en B/C, parte por parte.
 *  · Crear el tuyo → tu versión con transcripción en vivo (paso a paso o de corrido).
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAudio } from '../../audio/AudioProvider.tsx';
import { SpeakPanel } from '../../ui/SpeakPanel.tsx';
import type { Recording } from '../../audio/Recorder.ts';
import { LiveDictation, Highlighted, type DictationResult } from '../../ui/LiveDictation.tsx';
import { stepSegmentKey, stepQuestionKey, modelVarSentenceKey } from '../../../content/schema.ts';
import { splitSentences } from '../../../content/sentences.ts';
import { expectedWords } from './mechanic.ts';
import type { MechanicViewProps } from '../types.ts';
import type { ScriptBuilderRound } from './mechanic.ts';
import './script-builder.css';

type Flow = 'copy' | 'reconstruct' | 'create';
type Phase = 'brief' | 'run' | 'report';

interface Chunk {
  text: string;
  audioKey: string;
  /** La pregunta guía (solo la Versión A la tiene). */
  prompt?: string;
}

export function ScriptBuilderView({ round, onDone }: MechanicViewProps<ScriptBuilderRound>) {
  const { target } = round;
  const steps = target.steps ?? [];
  const variants = useMemo(() => target.modelVariants ?? [], [target]);
  const audio = useAudio();
  const expected = useMemo(() => expectedWords(target), [target]);

  const [phase, setPhase] = useState<Phase>('brief');
  const [flow, setFlow] = useState<Flow>('copy');
  const [version, setVersion] = useState(0); // 0 = A (modelAnswer); k = modelVariants[k-1]
  const [exam, setExam] = useState(false); // sub-modo de reconstruir
  const [whole, setWhole] = useState(false); // sub-modo de crear: todo de corrido
  const [idx, setIdx] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [built, setBuilt] = useState<string[]>([]); // copiar/reconstruir: fragmentos del modelo
  const [mine, setMine] = useState<DictationResult[]>([]); // crear: tus respuestas

  const recs = useRef<DictationResult[]>([]);
  // Copiar/Reconstruir(examen): las grabaciones tuyas de cada frase, para poder
  // escuchar TU versión (no la del modelo) en el resumen.
  const clipRecs = useRef<Recording[]>([]);
  const [clipCount, setClipCount] = useState(0);
  const addClip = (rec?: Recording | null) => {
    if (!rec) return;
    clipRecs.current.push(rec);
    setClipCount((c) => c + 1);
  };
  const clearClips = () => {
    clipRecs.current.forEach((r) => r.revoke());
    clipRecs.current = [];
    setClipCount(0);
  };
  useEffect(
    () => () => {
      recs.current.forEach((r) => r.recording?.revoke());
      clipRecs.current.forEach((r) => r.revoke());
    },
    []
  );

  const versionCount = 1 + variants.length;
  const versionLabel = (v: number) => (v === 0 ? 'Versión A' : `Versión ${String.fromCharCode(65 + v)}`);
  const versionText = (v: number) => (v === 0 ? target.modelAnswer : variants[v - 1]!);
  const versionWholeKey = (v: number) => (v === 0 ? `${target.id}.model` : `${target.id}.modelvar.${v - 1}`);

  // Los "chunks" (frases) de la versión elegida, para copiar/reconstruir.
  const chunks = useMemo<Chunk[]>(() => {
    if (version === 0) {
      return steps.map((s, i) => ({
        text: s.segment,
        audioKey: stepSegmentKey(target.id, i),
        prompt: s.prompt,
      }));
    }
    return splitSentences(variants[version - 1]!).map((sent, m) => ({
      text: sent,
      audioKey: modelVarSentenceKey(target.id, version - 1, m),
    }));
  }, [version, steps, variants, target.id]);

  const chunk = chunks[idx];
  const step = steps[idx]; // crear se guía siempre por las preguntas de la A

  const playChunk = useCallback(() => {
    if (chunk) void audio.speak({ key: chunk.audioKey, text: chunk.text, speakerId: target.speaker });
  }, [audio, chunk, target.speaker]);

  const askQuestion = useCallback(() => {
    const s = steps[idx];
    if (s) void audio.speak({ key: stepQuestionKey(target.id, idx), text: s.prompt, speakerId: 'narrator' });
  }, [audio, steps, idx, target.id]);

  // Al entrar a cada paso: en Copiar suena la frase; en Reconstruir/Crear, la pregunta.
  useEffect(() => {
    if (phase !== 'run') return;
    setRevealed(false);
    if (flow === 'copy') playChunk();
    else if (flow === 'create' && !whole) askQuestion();
    else if (flow === 'reconstruct' && chunk?.prompt) askQuestion();
    return () => audio.cancel();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, idx, flow]);

  const start = (f: Flow) => {
    setFlow(f);
    setIdx(0);
    setBuilt([]);
    setMine([]);
    setRevealed(false);
    setPhase('run');
  };
  const reset = () => {
    setIdx(0);
    setBuilt([]);
    setMine([]);
    clearClips();
    setRevealed(false);
    setPhase('brief');
  };

  const advance = () => {
    if (idx + 1 < chunks.length) setIdx(idx + 1);
    else setPhase('report');
  };

  // copiar / reconstruir: guardar el fragmento del modelo (y tu grabación) y avanzar
  const takeChunk = (rec?: Recording | null) => {
    if (!chunk) return;
    addClip(rec);
    setBuilt([...built, chunk.text]);
    advance();
  };
  const reveal = () => {
    setRevealed(true);
    playChunk();
  };

  // crear
  const onDictated = (r: DictationResult) => {
    recs.current.push(r);
    setMine((prev) => [...prev, r]);
    if (idx + 1 < steps.length) setIdx(idx + 1);
    else setPhase('report');
  };
  const onDictateWhole = (r: DictationResult) => {
    recs.current.push(r);
    setMine([r]);
    setPhase('report');
  };
  const outline = target.scaffold ?? steps.map((s) => s.prompt);
  const playMine = async () => {
    const urls = mine.map((m) => m.recording?.url).filter((u): u is string => Boolean(u));
    for (const url of urls) {
      if ((await audio.playClip(url)) === 'interrupted') break;
    }
  };
  // Copiar/Reconstruir(examen): tu versión hablada, frase por frase, en orden.
  const playMyClips = async () => {
    for (const r of clipRecs.current) {
      if ((await audio.playClip(r.url)) === 'interrupted') break;
    }
  };

  /* ─────────────────────────────── brief ──────────────────────────────── */
  if (phase === 'brief') {
    return (
      <div className="build">
        <p className="build__eyebrow">Armá el guion</p>
        <h2>Tres maneras de armarlo</h2>
        <p className="build__note">
          Copiá el modelo frase por frase, reconstruilo de memoria, o creá el tuyo.
        </p>

        {versionCount > 1 && (
          <div className="build__versions">
            <span className="build__versions-label">Qué versión practicar (Copiar / Reconstruir):</span>
            <div className="aspect__chips">
              {Array.from({ length: versionCount }, (_, v) => (
                <button
                  key={v}
                  className={'chip' + (version === v ? ' chip--on' : '')}
                  onClick={() => setVersion(v)}
                >
                  {versionLabel(v)}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="build__choice">
          <button className="btn btn--primary btn--wide" onClick={() => start('copy')}>
            🗣 Copiar el modelo (frase por frase) →
          </button>
          <p className="build__choice-note">
            Oís cada frase del modelo y la repetís. La copia guiada — ideal para empezar.
          </p>
        </div>

        <div className="build__choice">
          <button className="btn btn--wide" onClick={() => start('reconstruct')}>
            🧠 Reconstruir de memoria →
          </button>
          <p className="build__choice-note">Recordás cada parte y después la revelás.</p>
          <label className="build__toggle">
            <input type="checkbox" checked={exam} onChange={(e) => setExam(e.target.checked)} />
            <span>
              Modo examen: decir cada parte en voz alta. <em>Sin esto, solo revelás.</em>
            </span>
          </label>
        </div>

        <div className="build__choice">
          <button className="btn btn--wide" onClick={() => start('create')}>
            ✍️ Crear el tuyo →
          </button>
          <p className="build__choice-note">
            Tu versión, guiada por las preguntas, con transcripción <strong>en vivo</strong> (el
            vocabulario del tema en verde) y te podés escuchar.
          </p>
          <label className="build__toggle">
            <input type="checkbox" checked={whole} onChange={(e) => setWhole(e.target.checked)} />
            <span>
              De corrido: decilo <strong>todo junto</strong>, con la guía a la vista.{' '}
              <em>Sin esto, paso a paso.</em>
            </span>
          </label>
        </div>
      </div>
    );
  }

  /* ─────────────────────── run · crear · de corrido ────────────────────── */
  if (phase === 'run' && flow === 'create' && whole) {
    return (
      <div className="build">
        <p className="build__eyebrow">Crear el tuyo · de corrido</p>
        <h2>Decilo todo junto</h2>
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

  /* ───────────────────── run · copiar / reconstruir ────────────────────── */
  if (phase === 'run' && (flow === 'copy' || flow === 'reconstruct') && chunk) {
    return (
      <div className="build">
        <div className="build__progress">
          <span>
            {versionCount > 1 ? `${versionLabel(version)} · ` : ''}Parte {idx + 1} de {chunks.length}
          </span>
          <div className="build__bar">
            <span style={{ width: `${(idx / chunks.length) * 100}%` }} />
          </div>
        </div>

        {flow === 'copy' ? (
          // COPIAR: oís y ves la frase, y la repetís (sombra).
          <>
            <div className="build__seg">
              <button className="build__play" onClick={playChunk} aria-label="Escuchar la frase">
                🔊
              </button>
              <p>{chunk.text}</p>
            </div>
            <p className="build__hint">Escuchala y repetila igual — imitá el ritmo y la entonación.</p>
            <SpeakPanel
              key={idx}
              targets={[chunk.text]}
              neighbourhood={chunks.map((c) => c.text)}
              lang="en-US"
              onPlayReference={playChunk}
              onDone={(_, rec) => takeChunk(rec)}
            />
          </>
        ) : (
          // RECONSTRUIR: pregunta (A) o "parte N" (B/C), recordás y revelás.
          <>
            <div className="build__q">
              {chunk.prompt ? (
                <>
                  <button className="build__play" onClick={askQuestion} aria-label="Repetir la pregunta">
                    🔊
                  </button>
                  <p>{chunk.prompt}</p>
                </>
              ) : (
                <p>Recordá y decí la parte {idx + 1} del guion.</p>
              )}
            </div>
            {!revealed ? (
              exam ? (
                <SpeakPanel
                  key={idx}
                  targets={[chunk.text]}
                  neighbourhood={chunks.map((c) => c.text)}
                  lang="en-US"
                  onPlayReference={playChunk}
                  onDone={(_, rec) => {
                    addClip(rec);
                    setRevealed(true);
                  }}
                />
              ) : (
                <button className="btn btn--primary btn--wide" onClick={reveal}>
                  Revelar esta parte →
                </button>
              )
            ) : (
              <div className="build__revealed">
                <div className="build__seg">
                  <button className="build__play" onClick={playChunk} aria-label="Escuchar la parte">
                    🔊
                  </button>
                  <p>{chunk.text}</p>
                </div>
                <button className="btn btn--primary btn--wide" onClick={() => takeChunk()} autoFocus>
                  {idx + 1 < chunks.length ? 'Siguiente parte →' : 'Ver el guion completo →'}
                </button>
              </div>
            )}
          </>
        )}

        {built.length > 0 && (
          <div className="build__soFar">
            <p className="build__soFar-label">El guion hasta acá</p>
            <p className="build__script">{built.join(' ')}</p>
          </div>
        )}
      </div>
    );
  }

  /* ─────────────────────────── run · crear · paso a paso ───────────────── */
  if (phase === 'run' && flow === 'create' && step) {
    return (
      <div className="build">
        <div className="build__progress">
          <span>Paso {idx + 1} de {steps.length}</span>
          <div className="build__bar">
            <span style={{ width: `${(idx / steps.length) * 100}%` }} />
          </div>
        </div>

        <div className="build__q">
          <button className="build__play" onClick={askQuestion} aria-label="Repetir la pregunta">
            🔊
          </button>
          <p>{step.prompt}</p>
        </div>

        <LiveDictation key={idx} expected={expected} lang="en-US" onDone={onDictated} />
        {mine.length > 0 && (
          <div className="build__soFar">
            <p className="build__soFar-label">Tu guion hasta acá</p>
            <p className="build__script">
              <Highlighted text={mine.map((m) => m.transcript).join(' ')} expected={expected} />
            </p>
          </div>
        )}
      </div>
    );
  }

  /* ────────────────────────────── report · crear ──────────────────────── */
  if (flow === 'create') {
    const yours = mine.map((m) => m.transcript).join(' ').trim();
    const anyRec = mine.some((m) => m.recording);
    return (
      <div className="build">
        <p className="build__eyebrow">Tu guion</p>
        <h2>Lo creaste vos</h2>

        <section className="build__block">
          <div className="build__block-head">
            <h3>Tu producción</h3>
            {anyRec && (
              <button className="btn" onClick={playMine}>
                🔊 Escucharte entero
              </button>
            )}
          </div>
          <p className="build__script">
            {yours ? <Highlighted text={yours} expected={expected} /> : '— no se transcribió nada —'}
          </p>
          <p className="build__hint">En verde, el vocabulario del tema que usaste.</p>
        </section>

        <ModelVersions target={target} versionCount={versionCount} versionLabel={versionLabel}
          versionText={versionText} versionWholeKey={versionWholeKey} />

        <div className="ab">
          <button className="btn" onClick={reset}>
            Volver a empezar
          </button>
          <button className="btn btn--primary" onClick={() => onDone(true)} autoFocus>
            Terminar →
          </button>
        </div>
      </div>
    );
  }

  /* ─────────────────── report · copiar / reconstruir ───────────────────── */
  const yours = built.join(' ');
  return (
    <div className="build">
      <p className="build__eyebrow">{flow === 'copy' ? 'Guion copiado' : 'Guion reconstruido'}</p>
      <h2>Lo armaste entero</h2>

      <section className="build__block">
        <div className="build__block-head">
          <h3>{flow === 'copy' ? 'Lo que copiaste' : 'Lo que reconstruiste'} ({versionLabel(version)})</h3>
          {clipCount > 0 ? (
            // Tu versión hablada (lo que grabaste), no el modelo.
            <button className="btn" onClick={playMyClips}>
              🔊 Escucharte
            </button>
          ) : (
            <button
              className="btn"
              onClick={() => void audio.speak({ key: versionWholeKey(version), text: versionText(version), speakerId: target.speaker })}
            >
              🔊 Escuchar
            </button>
          )}
        </div>
        <p className="build__script">{yours}</p>
      </section>

      <ModelVersions target={target} versionCount={versionCount} versionLabel={versionLabel}
        versionText={versionText} versionWholeKey={versionWholeKey} />

      <div className="ab">
        <button className="btn" onClick={reset}>
          Volver a empezar
        </button>
        <button className="btn btn--primary" onClick={() => onDone(true)} autoFocus>
          Terminar →
        </button>
      </div>
    </div>
  );
}

/** Todas las versiones modelo, para oír y comparar (A, B, C…). */
function ModelVersions({
  target,
  versionCount,
  versionLabel,
  versionText,
  versionWholeKey,
}: {
  target: ScriptBuilderRound['target'];
  versionCount: number;
  versionLabel: (v: number) => string;
  versionText: (v: number) => string;
  versionWholeKey: (v: number) => string;
}) {
  const audio = useAudio();
  return (
    <section className="build__block">
      <h3>{versionCount > 1 ? 'Las versiones modelo (para comparar)' : 'Versión modelo'}</h3>
      {Array.from({ length: versionCount }, (_, v) => (
        <div key={v} className="build__version">
          <div className="build__block-head">
            <span className="build__version-label">{versionLabel(v)}</span>
            <button
              className="btn"
              onClick={() => void audio.speak({ key: versionWholeKey(v), text: versionText(v), speakerId: target.speaker })}
            >
              🔊 Escuchar
            </button>
          </div>
          <p className="build__script build__script--model">{versionText(v)}</p>
        </div>
      ))}
    </section>
  );
}
