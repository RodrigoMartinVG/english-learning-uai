/**
 * App — el shell y la navegación. Ver ARQUITECTURA.md §14.5.
 *
 * Híbrido y en este orden: HOY propone una sesión ya armada (sin parálisis de
 * elección, y es lo que sostiene la retención entre unidades), y abajo está la
 * navegación libre, porque el lunes hay parcial de there is/are y el alumno
 * tiene derecho a machacar eso y nada más.
 */

import { useMemo, useState } from 'react';
import { AudioProvider } from '../audio/AudioProvider.tsx';
import { atomInAspect, type Aspect } from '../../content/schema.ts';
import { atoms, audioCoverage, units } from '../data/content.ts';
import { buildSession, DEFAULT_LENGTH, type Session, type SessionMode } from '../engine/session.ts';
import { mechanics } from '../mechanics/registry.ts';
import { SessionPlayer } from './SessionPlayer.tsx';
import './app.css';

type View = { name: 'home' } | { name: 'unit'; unit: number } | { name: 'session'; session: Session };

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
          {view.name !== 'home' && (
            <button className="shell__back" onClick={() => setView({ name: 'home' })}>
              {view.name === 'session' ? '✕ Salir' : '← Volver'}
            </button>
          )}
        </header>

        <main className="shell__main">
          {view.name === 'home' && (
            <Home onUnit={(unit) => setView({ name: 'unit', unit })} onStart={start} />
          )}
          {view.name === 'unit' && <UnitView unit={view.unit} onStart={start} />}
          {view.name === 'session' && (
            <SessionPlayer session={view.session} onExit={() => setView({ name: 'home' })} />
          )}
        </main>
      </div>
    </AudioProvider>
  );
}

/* ───────────────────────────────────── home ─────────────────────────────────────── */

function Home({ onUnit, onStart }: { onUnit: (u: number) => void; onStart: (s: Session) => void }) {
  const coverage = audioCoverage();

  const today = () =>
    onStart(
      buildSession(
        { scope: { kind: 'due' }, mode: 'review', length: DEFAULT_LENGTH },
        atoms,
        units.flatMap((u) => u.aspects),
        'Repaso de hoy'
      )
    );

  return (
    <div className="home">
      <section className="today">
        <p className="today__eyebrow">Hoy</p>
        <h1>Repaso mezclado</h1>
        <p className="today__note">
          {DEFAULT_LENGTH} ítems de todas las unidades, alternando ejercicios.
        </p>
        {/* Honestidad: sin FSRS esto todavía no prioriza lo que estás olvidando. */}
        <p className="today__warn">
          El repaso espaciado llega en la Fase 3. Por ahora la selección es aleatoria.
        </p>
        <button className="btn btn--primary btn--wide" onClick={today}>
          Empezar →
        </button>
      </section>

      <section>
        <h2 className="home__section">Unidades</h2>
        <div className="home__mechanics">
          {units.map((u) => {
            const n = atoms.filter((a) => a.course === u.course && a.unit === u.unit).length;
            return (
              <button key={u.unit} className="card" onClick={() => onUnit(u.unit)}>
                <div className="card__top">
                  <span className="card__level">Unidad {u.unit}</span>
                  <span className="card__skill">{u.aspects.length} temas</span>
                </div>
                <h3>{u.title}</h3>
                <p>{u.goals[0]}</p>
                <span className="card__count">{n} átomos</span>
              </button>
            );
          })}
        </div>
      </section>

      <footer className="home__status">
        <span>
          {atoms.length} átomos · {coverage.withFile}/{coverage.total} con audio · {mechanics.length}{' '}
          mecánicas
        </span>
        {coverage.withFile < coverage.total && (
          <span className="home__warn">
            Falta audio: lo que no esté generado cae a la voz del navegador. Corré{' '}
            <code>npm run build:audio</code>.
          </span>
        )}
      </footer>
    </div>
  );
}

/* ───────────────────────────────────── unidad ───────────────────────────────────── */

function UnitView({ unit, onStart }: { unit: number; onStart: (s: Session) => void }) {
  const u = units.find((x) => x.unit === unit)!;
  const [open, setOpen] = useState<string | null>(null);

  const go = (aspect: Aspect, mode: SessionMode) =>
    onStart(
      buildSession(
        { scope: { kind: 'aspect', course: u.course, unit: u.unit, aspectId: aspect.id }, mode, length: DEFAULT_LENGTH },
        atoms,
        u.aspects,
        aspect.title
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
            const reach = pool.filter((at) => mechanics.some((m) => m.accepts(at))).length;
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
                    {reach}/{pool.length}
                  </span>
                </button>
                {isOpen && (
                  <div className="aspect__modes">
                    <button className="btn btn--primary" onClick={() => go(a, 'discover')} disabled={!reach}>
                      Descubrir
                    </button>
                    <button className="btn" onClick={() => go(a, 'drill')} disabled={!reach}>
                      Entrenar
                    </button>
                    {reach < pool.length && (
                      <p className="aspect__gap">
                        {pool.length - reach} átomos todavía sin mecánica que los use.
                      </p>
                    )}
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
