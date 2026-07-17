/**
 * ReferenceView — la "Guía de expresiones" + "Scripts modelo" de una unidad.
 *
 * Es referencia, no práctica: el alumno navega para ver las distintas formas de
 * decir cada cosa (por objetivo comunicativo) y los textos modelo largos con sus
 * versiones. Todo con audio. Ver `src/data/reference.ts` (derivación) y la
 * decisión "las dos cosas juntas, derivado + enriquecido".
 */

import { useMemo, useState } from 'react';
import { useAudio } from '../audio/AudioProvider.tsx';
import { atoms as allAtoms } from '../data/content.ts';
import { expressionGuide, modelScripts } from '../data/reference.ts';
import type { UnitFile } from '../../content/schema.ts';
import './reference.css';

export function ReferenceView({ unit, onBack }: { unit: UnitFile; onBack: () => void }) {
  const audio = useAudio();
  const unitAtoms = useMemo(
    () => allAtoms.filter((a) => a.course === unit.course && a.unit === unit.unit),
    [unit]
  );
  const guide = useMemo(() => expressionGuide(unitAtoms), [unitAtoms]);
  const scripts = useMemo(() => modelScripts(unitAtoms), [unitAtoms]);

  const say = (text: string, key?: string, speakerId?: string) =>
    void audio.speak({ key: key ?? 'ref', text, speakerId: speakerId ?? 'narrator' });

  const [tab, setTab] = useState<'guide' | 'scripts'>('guide');

  return (
    <div className="ref">
      <p className="home__eyebrow">Unidad {unit.unit} · Referencia</p>
      <h1>Cómo decir las cosas</h1>
      <p className="ref__intro">
        Las distintas formas de expresar cada objetivo de la unidad. Tocá cualquiera para
        escucharla.
      </p>

      <div className="ref__tabs">
        <button className={'ref__tab' + (tab === 'guide' ? ' ref__tab--on' : '')} onClick={() => setTab('guide')}>
          Guía de expresiones
        </button>
        <button className={'ref__tab' + (tab === 'scripts' ? ' ref__tab--on' : '')} onClick={() => setTab('scripts')}>
          Scripts modelo
        </button>
      </div>

      {tab === 'guide' && (
        <div className="ref__guide">
          {guide.map((g) => (
            <section key={g.fn} className="ref__group">
              <h2>{g.label}</h2>
              <ul className="ref__lines">
                {g.says.map((e) => (
                  <li key={e.text}>
                    <button className="ref__line" onClick={() => say(e.text, e.audioKey, e.speakerId)}>
                      <span aria-hidden="true">🔊</span> {e.text}
                    </button>
                  </li>
                ))}
              </ul>
              {g.replies.length > 0 && (
                <>
                  <p className="ref__sublabel">Respuestas naturales</p>
                  <ul className="ref__lines">
                    {g.replies.map((r) => (
                      <li key={r}>
                        <button className="ref__line ref__line--reply" onClick={() => say(r)}>
                          <span aria-hidden="true">🔊</span> {r}
                        </button>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </section>
          ))}
        </div>
      )}

      {tab === 'scripts' && (
        <div className="ref__scripts">
          {scripts.map((s) => (
            <section key={s.id} className="ref__script">
              <h2>{s.title}</h2>
              <p className="ref__prompt">{s.prompt}</p>
              {s.versions.map((v, i) => (
                <div key={i} className="ref__version">
                  <div className="ref__version-head">
                    <span>Versión {String.fromCharCode(65 + i)}</span>
                    <button className="ref__play" onClick={() => say(v.text, v.audioKey, s.speakerId)}>
                      🔊 Escuchar
                    </button>
                  </div>
                  <p className="ref__model">{v.text}</p>
                </div>
              ))}
            </section>
          ))}
        </div>
      )}

      <button className="btn btn--wide" onClick={onBack}>
        ← Volver
      </button>
    </div>
  );
}
