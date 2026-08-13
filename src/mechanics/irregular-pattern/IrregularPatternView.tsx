import { useEffect, useState } from 'react';
import { useAudio } from '../../audio/AudioProvider.tsx';
import type { MechanicViewProps } from '../types.ts';
import type { IrregularPatternRound, Pattern } from './mechanic.ts';
import '../irregular-verbs/irregular.css';

const INFO: Record<Pattern, { title: string; hint: string }> = {
  same: { title: 'A-A-A', hint: 'las tres iguales — cut, put, cost' },
  aba: { title: 'A-B-A', hint: 'vuelve a la base — come, came, come' },
  abb: { title: 'A-B-B', hint: 'pasado = participio — buy, bought, bought' },
  vowel: { title: 'i-a-u', hint: 'cambia la vocal — sing, sang, sung' },
  other: { title: 'sin patrón', hint: 'las tres distintas — go, went, gone' },
};

export function IrregularPatternView({ round, onDone }: MechanicViewProps<IrregularPatternRound>) {
  const audio = useAudio();
  const [pick, setPick] = useState<Pattern | null>(null);

  useEffect(() => {
    setPick(null);
    void audio.speak({ key: round.audioKey, text: round.base, speakerId: round.speakerId });
    return () => audio.cancel();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round]);

  const ok = pick === round.correct;

  return (
    <div className="cz">
      <p className="cz__stem">¿A qué familia pertenece este verbo?</p>

      <div className="irr__row">
        <span className="irr__form">{round.base}</span>
        <span className="irr__sep">·</span>
        <span className="irr__form">{round.past}</span>
        <span className="irr__sep">·</span>
        <span className="irr__form">{round.participle}</span>
      </div>
      <p className="osmosis__hint">{round.gloss}</p>

      {/* Estilo propio y no el de los pares mínimos: aquel está pensado para dos
          opciones en fila y con cinco se atropellan. */}
      <div className="irr__opts">
        {round.options.map((p) => {
          const elegida = pick === p;
          const esCorrecta = p === round.correct;
          const cls = pick === null ? '' : esCorrecta ? ' irr__opt--ok' : elegida ? ' irr__opt--bad' : ' irr__opt--off';
          return (
            <button
              key={p}
              className={'irr__opt' + cls}
              onClick={() => pick === null && setPick(p)}
              disabled={pick !== null}
            >
              <span className="irr__opt-title">{INFO[p].title}</span>
              <span className="irr__opt-hint">{INFO[p].hint}</span>
            </button>
          );
        })}
      </div>

      {pick !== null && (
        <div className="expansion">
          <p className={'verdict ' + (ok ? 'verdict--ok' : 'verdict--bad')}>
            {ok ? '¡Bien!' : `Es ${INFO[round.correct].title}: ${INFO[round.correct].hint}`}
          </p>
          <button className="btn btn--primary btn--wide" onClick={() => onDone(ok)} autoFocus>
            Siguiente →
          </button>
        </div>
      )}
    </div>
  );
}
