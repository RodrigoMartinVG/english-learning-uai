/**
 * App — el shell.
 *
 * Router mínimo: home ↔ mecánica. No hace falta más para un slice vertical, y
 * una librería de routing acá sería infraestructura sin problema que resolver.
 */

import { useMemo, useState } from 'react';
import { AudioProvider } from '../audio/AudioProvider.tsx';
import { atoms, audioCoverage, units } from '../data/content.ts';
import { osmosis } from '../mechanics/osmosis/mechanic.ts';
import { OsmosisView } from '../mechanics/osmosis/OsmosisView.tsx';
import { mechanics } from '../mechanics/registry.ts';
import './app.css';

type View = { name: 'home' } | { name: 'osmosis' };

export default function App() {
  const [view, setView] = useState<View>({ name: 'home' });
  return (
    <AudioProvider>
      <div className="shell">
        <Header onHome={() => setView({ name: 'home' })} showHome={view.name !== 'home'} />
        <main className="shell__main">
          {view.name === 'home' ? <Home onPlay={() => setView({ name: 'osmosis' })} /> : <OsmosisSession />}
        </main>
      </div>
    </AudioProvider>
  );
}

function Header({ onHome, showHome }: { onHome: () => void; showHome: boolean }) {
  return (
    <header className="shell__header">
      <button className="shell__brand" onClick={onHome} disabled={!showHome}>
        Oda <span>· Inglés I</span>
      </button>
      {showHome && (
        <button className="shell__back" onClick={onHome}>
          ← Volver
        </button>
      )}
    </header>
  );
}

function Home({ onPlay }: { onPlay: () => void }) {
  const unit = units[0]!;
  const coverage = audioCoverage();
  const pool = atoms.filter((a) => osmosis.accepts(a));

  return (
    <div className="home">
      <section className="home__unit">
        <p className="home__eyebrow">Unidad {unit.unit}</p>
        <h1>{unit.title}</h1>
        <ul className="home__goals">
          {unit.goals.map((g) => (
            <li key={g}>{g}</li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="home__section">Entrenamiento</h2>
        <div className="home__mechanics">
          {mechanics.map((m) => (
            <button key={m.id} className="card" onClick={onPlay} disabled={pool.length < m.minAtoms}>
              <div className="card__top">
                <span className="card__level">Nivel {m.level}</span>
                <span className="card__skill">{m.skill}</span>
              </div>
              <h3>{m.name}</h3>
              <p>{m.blurb}</p>
              <span className="card__count">{pool.length} frases disponibles</span>
            </button>
          ))}
        </div>
      </section>

      <footer className="home__status">
        <span>
          {atoms.length} átomos · {coverage.withFile}/{coverage.total} con audio pregenerado
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

function OsmosisSession() {
  const pool = useMemo(() => atoms.filter((a) => osmosis.accepts(a)), []);
  const [seed, setSeed] = useState(0);
  const round = useMemo(() => osmosis.buildRound(pool), [pool, seed]);

  if (!round) {
    return <p className="empty">No hay suficientes frases para armar una ronda.</p>;
  }
  return <OsmosisView round={round} onNext={() => setSeed((s) => s + 1)} />;
}
