/**
 * App — el shell y la navegación. Ver ARQUITECTURA.md §14.5.
 *
 * Híbrido y en este orden: HOY propone una sesión ya armada por el SRS (lo que
 * estás por olvidar + lo nuevo), y abajo la navegación libre — porque el lunes
 * hay parcial de there is/are y el alumno tiene derecho a machacar eso y nada más.
 * Y ahora se puede entrar directo a UNA mecánica, sin esperar que caiga al azar.
 */

import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { AudioProvider, FlagAudioButton, useAudio, useAudioState } from '../audio/AudioProvider.tsx';
import { atomInAspect, type Aspect, type Atom, type Course, type ReadingAtom, type Skill } from '../../content/schema.ts';
import { atoms, courseName, courses, units } from '../data/content.ts';
import { mechanics } from '../mechanics/registry.ts';
import {
  buildSession,
  DEFAULT_LENGTH,
  type Scheduler,
  type Session,
  type SessionMode,
  type Step,
} from '../engine/session.ts';
import {
  cardIsDue,
  cardIsNew,
  cardRetrievability,
  coverageOf,
  atomProgress,
  type AtomProgress,
  skillStateOf,
  statsFor,
  subscribeProgress,
  weakSpots,
} from '../data/progress.ts';
import { SessionPlayer } from './SessionPlayer.tsx';
import { ResetPanel } from './ResetPanel.tsx';
import { DiagnosticsView } from './DiagnosticsView.tsx';
import { ReferenceView } from './ReferenceView.tsx';
import { ReaderView } from './ReaderView.tsx';
import './app.css';

/** Adapta el store de progreso al contrato que el motor espera. */
const scheduler: Scheduler = {
  isDue: (s: Step) => cardIsDue({ atomId: s.atomId, skill: s.skill, variant: s.variant }),
  isNew: (s: Step) => cardIsNew({ atomId: s.atomId, skill: s.skill, variant: s.variant }),
  retrievability: (s: Step) =>
    cardRetrievability({ atomId: s.atomId, skill: s.skill, variant: s.variant }),
};

/** Re-renderiza cuando cambia el progreso, sin prop-drilling. */
function useProgress() {
  return useSyncExternalStore(subscribeProgress, () => statsFor().seen);
}

/** Las prácticas agrupadas por etapa de la escalera, para dar jerarquía visual. */
const STAGES: { label: string; levels: number[] }[] = [
  { label: 'Escuchar y reconocer', levels: [1, 2] },
  { label: 'Comprender y construir', levels: [3] },
  { label: 'Producir y exponer', levels: [4, 5] },
];

/** Mecánicas donde cada átomo es un guion entero: conviene ELEGIR cuál, no ir en fila. */
const PICKABLE = new Set(['script-builder', 'oral-exam']);

/** Etiqueta corta para un guion (production) en el selector. */
function scriptLabel(a: Atom): string {
  if (a.kind !== 'production') return a.id;
  const ch = /CHAPTER\s+(\d+)/i.exec(a.prompt);
  if (ch) return `My Life · Capítulo ${ch[1]}`;
  return a.prompt.length > 56 ? a.prompt.slice(0, 54) + '…' : a.prompt;
}

/** Etiqueta humana de un átomo, para el desglose por ítem del tema. */
function atomLabel(a: Atom): string {
  let t: string;
  switch (a.kind) {
    case 'phrase': t = a.text; break;
    case 'qa': t = a.prompt; break;
    case 'lexeme': t = a.word; break;
    case 'production': t = a.prompt; break;
    case 'contrast': t = a.pair.join(' / '); break;
    case 'exercise': t = a.prompt; break;
    case 'listening': t = a.questions[0]?.q ?? 'Comprensión auditiva'; break;
    case 'dialogue': t = a.title; break;
    default: t = a.id;
  }
  return t.length > 64 ? t.slice(0, 62) + '…' : t;
}

/** Estado de un ítem para el desglose: color + texto. */
function itemStatus(p: AtomProgress): { cls: string; label: string } {
  if (!p.started) return { cls: 'new', label: 'sin empezar' };
  if (p.mastered) return { cls: 'ok', label: 'dominada' };
  if (p.due) return { cls: 'due', label: 'por repasar' };
  return { cls: 'prog', label: `en progreso · ${p.reps} ${p.reps === 1 ? 'repaso' : 'repasos'}` };
}

// Las 4 habilidades, en orden de la escalera, con etiqueta corta para el desglose.
const SKILL_ORDER: Skill[] = ['perception', 'comprehension', 'retrieval', 'production'];
const SKILL_SHORT: Record<Skill, string> = {
  perception: 'Percepción',
  comprehension: 'Comprensión',
  retrieval: 'Recuperación',
  production: 'Producción',
};

type View =
  | { name: 'courses' }
  | { name: 'home'; course: Course }
  | { name: 'unit'; course: Course; unit: number }
  | { name: 'reference'; course: Course; unit: number; textId?: string; only?: 'guide' | 'scripts' }
  | { name: 'reader'; course: Course; unit: number; atomId: string }
  | { name: 'session'; session: Session }
  | { name: 'diagnostics' }
  | { name: 'reset' };

/** Raíz de navegación: con un solo curso se entra directo; con varios, al selector. */
const HOME_ROOT: View =
  courses.length === 1 ? { name: 'home', course: courses[0]!.id } : { name: 'courses' };

export default function App() {
  // Pila de navegación: "atrás" vuelve a DONDE ESTABAS, no siempre al inicio.
  const [history, setHistory] = useState<View[]>([HOME_ROOT]);
  const view = history[history.length - 1]!;
  const push = (v: View) => setHistory((h) => [...h, v]);
  const back = () => setHistory((h) => (h.length > 1 ? h.slice(0, -1) : h));
  const goHome = () => setHistory([HOME_ROOT]);
  const start = (session: Session) => push({ name: 'session', session });

  // Al cambiar de vista, arriba de todo. `history` es un array nuevo en cada
  // navegación (push/pop), así que esto dispara justo cuando cambiás de pantalla.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [history]);

  const activeCourse =
    view.name === 'home' || view.name === 'unit' || view.name === 'reference' || view.name === 'reader'
      ? view.course
      : undefined;

  return (
    <AudioProvider>
      <StopAudioOnNav view={view} />
      <div className="shell">
        <header className="shell__header">
          <button className="shell__brand" onClick={goHome} disabled={history.length === 1}>
            Oda <span>· {activeCourse ? courseName(activeCourse) : 'Language Hub'}</span>
          </button>
          <div className="shell__actions">
            <StopAudioButton />
            {/* En sesión, a mano: se marca justo cuando se oyó el audio raro. */}
            {view.name === 'session' && <FlagAudioButton />}
            {history.length > 1 && (
              <button className="shell__back" onClick={back}>
                {view.name === 'session' ? '✕ Salir' : '← Volver'}
              </button>
            )}
          </div>
        </header>

        <main className="shell__main">
          {view.name === 'courses' && (
            <CoursePicker onPick={(course) => push({ name: 'home', course })} />
          )}
          {view.name === 'home' && (
            <Home
              course={view.course}
              onUnit={(unit) => push({ name: 'unit', course: view.course, unit })}
              onStart={start}
              onReset={() => push({ name: 'reset' })}
              onDiagnostics={() => push({ name: 'diagnostics' })}
            />
          )}
          {view.name === 'unit' && (
            <UnitView
              course={view.course}
              unit={view.unit}
              onStart={start}
              onReference={(textId, only) =>
                push({ name: 'reference', course: view.course, unit: view.unit, textId, only })
              }
              onReader={(atomId) => push({ name: 'reader', course: view.course, unit: view.unit, atomId })}
            />
          )}
          {view.name === 'reference' && (
            <ReferenceView
              unit={units.find((u) => u.course === view.course && u.unit === view.unit)!}
              textId={view.textId}
              only={view.only}
              onReconstruct={(atomId) =>
                start(
                  buildSession(
                    { scope: { kind: 'atoms', atomIds: [atomId] }, mode: 'drill', length: DEFAULT_LENGTH, mechanicId: 'script-builder' },
                    atoms,
                    units.find((u) => u.course === view.course && u.unit === view.unit)!.aspects,
                    'Armá el guion',
                    scheduler
                  )
                )
              }
              onBack={back}
            />
          )}
          {view.name === 'reader' && (
            <ReaderView atom={atoms.find((a) => a.id === view.atomId) as ReadingAtom} onBack={back} />
          )}
          {view.name === 'session' && <SessionPlayer session={view.session} onExit={back} />}
          {view.name === 'diagnostics' && <DiagnosticsView onBack={back} onStart={start} />}
          {view.name === 'reset' && <ResetPanel onBack={back} />}
        </main>
      </div>
    </AudioProvider>
  );
}

/** Selector de nivel. Solo se muestra cuando hay más de un curso con contenido. */
function CoursePicker({ onPick }: { onPick: (course: Course) => void }) {
  return (
    <div className="home">
      <section>
        <p className="home__eyebrow">Elegí tu nivel</p>
        <h1>¿Qué inglés querés estudiar?</h1>
        <div className="home__mechanics">
          {courses.map((c) => {
            const ids = atoms.filter((a) => a.course === c.id && a.kind !== 'reading').map((a) => a.id);
            const cov = coverageOf(ids);
            const nUnits = units.filter((u) => u.course === c.id).length;
            return (
              <button key={c.id} className="card" onClick={() => onPick(c.id)}>
                <div className="card__top">
                  <span className="card__level">{c.name}</span>
                  {c.subtitle && <span className="card__skill">{c.subtitle}</span>}
                </div>
                <h3>{nUnits} {nUnits === 1 ? 'unidad' : 'unidades'}</h3>
                <ProgressBar started={cov.started} learned={cov.learned} total={cov.total} />
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}

/**
 * Corta el audio al navegar. `view` es un objeto nuevo en cada setView(), así que
 * el efecto dispara en cada cambio de pantalla y no cuando algo se re-renderiza
 * dentro de la misma. Sin esto, una referencia seguía sonando al volver o entrar
 * a otra unidad. Va antes que las vistas: su cancel() corre primero, y si la vista
 * nueva auto-reproduce algo (una sesión), ese play gana.
 */
function StopAudioOnNav({ view }: { view: View }) {
  const audio = useAudio();
  useEffect(() => {
    audio.cancel();
  }, [view, audio]);
  return null;
}

/** Botón global para cortar lo que esté sonando. Solo aparece mientras hay audio. */
function StopAudioButton() {
  const audio = useAudio();
  const state = useAudioState();
  if (state !== 'speaking' && state !== 'loading') return null;
  return (
    <button className="shell__stop" onClick={() => audio.cancel()} title="Parar el audio">
      ⏹ Parar audio
    </button>
  );
}

/* ───────────────────────────────────── home ─────────────────────────────────────── */

function Home({
  course,
  onUnit,
  onStart,
  onReset,
  onDiagnostics,
}: {
  course: Course;
  onUnit: (u: number) => void;
  onStart: (s: Session) => void;
  onReset: () => void;
  onDiagnostics: () => void;
}) {
  useProgress();
  // Todo acotado al curso elegido: stats por prefijo `enN.`, unidades del curso,
  // y el repaso global con scope de curso.
  const stats = statsFor(course);
  const weak = weakSpots();
  const courseUnits = units.filter((u) => u.course === course);
  const courseAspects = courseUnits.flatMap((u) => u.aspects);

  const today = () =>
    onStart(
      buildSession(
        { scope: { kind: 'due', course }, mode: 'review', length: DEFAULT_LENGTH },
        atoms,
        courseAspects,
        'Repaso de hoy',
        scheduler
      )
    );

  return (
    <div className="home">
      <details className="howto">
        <summary>¿Cómo estudiar? · leer una vez</summary>
        <div className="howto__body">
          <p>
            <strong>1. Elegí un tema y tocá “★ Estudiar”.</strong> Es donde se aprende: la primera vez
            te presenta el tema de a poco (de escuchar a hablar); después usa repetición espaciada y
            trae lo que estás por olvidar, en el modo que más conviene para cada ítem.
          </p>
          <p>
            <strong>2. “Empezar” (acá arriba) es el repaso global.</strong> Junta lo que estás por
            olvidar de <em>todos</em> los temas, en toda la app. Es repaso <strong>puro</strong>: solo
            lo que ya estudiaste, nunca material nuevo. Hacelo cada día para no olvidarte de nada.
          </p>
          <p>
            <strong>3. Extras (opcionales):</strong> las prácticas sueltas (Ósmosis, Shadowing, Al
            oído…) refuerzan una habilidad puntual; la <em>Guía de expresiones</em> y los{' '}
            <em>Guiones modelo</em> son material de consulta. No hace falta usarlos todos:{' '}
            <strong>repetí y la barra de cada tema se llena.</strong>
          </p>
        </div>
      </details>

      <section className="today">
        <p className="today__eyebrow">Hoy · repaso global</p>
        {stats.seen === 0 ? (
          <>
            <h1>Repaso espaciado</h1>
            <p className="today__note">
              Acá repasás lo que ya estudiaste, <strong>sin material nuevo</strong>. Todavía no
              estudiaste nada: elegí un tema abajo y tocá <strong>★ Estudiar</strong> para empezar.
            </p>
          </>
        ) : (
          <>
            <h1>{stats.due > 0 ? `${stats.due} para repasar` : 'Repaso espaciado'}</h1>
            <p className="today__note">
              {stats.due > 0
                ? 'Lo que estás por olvidar, primero. Solo lo que ya estudiaste — sin material nuevo.'
                : 'Nada vencido. Adelantás repaso de lo que ya viste (no suma material nuevo).'}
            </p>
            <button className="btn btn--primary btn--wide" onClick={today}>
              Empezar →
            </button>
            <p className="today__stats">
              {stats.learned} sabidas · {stats.seen} vistas · {stats.due} vencidas
            </p>
          </>
        )}
      </section>

      {/* Aparece solo cuando hay datos: un diagnóstico con dos errores mentiría. */}
      {weak.length > 0 && (
        <button className="weakcard" onClick={onDiagnostics}>
          <div>
            <p className="weakcard__eyebrow">Tus puntos débiles</p>
            <p className="weakcard__top">
              {weak.length} {weak.length === 1 ? 'foco' : 'focos'} para reforzar · lo peor:{' '}
              {weak[0]!.kind === 'phoneme' ? `sonido /${weak[0]!.tag}/` : weak[0]!.tag.split('.')[0]}
            </p>
          </div>
          <span aria-hidden="true">→</span>
        </button>
      )}

      <section>
        <h2 className="home__section">Unidades</h2>
        <div className="home__mechanics">
          {courseUnits.map((u) => {
            // El `reading` es recurso, no tarjeta: no cuenta para el progreso de la unidad.
            const ids = atoms
              .filter((a) => a.course === u.course && a.unit === u.unit && a.kind !== 'reading')
              .map((a) => a.id);
            const cov = coverageOf(ids);
            return (
              <button key={`${u.course}-${u.unit}`} className="card" onClick={() => onUnit(u.unit)}>
                <div className="card__top">
                  <span className="card__level">
                    {u.title.startsWith('Examen') ? 'Examen' : `Unidad ${u.unit}`}
                  </span>
                  <span className="card__skill">{u.aspects.length} temas</span>
                </div>
                <h3>{u.title}</h3>
                <p>{u.goals[0]}</p>
                <ProgressBar started={cov.started} learned={cov.learned} total={cov.total} />
              </button>
            );
          })}
        </div>
      </section>

      <footer className="home__status">
        <span>
          {atoms.length} átomos · {mechanics.length} mecánicas · {stats.seen} tarjetas en progreso
        </span>
        <button className="home__reset" onClick={onReset}>
          Borrar progreso…
        </button>
      </footer>
    </div>
  );
}

function ProgressBar({ started, learned, total }: { started: number; learned: number; total: number }) {
  const pct = total ? Math.round((started / total) * 100) : 0;
  return (
    <div className="pbar-wrap">
      <div className="pbar" title={`${started} de ${total} practicadas · ${learned} dominadas`}>
        <div className="pbar__fill" style={{ width: `${pct}%` }} />
      </div>
      <div className="pbar__meta">
        <span className="pbar__pct">{pct}%</span>
        <span className="pbar__count">
          {started}/{total} practicadas{learned > 0 ? ` · ${learned} dominadas` : ''}
        </span>
      </div>
    </div>
  );
}

/* ───────────────────────────────────── unidad ───────────────────────────────────── */

function UnitView({
  course,
  unit,
  onStart,
  onReference,
  onReader,
}: {
  course: Course;
  unit: number;
  onStart: (s: Session) => void;
  onReference: (textId?: string, only?: 'guide' | 'scripts') => void;
  onReader: (atomId: string) => void;
}) {
  useProgress();
  const u = units.find((x) => x.course === course && x.unit === unit)!;
  const [open, setOpen] = useState<string | null>(null);
  // Qué selector de guion está abierto, como "aspectId:mechanicId".
  const [picker, setPicker] = useState<string | null>(null);
  // Unidad de textos: cada aspecto es un texto (se agrupa por textId). En ese caso
  // todo lo del texto —leerlo, su guía de expresiones, sus prácticas— vive DENTRO
  // de su sección, no en el encabezado de la unidad.
  const isTextUnit = u.aspects.some((a) => (a.match.textId?.length ?? 0) > 0);
  // El "My Life" de la unidad: la producción acumulativa (con chapter y steps).
  // Es el capstone — se dicta/crea con "Armá el guion". Solo en las unidades que lo tienen.
  const myLife = atoms.find(
    (a) =>
      a.course === u.course &&
      a.unit === u.unit &&
      a.kind === 'production' &&
      a.chapter != null &&
      (a.steps?.length ?? 0) > 0
  );

  const go = (aspect: Aspect, mode: SessionMode, mechanicId?: string) =>
    onStart(
      buildSession(
        {
          scope: { kind: 'aspect', course: u.course, unit: u.unit, aspectId: aspect.id },
          mode,
          length: DEFAULT_LENGTH,
          mechanicId,
        },
        atoms,
        u.aspects,
        mechanicId ? mechanics.find((m) => m.id === mechanicId)!.name : aspect.title,
        scheduler
      )
    );

  // Arranca UNA práctica sobre UN guion concreto (elegido en el selector).
  const goScript = (atomId: string, mechanicId: string) =>
    onStart(
      buildSession(
        { scope: { kind: 'atoms', atomIds: [atomId] }, mode: 'drill', length: DEFAULT_LENGTH, mechanicId },
        atoms,
        u.aspects,
        mechanics.find((m) => m.id === mechanicId)!.name,
        scheduler
      )
    );

  const sorted = useMemo(() => [...u.aspects].sort((a, b) => a.order - b.order), [u.aspects]);

  // Progreso global de la unidad: mismo cálculo que la tarjeta del Home. Se computa
  // en cada render (no memoizado) para que siga al progreso, que cambia sin cambiar `u`.
  // El capstone (Dictado final) NO entra en las barras: se muestra aparte como hito
  // (su badge). Si no, quedaría duplicado y diluido como un ítem más en varios temas.
  const unitCov = coverageOf(
    atoms
      .filter(
        (a) => a.course === u.course && a.unit === u.unit && a.kind !== 'reading' && a.id !== myLife?.id
      )
      .map((a) => a.id)
  );

  // Estado del "Dictado final" como hito de la unidad. Ya cuenta en las barras (sus
  // etiquetas lo meten en varias etapas), pero como logro de unidad necesita un
  // indicador propio y claro: "sin grabar" hasta que lo hacés, luego "grabado".
  const capstone = myLife
    ? (() => {
        const p = atomProgress(myLife.id);
        if (!p.started) return { cls: 'new', label: 'sin grabar' };
        if (p.mastered) return { cls: 'ok', label: 'dominado ✓' };
        if (p.due) return { cls: 'due', label: 'a repasar' };
        return { cls: 'prog', label: 'grabado ✓' };
      })()
    : null;

  return (
    <div className="home">
      <section className="home__unit">
        <p className="home__eyebrow">{u.title.startsWith('Examen') ? 'Examen oral' : `Unidad ${u.unit}`}</p>
        <h1>{u.title}</h1>
        <ul className="home__goals">
          {u.goals.map((g) => (
            <li key={g}>{g}</li>
          ))}
        </ul>
        <div className="unit__progress">
          <span className="unit__progress-label">Progreso de la unidad</span>
          <ProgressBar started={unitCov.started} learned={unitCov.learned} total={unitCov.total} />
        </div>
        {/* Dos accesos separados, sin solaparse: uno da SOLO la guía de expresiones;
            el otro SOLO los guiones modelo (todos, con su botón de reconstruir). En una
            unidad de textos cada texto trae lo suyo adentro de su sección. */}
        {!isTextUnit && (
          <>
            <button className="unit__reference" onClick={() => onReference(undefined, 'guide')}>
              📖 Guía de expresiones — las formas de decir cada cosa →
            </button>
            <button
              className="unit__reference unit__capstone"
              onClick={() => onReference(undefined, 'scripts')}
            >
              <span className="unit__capstone-text">
                🎤 Guiones modelo — escuchá y reconstruí (incluye el monólogo final)
              </span>
              {capstone && (
                <span className={'capstone-badge capstone-badge--' + capstone.cls}>
                  <span className={'pdot pdot--' + capstone.cls} aria-hidden="true" /> monólogo:{' '}
                  {capstone.label}
                </span>
              )}
              <span aria-hidden="true">→</span>
            </button>
          </>
        )}
      </section>

      <section>
        <h2 className="home__section">Temas</h2>
        <div className="aspects">
          {sorted.map((a) => {
            const pool = atoms.filter(
              (at) => at.course === u.course && at.unit === u.unit && atomInAspect(at, a)
            );
            // El `reading` es un recurso, no una tarjeta: se lee, no se "aprende".
            // Queda fuera del progreso y de las mecánicas; se abre con su propio botón.
            const reading = pool.find((at) => at.kind === 'reading');
            // El capstone se reconstruye desde "Guiones modelo" y se muestra como hito
            // aparte (su badge): no lo contamos como ítem del tema.
            const practice = pool.filter((at) => at.kind !== 'reading' && at.id !== myLife?.id);
            // ¿El texto tiene guiones (producciones)? Si no, no ofrecemos "Guiones
            // modelo" — abría una lista vacía (p. ej. Datos/Profundización, solo qa).
            const hasScripts = pool.some((at) => at.kind === 'production');
            const cov = coverageOf(practice.map((at) => at.id));
            // Qué mecánicas puede ofrecer este tema, para el acceso directo.
            const avail = mechanics.filter((m) => practice.some((at) => m.accepts(at)));
            const isOpen = open === a.id;
            return (
              <div key={a.id} className={'aspect' + (isOpen ? ' aspect--open' : '')}>
                <button className="aspect__head" onClick={() => setOpen(isOpen ? null : a.id)}>
                  <span className="aspect__order">{a.order}</span>
                  <span className="aspect__body">
                    <strong>{a.title}</strong>
                    <span>{a.summary}</span>
                  </span>
                  <span
                    className="aspect__n"
                    title={`${cov.started} practicadas · ${cov.learned} dominadas de ${cov.total}`}
                  >
                    {cov.started}/{cov.total}
                  </span>
                </button>
                {isOpen && (
                  <div className="aspect__modes">
                    {(reading || a.match.textId?.[0]) && (
                      <div className="aspect__resources">
                        {reading && (
                          <button className="unit__reference" onClick={() => onReader(reading.id)}>
                            📖 Leer el texto completo — con figuras y audio →
                          </button>
                        )}
                        {a.match.textId?.[0] && (
                          <>
                            <button
                              className="unit__reference"
                              onClick={() => onReference(a.match.textId![0], 'guide')}
                            >
                              🗣 Guía de expresiones del texto →
                            </button>
                            {hasScripts && (
                              <button
                                className="unit__reference"
                                onClick={() => onReference(a.match.textId![0], 'scripts')}
                              >
                                🎤 Guiones modelo — escuchá y reconstruí →
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    )}

                    <div className="aspect__group">
                      <button
                        className="btn btn--primary btn--wide"
                        onClick={() => go(a, cov.started > 0 ? 'review' : 'discover')}
                        disabled={!avail.length}
                      >
                        ★ Estudiar
                      </button>
                      <p className="aspect__hint">
                        <strong>Estudiar</strong> es el modo principal. La primera vez te presenta el
                        tema de escuchar a hablar; después usa <strong>repetición espaciada</strong>:
                        trae lo que estás por olvidar, en el modo que más conviene para cada ítem, y
                        suma lo nuevo. Es el que fija el aprendizaje duradero — repetí y la barra de
                        arriba se llena.
                      </p>
                    </div>

                    {/* Práctica directa, agrupada por etapa de la escalera para dar jerarquía. */}
                    {avail.length > 0 && (
                      <p className="aspect__hint aspect__hint--practice">
                        Opcional: entrá a una práctica puntual solo si querés reforzar una habilidad.
                      </p>
                    )}
                    {STAGES.map((stage) => {
                      const ms = avail.filter((m) => stage.levels.includes(m.level));
                      if (!ms.length) return null;
                      const openMech = ms.find((m) => picker === `${a.id}:${m.id}`);
                      const scripts = openMech
                        ? practice.filter((at) => at.kind === 'production' && openMech.accepts(at))
                        : [];
                      return (
                        <div key={stage.label} className="aspect__group">
                          <p className="aspect__grouplabel">{stage.label}</p>
                          <div className="aspect__chips">
                            {ms.map((m) => {
                              const n = PICKABLE.has(m.id)
                                ? practice.filter((at) => at.kind === 'production' && m.accepts(at)).length
                                : 0;
                              if (n > 1) {
                                const key = `${a.id}:${m.id}`;
                                const on = picker === key;
                                return (
                                  <button
                                    key={m.id}
                                    className={'chip' + (on ? ' chip--on' : '')}
                                    onClick={() => setPicker(on ? null : key)}
                                  >
                                    {m.name} <span className="chip__count">{n}</span> {on ? '▾' : '▸'}
                                  </button>
                                );
                              }
                              return (
                                <button key={m.id} className="chip" onClick={() => go(a, 'drill', m.id)}>
                                  {m.name}
                                </button>
                              );
                            })}
                          </div>
                          {openMech && (
                            <div className="aspect__pick">
                              <p className="aspect__pickhint">Elegí cuál practicar:</p>
                              {scripts.map((s) => (
                                <button
                                  key={s.id}
                                  className="aspect__pickitem"
                                  onClick={() => goScript(s.id, openMech.id)}
                                >
                                  {scriptLabel(s)}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}

                    <details className="pdetail">
                      <summary>Ver los {practice.length} ítems y tu progreso</summary>
                      <ul className="pdetail__list">
                        {[...practice]
                          .sort((x, y) => x.difficulty - y.difficulty)
                          .map((at) => {
                            const st = itemStatus(atomProgress(at.id));
                            // Qué habilidades aplican a este ítem = las de los modos que lo aceptan.
                            const skills = SKILL_ORDER.filter((sk) =>
                              mechanics.some((m) => m.skill === sk && m.accepts(at))
                            );
                            return (
                              <li key={at.id} className="pdetail__row">
                                <div className="pdetail__main">
                                  <span className={'pdot pdot--' + st.cls} aria-hidden="true" />
                                  <span className="pdetail__label">{atomLabel(at)}</span>
                                  <span className={'pdetail__status pdetail__status--' + st.cls}>
                                    {st.label}
                                  </span>
                                </div>
                                <div className="pdetail__skills">
                                  {skills.map((sk) => {
                                    const cls = skillStateOf(at.id, sk);
                                    return (
                                      <span key={sk} className="pskill" title={SKILL_SHORT[sk]}>
                                        <span className={'pdot pdot--' + cls} aria-hidden="true" />
                                        {SKILL_SHORT[sk]}
                                      </span>
                                    );
                                  })}
                                </div>
                              </li>
                            );
                          })}
                      </ul>
                    </details>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
