/**
 * ResetPanel — borrar progreso, total o por unidad.
 *
 * El borrado es destructivo y no hay servidor que lo respalde: por eso cada
 * acción pide confirmación explícita y hay un "Exportar" arriba de todo. El
 * progreso es del alumno; que se lo pueda llevar antes de tirarlo.
 */

import { useState } from 'react';
import { units } from '../data/content.ts';
import { exportProgress, resetProgress, statsFor, type ResetScope } from '../data/progress.ts';

export function ResetPanel({ onBack }: { onBack: () => void }) {
  const [pending, setPending] = useState<ResetScope | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const doReset = (scope: ResetScope) => {
    const n = resetProgress(scope);
    setPending(null);
    setMessage(n === 0 ? 'No había progreso que borrar.' : `Se borraron ${n} tarjeta(s).`);
  };

  const download = () => {
    const blob = new Blob([exportProgress()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `oda-progreso-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const label = (s: ResetScope) =>
    s.kind === 'all' ? 'TODO el progreso' : s.kind === 'unit' ? `la Unidad ${s.unit}` : 'esto';

  return (
    <div className="reset">
      <p className="home__eyebrow">Progreso</p>
      <h1>Borrar progreso</h1>

      {message && <p className="reset__msg">{message}</p>}

      <button className="btn btn--wide" onClick={download}>
        ⬇ Exportar antes de borrar
      </button>

      <section className="reset__group">
        <h2 className="home__section">Por unidad</h2>
        {units.map((u) => {
          const p = statsFor(`${u.course}.u${u.unit}`);
          return (
            <div key={u.unit} className="reset__row">
              <span>
                Unidad {u.unit} · {u.title}
                <em> {p.seen} tarjeta(s)</em>
              </span>
              <button
                className="btn"
                disabled={p.seen === 0}
                onClick={() => setPending({ kind: 'unit', course: u.course, unit: u.unit })}
              >
                Borrar
              </button>
            </div>
          );
        })}
      </section>

      <section className="reset__group">
        <button className="btn reset__danger" onClick={() => setPending({ kind: 'all' })}>
          Borrar todo el progreso
        </button>
      </section>

      <button className="btn btn--wide" onClick={onBack}>
        ← Volver
      </button>

      {pending && (
        <div className="reset__confirm" role="alertdialog" aria-modal="true">
          <div className="reset__dialog">
            <p>
              ¿Seguro? Vas a borrar <strong>{label(pending)}</strong>. No se puede deshacer.
            </p>
            <div className="ab">
              <button className="btn" onClick={() => setPending(null)}>
                Cancelar
              </button>
              <button className="btn reset__danger" onClick={() => doReset(pending)}>
                Sí, borrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
