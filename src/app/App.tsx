/**
 * App — el shell y la navegación. Ver ARQUITECTURA.md §14.5.
 *
 * Híbrido y en este orden: HOY propone una sesión ya armada por el SRS (lo que
 * estás por olvidar + lo nuevo), y abajo la navegación libre — porque el lunes
 * hay parcial de there is/are y el alumno tiene derecho a machacar eso y nada más.
 * Y ahora se puede entrar directo a UNA mecánica, sin esperar que caiga al azar.
 */

import { useMemo, useState, useSyncExternalStore } from 'react';
import { AudioProvider, FlagAudioButton, AltVoicesButton } from '../audio/AudioProvider.tsx';
import { atomInAspect, type Aspect } from '../../content/schema.ts';
import { atoms, units } from '../data/content.ts';
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
  progressOf,
  statsFor,
  subscribeProgress,
} from '../data/progress.ts';
import { SessionPlayer } from './SessionPlayer.tsx';
import { ResetPanel } from './ResetPanel.tsx';
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

type View =
  | { name: 'home' }
  | { name: 'unit'; unit: number }
  | { name: 'session'; session: Session }
  | { name: 'reset' };

export default function App() {
  const [view, setView] = useState<View>({ name: 'home' });
  const start = (session: Session) => setView({ name: 'session', session });

  return (
    <AudioProvider>
      <div className="shell">
        <header className="shell__header">
          <button
            className="shell__brand"
            onClick={() => setView({ name: 'home' })}
            disabled={view.name === 'home'}
          >
            Oda <span>· Inglés I</span>
          </button>
          <div className="shell__actions">
            {/* En sesión, a mano: se marca justo cuando se oyó el audio raro. */}
            {view.name === 'session' && <AltVoicesButton />}
            {view.name === 'session' && <FlagAudioButton />}
            {view.name !== 'home' && (
              <button className="shell__back" onClick={() => setView({ name: 'home' })}>
                {view.name === 'session' ? '✕ Salir' : '← Volver'}
              </button>
            )}
          </div>
        </header>

        <main className="shell__main">
          {view.name === 'home' && (
            <Home
              onUnit={(unit) => setView({ name: 'unit', unit })}
              onStart={start}
              onReset={() => setView({ name: 'reset' })}
            />
          )}
          {view.name === 'unit' && <UnitView unit={view.unit} onStart={start} />}
          {view.name === 'session' && (
            <SessionPlayer session={view.session} onExit={() => setView({ name: 'home' })} />
          )}
          {view.name === 'reset' && <ResetPanel onBack={() => setView({ name: 'home' })} />}
        </main>
      </div>
    </AudioProvider>
  );
}

/* ───────────────────────────────────── home ─────────────────────────────────────── */

function Home({
  onUnit,
  onStart,
  onReset,
}: {
  onUnit: (u: number) => void;
  onStart: (s: Session) => void;
  onReset: () => void;
}) {
  useProgress();
  const stats = statsFor();
  const allAspects = units.flatMap((u) => u.aspects);

  const today = () =>
    onStart(
      buildSession(
        { scope: { kind: 'due' }, mode: 'review', length: DEFAULT_LENGTH },
        atoms,
        allAspects,
        'Repaso de hoy',
        scheduler
      )
    );

  return (
    <div className="home">
      <section className="today">
        <p className="today__eyebrow">Hoy</p>
        <h1>{stats.due > 0 ? `${stats.due} para repasar` : 'Repaso mezclado'}</h1>
        <p className="today__note">
          {stats.seen === 0
            ? `${DEFAULT_LENGTH} ítems para empezar, de fácil a difícil.`
            : stats.due > 0
              ? 'Lo que estás por olvidar, primero. El resto, material nuevo.'
              : 'Nada vencido. Esta sesión adelanta repaso y suma material nuevo.'}
        </p>
        <button className="btn btn--primary btn--wide" onClick={today}>
          Empezar →
        </button>
        {stats.seen > 0 && (
          <p className="today__stats">
            {stats.learned} sabidas · {stats.seen} vistas · {stats.due} vencidas
          </p>
        )}
      </section>

      <section>
        <h2 className="home__section">Unidades</h2>
        <div className="home__mechanics">
          {units.map((u) => {
            const ids = atoms.filter((a) => a.course === u.course && a.unit === u.unit).map((a) => a.id);
            const p = progressOf(ids);
            return (
              <button key={u.unit} className="card" onClick={() => onUnit(u.unit)}>
                <div className="card__top">
                  <span className="card__level">Unidad {u.unit}</span>
                  <span className="card__skill">{u.aspects.length} temas</span>
                </div>
                <h3>{u.title}</h3>
                <p>{u.goals[0]}</p>
                <ProgressBar learned={p.learned} total={ids.length} />
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

function ProgressBar({ learned, total }: { learned: number; total: number }) {
  const pct = total ? Math.round((learned / total) * 100) : 0;
  return (
    <div className="pbar" title={`${learned} de ${total} sabidas`}>
      <div className="pbar__fill" style={{ width: `${pct}%` }} />
    </div>
  );
}

/* ───────────────────────────────────── unidad ───────────────────────────────────── */

function UnitView({ unit, onStart }: { unit: number; onStart: (s: Session) => void }) {
  useProgress();
  const u = units.find((x) => x.unit === unit)!;
  const [open, setOpen] = useState<string | null>(null);

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

  const sorted = useMemo(() => [...u.aspects].sort((a, b) => a.order - b.order), [u.aspects]);

  return (
    <div className="home">
      <section className="home__unit">
        <p className="home__eyebrow">Unidad {u.unit}</p>
        <h1>{u.title}</h1>
        <ul className="home__goals">
          {u.goals.map((g) => (
            <li key={g}>{g}</li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="home__section">Temas</h2>
        <div className="aspects">
          {sorted.map((a) => {
            const pool = atoms.filter((at) => at.unit === u.unit && atomInAspect(at, a));
            const p = progressOf(pool.map((at) => at.id));
            // Qué mecánicas puede ofrecer este tema, para el acceso directo.
            const avail = mechanics.filter((m) => pool.some((at) => m.accepts(at)));
            const isOpen = open === a.id;
            return (
              <div key={a.id} className={'aspect' + (isOpen ? ' aspect--open' : '')}>
                <button className="aspect__head" onClick={() => setOpen(isOpen ? null : a.id)}>
                  <span className="aspect__order">{a.order}</span>
                  <span className="aspect__body">
                    <strong>{a.title}</strong>
                    <span>{a.summary}</span>
                  </span>
                  <span className="aspect__n">
                    {p.learned}/{pool.length}
                  </span>
                </button>
                {isOpen && (
                  <div className="aspect__modes">
                    <div className="aspect__row">
                      <button className="btn btn--primary" onClick={() => go(a, 'discover')} disabled={!avail.length}>
                        Descubrir
                      </button>
                      <button className="btn" onClick={() => go(a, 'review')} disabled={!avail.length}>
                        Repasar
                      </button>
                    </div>
                    {/* Acceso directo: entrar a UNA mecánica, sin que caiga al azar. */}
                    <p className="aspect__label">Ir directo a una práctica</p>
                    <div className="aspect__chips">
                      {avail.map((m) => (
                        <button key={m.id} className="chip" onClick={() => go(a, 'drill', m.id)}>
                          {m.name}
                        </button>
                      ))}
                    </div>
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
