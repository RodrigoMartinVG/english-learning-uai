/**
 * TalkView — la exposición "con el diagrama": el esquema fijo, la voz que lo va
 * recorriendo y un láser que señala lo que la voz está diciendo. Con subtítulos y
 * controles (frase anterior/siguiente, play/pausa, saltar a una frase, voz, velocidad).
 *
 * Suena oración por oración: los mismos clips del audio continuo, así que hereda sus
 * voces. Dentro de cada oración el láser sigue el avance REAL del clip (transporte del
 * AudioService), no tiempos fijos: ver src/data/talks.ts.
 */

import { Fragment, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useAudio, useAudioTransport } from '../audio/AudioProvider.tsx';
import { manifest } from '../data/content.ts';
import { modelVersionLabel, versionChunks } from '../data/reference.ts';
import { resolveCues, spotAt } from '../data/talks.ts';
import { MODEL_VOICES } from '../../content/kokoro-voices.ts';
import type { Atom } from '../../content/schema.ts';
import { WHOLE_DIAGRAM, type Run, type Talk, type TalkBox, type TalkLine } from '../../content/talks.ts';
import './talk.css';

type Production = Extract<Atom, { kind: 'production' }>;

const VOICE_KEY = 'oda.talk.voice';
const RATE_KEY = 'oda.talk.rate';
const RATES = [0.85, 1, 1.15];
/** Sin voz guardada, Nicole: la más pausada, la que el alumno eligió para practicar. */
const DEFAULT_VOICE = 'af_nicole';
/** El láser llega un poco antes que la palabra, como quien señala mientras habla. */
const LEAD_S = 0.25;

/** `**x**` → énfasis (las palabras clave); las flechas, en color: son las conexiones. */
function rich(text: string) {
  return text.split(/(\*\*[^*]+\*\*|[→←↑])/).map((p, i) =>
    p.startsWith('**') && p.endsWith('**') ? (
      <strong key={i}>{p.slice(2, -2)}</strong>
    ) : /^[→←↑]$/.test(p) ? (
      <span key={i} className="talk__to">
        {p}
      </span>
    ) : (
      <Fragment key={i}>{p}</Fragment>
    )
  );
}

function RunView({ run }: { run: Run }) {
  if (typeof run === 'string') return <>{rich(run)}</>;
  return (
    <span className="talk__spot" data-spot={run[0]}>
      {rich(run[1])}
    </span>
  );
}

function LineView({ line }: { line: TalkLine }) {
  return (
    <p className={line.indent ? `talk__line talk__line--i${line.indent}` : 'talk__line'}>
      {line.runs.map((r, i) => (
        <RunView key={i} run={r} />
      ))}
    </p>
  );
}

/** Una celda de la tabla: se señala la celda entera, no solo su texto. */
function Cell({ run, head }: { run: Run; head?: boolean }) {
  const [spot, text] = typeof run === 'string' ? [undefined, run] : run;
  const Tag = head ? 'th' : 'td';
  return <Tag data-spot={spot}>{rich(text)}</Tag>;
}

function BoxView({ box }: { box: TalkBox }) {
  return (
    <section className={`talk__box talk__box--${box.kind}`} data-spot={box.spot}>
      <h3 className="talk__box-title">{box.title}</h3>
      {box.kind === 'list' && box.lines.map((l, i) => <LineView key={i} line={l} />)}
      {box.kind === 'columns' && (
        <div className="talk__cols">
          {box.columns.map((c) => (
            <div key={c.spot} className="talk__col" data-spot={c.spot}>
              <h4>{c.title}</h4>
              {c.lines.map((l, i) => (
                <LineView key={i} line={l} />
              ))}
            </div>
          ))}
        </div>
      )}
      {box.kind === 'table' && (
        <table className="talk__table">
          <thead>
            <tr>
              {box.head.map((h, i) => (
                <Cell key={i} run={h} head />
              ))}
            </tr>
          </thead>
          <tbody>
            {box.rows.map((r, i) => (
              <tr key={i}>
                {r.map((c, j) => (
                  <Cell key={j} run={c} />
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

export function TalkView({ atom, versionIdx, talk }: { atom: Production; versionIdx: number; talk: Talk }) {
  const audio = useAudio();
  const transport = useAudioTransport();
  const chunks = useMemo(() => versionChunks(atom, versionIdx), [atom, versionIdx]);
  const cues = useMemo(() => resolveCues(chunks.map((c) => c.text), talk.cues), [chunks, talk]);

  // Solo las voces que tienen clip para TODAS las oraciones (si no, alguna caería
  // a la voz del navegador a mitad de la exposición).
  const voices = useMemo(
    () => MODEL_VOICES.filter((v) => chunks.every((c) => audio.hasFile(`${c.audioKey}.v.${v.id}`))),
    [chunks, audio]
  );
  const [voice, setVoice] = useState<string | null>(() => {
    const saved = localStorage.getItem(VOICE_KEY) ?? DEFAULT_VOICE;
    return saved !== 'base' && voices.some((v) => v.id === saved) ? saved : null;
  });
  const [rate, setRate] = useState(() => {
    const saved = Number(localStorage.getItem(RATE_KEY));
    return RATES.includes(saved) ? saved : 1;
  });
  const [idx, setIdx] = useState(0);
  const [status, setStatus] = useState<'idle' | 'playing' | 'paused'>('idle');
  const [done, setDone] = useState(false);
  const [subs, setSubs] = useState(true);

  // Valores vivos para el loop async: cambiar voz o velocidad rearranca la oración
  // actual, y el loop tiene que leer lo nuevo en ese mismo momento.
  const voiceRef = useRef(voice);
  const rateRef = useRef(rate);
  /** Cada arranque toma un número; un loop viejo que despierta con otro número se va. */
  const runRef = useRef(0);

  const keyOf = useCallback(
    (i: number, v: string | null = voiceRef.current) => (v ? `${chunks[i]!.audioKey}.v.${v}` : chunks[i]!.audioKey),
    [chunks]
  );

  const play = useCallback(
    async (from: number) => {
      const run = ++runRef.current;
      setDone(false);
      setStatus('playing');
      for (let i = from; i < chunks.length; i++) {
        setIdx(i);
        const res = await audio.speak({
          key: keyOf(i),
          text: chunks[i]!.text,
          speakerId: atom.speaker,
          rateFactor: rateRef.current,
        });
        if (run !== runRef.current) return; // otro arranque (saltar, cambiar voz) tomó el control
        if (res === 'interrupted') return setStatus('idle'); // otro audio lo pisó
      }
      setStatus('idle');
      setDone(true);
    },
    [audio, chunks, keyOf, atom.speaker]
  );

  const stop = useCallback(() => {
    runRef.current++;
    audio.cancel();
    setStatus('idle');
  }, [audio]);

  // Cortar al salir de la vista.
  useEffect(
    () => () => {
      runRef.current++;
      audio.cancel();
    },
    [audio]
  );

  const toggle = useCallback(() => {
    if (status === 'playing') {
      audio.pause();
      setStatus('paused');
    } else if (status === 'paused') {
      audio.resume();
      setStatus('playing');
    } else void play(done ? 0 : idx);
  }, [audio, status, play, done, idx]);

  /** Ir a una oración: si estaba sonando sigue desde ahí; si no, solo se posiciona. */
  const go = useCallback(
    (i: number) => {
      const j = Math.max(0, Math.min(chunks.length - 1, i));
      if (status === 'playing') return void play(j);
      stop();
      setDone(false);
      setIdx(j);
    },
    [chunks.length, status, play, stop]
  );

  const chooseVoice = (v: string | null) => {
    setVoice(v);
    voiceRef.current = v;
    localStorage.setItem(VOICE_KEY, v ?? 'base');
    if (status === 'playing') void play(idx);
  };
  const chooseRate = (r: number) => {
    setRate(r);
    rateRef.current = r;
    localStorage.setItem(RATE_KEY, String(r));
    if (status === 'playing') void play(idx);
  };

  // Teclado: espacio = play/pausa, flechas = frase anterior/siguiente.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName ?? '';
      if (/^(INPUT|SELECT|TEXTAREA)$/.test(tag)) return;
      // Sobre un botón, el espacio ya lo "aprieta": manejarlo acá lo haría dos veces.
      if (e.key === ' ' && tag !== 'BUTTON') {
        e.preventDefault();
        toggle();
      } else if (e.key === 'ArrowRight') go(idx + 1);
      else if (e.key === 'ArrowLeft') go(idx - 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [toggle, go, idx]);

  // Por dónde va la voz dentro de la oración. Solo vale el transporte de ESTE clip:
  // al pasar de oración, el snapshot todavía es el del clip anterior.
  const live = status !== 'idle' && transport.key === keyOf(idx, voice) && transport.duration > 0;
  const frac = done ? 1 : live ? Math.min(1, (transport.currentTime + LEAD_S * rate) / transport.duration) : 0;
  const spot = spotAt(cues, idx, frac);

  // El láser: medir el elemento señalado, relativo al escenario.
  const stageRef = useRef<HTMLDivElement>(null);
  const [rect, setRect] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  useLayoutEffect(() => {
    const stage = stageRef.current;
    if (!stage || !spot) return;
    const measure = () => {
      const s = stage.getBoundingClientRect();
      // El diagrama entero: un marco apenas por dentro del borde del escenario.
      if (spot === WHOLE_DIAGRAM) return setRect({ x: 8, y: 6, w: s.width - 16, h: s.height - 12 });
      const el = stage.querySelector<HTMLElement>(`[data-spot="${spot}"]`);
      if (!el) return;
      const r = el.getBoundingClientRect();
      setRect({ x: r.left - s.left, y: r.top - s.top, w: r.width, h: r.height });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(stage);
    return () => ro.disconnect();
  }, [spot]);

  // Que lo señalado quede a la vista, sonando o saltando a mano: el diagrama es más
  // alto que la pantalla y el dock tapa la parte de abajo. El diagrama entero no
  // entra en pantalla: ahí no se mueve.
  useEffect(() => {
    if (!spot || spot === WHOLE_DIAGRAM) return;
    stageRef.current
      ?.querySelector(`[data-spot="${spot}"]`)
      ?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [spot]);

  // La línea de tiempo: un tramo por oración, proporcional a su duración en la voz elegida.
  const durs = useMemo(
    () => chunks.map((c, i) => (manifest.entries[keyOf(i, voice)]?.durationMs ?? c.text.length * 60) / 1000),
    [chunks, keyOf, voice]
  );
  const total = durs.reduce((a, b) => a + b, 0) / rate;
  const elapsed = (durs.slice(0, idx).reduce((a, b) => a + b, 0) + frac * (durs[idx] ?? 0)) / rate;

  const d = talk.diagram;
  const dotX = rect ? Math.max(2, rect.x - 16) : 0;
  const dotY = rect ? (rect.h > 44 ? rect.y + 16 : rect.y + rect.h / 2) : 0;

  return (
    <div className="talk">
      <p className="home__eyebrow">Guiones modelo · {modelVersionLabel(atom, versionIdx)}</p>
      <h1>Exposición con el diagrama</h1>
      <p className="talk__intro">
        La voz recorre el esquema y el láser señala lo que va diciendo: es lo que vas a hacer en el
        video, explicar mirando el diagrama en vez de leer.
      </p>

      <div className="talk__stage" ref={stageRef}>
        <header className="talk__head">
          <h2>
            <RunView run={d.title} />
            <span className="talk__sep"> · </span>
            <RunView run={d.author} />
          </h2>
          <p>
            <RunView run={d.purpose} />
          </p>
        </header>
        {d.boxes.map((b, i) => (
          <Fragment key={b.spot}>
            {i > 0 && (
              <div className="talk__arrow" aria-hidden="true">
                ↓
              </div>
            )}
            <BoxView box={b} />
          </Fragment>
        ))}

        {rect && (
          <>
            <div
              className={'talk__hl' + (spot ? ' talk__hl--on' : '')}
              style={{ transform: `translate(${rect.x - 5}px, ${rect.y - 3}px)`, width: rect.w + 10, height: rect.h + 6 }}
              aria-hidden="true"
            />
            <div
              className={'talk__laser' + (spot ? ' talk__laser--on' : '')}
              style={{ transform: `translate(${dotX}px, ${dotY}px)` }}
              aria-hidden="true"
            />
          </>
        )}
      </div>

      <div className="talk__dock">
        {subs && (
          <p className="talk__sub" aria-live="polite">
            {chunks[idx]?.text}
          </p>
        )}

        <div className="talk__timeline" role="group" aria-label="Frases">
          {chunks.map((c, i) => (
            <button
              key={i}
              className={'talk__seg' + (i < idx || (i === idx && done) ? ' talk__seg--past' : '') + (i === idx ? ' talk__seg--now' : '')}
              style={{ flexGrow: durs[i] }}
              onClick={() => go(i)}
              title={c.text}
              aria-label={`Frase ${i + 1}`}
            >
              {i === idx && !done && <span className="talk__seg-fill" style={{ width: `${frac * 100}%` }} />}
            </button>
          ))}
        </div>

        <div className="talk__controls">
          <div className="talk__transport">
            <button onClick={() => go(idx - 1)} disabled={idx === 0} aria-label="Frase anterior" title="Frase anterior (←)">
              ⏮
            </button>
            <button className="talk__play" onClick={toggle} aria-label={status === 'playing' ? 'Pausar' : 'Reproducir'} title="Play / pausa (espacio)">
              {status === 'playing' ? '⏸' : '▶'}
            </button>
            <button onClick={() => go(idx + 1)} disabled={idx >= chunks.length - 1} aria-label="Frase siguiente" title="Frase siguiente (→)">
              ⏭
            </button>
            <button onClick={stop} disabled={status === 'idle'} aria-label="Detener" title="Detener">
              ⏹
            </button>
            <span className="talk__time">
              {fmt(elapsed)} / {fmt(total)} · frase {idx + 1} de {chunks.length}
            </span>
          </div>

          <div className="talk__options">
            <label className="talk__opt">
              Voz
              <select value={voice ?? ''} onChange={(e) => chooseVoice(e.target.value || null)}>
                <option value="">Base</option>
                {voices.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.label}
                  </option>
                ))}
              </select>
            </label>
            <div className="talk__rates" role="group" aria-label="Velocidad">
              {RATES.map((r) => (
                <button key={r} className={r === rate ? 'talk__rate talk__rate--on' : 'talk__rate'} onClick={() => chooseRate(r)}>
                  {r}×
                </button>
              ))}
            </div>
            <label className="talk__opt">
              <input type="checkbox" checked={subs} onChange={(e) => setSubs(e.target.checked)} />
              Subtítulos
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
