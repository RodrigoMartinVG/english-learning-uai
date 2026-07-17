/**
 * SessionPlayer — corre una sesión: 12 pasos, progreso visible, cierre.
 *
 * Es lo que convierte a las mecánicas en pasos. El player no sabe qué hace cada
 * mecánica: le pide una ronda al registro y espera el `onDone`.
 */

import { useMemo, useState } from 'react';
import { atomById, atoms } from '../data/content.ts';
import { mechanicById } from '../mechanics/registry.ts';
import { views } from '../mechanics/views.tsx';
import type { Session } from '../engine/session.ts';
import './session.css';

interface Result {
  step: number;
  correct: boolean;
}

export function SessionPlayer({ session, onExit }: { session: Session; onExit: () => void }) {
  const [i, setI] = useState(0);
  const [results, setResults] = useState<Result[]>([]);

  const step = session.steps[i];
  const mechanic = step ? mechanicById.get(step.mechanicId) : undefined;
  const View = step ? views[step.mechanicId] : undefined;
  const target = step ? atomById.get(step.atomId) : undefined;

  const round = useMemo(() => {
    if (!mechanic || !target) return null;
    return mechanic.buildRound(target, atoms, step?.variant);
  }, [mechanic, target, step?.variant]);

  if (!step || !mechanic || !View || !target) {
    return <Summary session={session} results={results} onExit={onExit} />;
  }

  // Si una ronda no se puede armar, se saltea sin romper la sesión. Pero no en
  // silencio: el resumen final lo cuenta.
  if (!round) {
    setI((n) => n + 1);
    return null;
  }

  const done = (correct: boolean) => {
    setResults((r) => [...r, { step: i, correct }]);
    setI((n) => n + 1);
  };

  return (
    <div className="session">
      <header className="session__bar">
        <div className="session__meta">
          <span className="session__title">{session.title}</span>
          <span className="session__mech">{mechanic.name}</span>
        </div>
        <span className="session__count">
          {i + 1} / {session.steps.length}
        </span>
      </header>
      <div className="session__progress" role="progressbar" aria-valuenow={i} aria-valuemax={session.steps.length}>
        <div style={{ width: `${(i / session.steps.length) * 100}%` }} />
      </div>

      {/* key: fuerza el remount por paso, así ninguna mecánica arrastra estado.
          Incluye la variante: el mismo diálogo con otro papel es otro ejercicio. */}
      <View key={`${step.mechanicId}:${step.atomId}:${step.variant ?? ''}:${i}`} round={round} onDone={done} />
    </div>
  );
}

function Summary({
  session,
  results,
  onExit,
}: {
  session: Session;
  results: Result[];
  onExit: () => void;
}) {
  const ok = results.filter((r) => r.correct).length;
  const total = results.length;
  const pct = total ? Math.round((ok / total) * 100) : 0;

  return (
    <div className="summary">
      <p className="summary__eyebrow">{session.title}</p>
      <h1>
        {ok} de {total}
      </h1>
      <div className="summary__bar">
        <div style={{ width: `${pct}%` }} />
      </div>
      <p className="summary__note">
        {/* Sin gamificación de vanidad: ni rachas ni confeti. Un dato y qué hacer con él. */}
        {pct >= 80
          ? 'Sólido. Este material vuelve en unos días para fijarlo.'
          : pct >= 50
            ? 'Va tomando forma. Lo que fallaste vuelve pronto.'
            : 'Cuesta todavía. Repetí esta sesión: es la forma más rápida.'}
      </p>
      <button className="btn btn--primary btn--wide" onClick={onExit} autoFocus>
        Volver
      </button>
    </div>
  );
}
