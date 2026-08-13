import { useEffect, useRef, useState } from 'react';
import { useAudio } from '../../audio/AudioProvider.tsx';
import type { MechanicViewProps } from '../types.ts';
import type { IrregularGapRound } from './mechanic.ts';
import '../irregular-verbs/irregular.css';

const tidy = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ');

export function IrregularGapView({ round, onDone }: MechanicViewProps<IrregularGapRound>) {
  const audio = useAudio();
  const [val, setVal] = useState('');
  const [checked, setChecked] = useState<boolean | null>(null);
  const [failed, setFailed] = useState(false);
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setVal(''); setChecked(null); setFailed(false);
    ref.current?.focus();
    return () => audio.cancel();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round]);

  const check = () => {
    const ok = tidy(val) === tidy(round.answer);
    setChecked(ok);
    if (!ok) setFailed(true);
    // El audio de la forma se oye recién con la respuesta a la vista: antes sería la pista.
    void audio.speak({ key: round.audioKey, text: round.answer, speakerId: round.speakerId });
  };

  /** Las tres formas en fila; la que falta es el input. */
  const celda = (form: 'base' | 'past' | 'participle', texto: string) => {
    if (round.missing !== form) return <span className="irr__form">{texto}</span>;
    return (
      <input
        ref={ref}
        className={'dict__input irr__slot' + (checked === false ? ' cz__slot--bad' : '')}
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onKeyDown={(e) => {
          if (e.key !== 'Enter' || e.repeat) return;
          e.preventDefault();
          if (checked === null) { if (val.trim()) check(); } else { onDone(checked && !failed); }
        }}
        readOnly={checked !== null}
        placeholder="?"
        aria-label="La forma que falta"
        autoComplete="off" autoCapitalize="off" spellCheck={false}
      />
    );
  };

  return (
    <div className="cz">
      <p className="cz__stem">Completá la forma que falta:</p>
      <p className="osmosis__hint">{round.gloss}</p>

      <div className="irr__row">
        {celda('base', round.base)}
        <span className="irr__sep">·</span>
        {celda('past', round.past)}
        <span className="irr__sep">·</span>
        {celda('participle', round.participle)}
      </div>

      {checked === null ? (
        <button className="btn btn--primary btn--wide" onClick={check} disabled={!val.trim()}>
          Comprobar
        </button>
      ) : (
        <div className="expansion">
          <p className={'verdict ' + (checked ? 'verdict--ok' : 'verdict--bad')}>
            {checked ? '¡Bien!' : `Era ${round.answer}`}
          </p>
          {checked && failed && (
            <p className="retry-note">Lo corregiste después de fallar — se repasará pronto.</p>
          )}
          <div className="ab">
            <button className="btn" onClick={() => void audio.speak({ key: round.audioKey, text: round.answer, speakerId: round.speakerId })}>
              🔊 Escuchar
            </button>
            <button className="btn btn--primary" onClick={() => onDone(checked && !failed)} autoFocus>
              Siguiente →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
