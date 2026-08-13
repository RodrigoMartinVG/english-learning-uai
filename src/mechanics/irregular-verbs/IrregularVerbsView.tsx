import { useEffect, useRef, useState } from 'react';
import { useAudio, useAudioState } from '../../audio/AudioProvider.tsx';
import { Waveform } from '../../ui/Waveform.tsx';
import type { MechanicViewProps } from '../types.ts';
import type { IrregularRound, VerbForm } from './mechanic.ts';
import './irregular.css';

const tidy = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ');

const PATTERN: Record<IrregularRound['pattern'], string> = {
  same: 'A-A-A · las tres formas iguales (cut, put, read)',
  aba: 'A-B-A · base = participio (come/came/come)',
  abb: 'A-B-B · pasado = participio (buy/bought/bought)',
  vowel: 'i-a-u · cambia la vocal (sing/sang/sung)',
  other: 'irregular · sin patrón simple',
};

const LABEL: Record<VerbForm, string> = {
  base: 'infinitivo',
  past: 'pasado (past simple)',
  participle: 'participio (past participle)',
};

export function IrregularVerbsView({ round, onDone }: MechanicViewProps<IrregularRound>) {
  const audio = useAudio();
  const state = useAudioState();

  // Las dos que hay que producir, en el orden natural de la enumeración.
  const pedidas: VerbForm[] = (['base', 'past', 'participle'] as VerbForm[]).filter((f) => f !== round.given);
  const esperado: Record<VerbForm, string> = {
    base: round.base,
    past: round.past,
    participle: round.participle,
  };
  const mostrada = esperado[round.given];

  const [vals, setVals] = useState<Record<string, string>>({});
  const [checked, setChecked] = useState<null | Record<string, boolean>>(null);
  // Corregir tras fallar (viendo la respuesta) no cuenta como acierto: se graba repaso.
  const [failed, setFailed] = useState(false);
  const firstRef = useRef<HTMLInputElement>(null);

  const play = () => void audio.speak({ key: round.audioKey, text: mostrada, speakerId: round.speakerId });

  useEffect(() => {
    setVals({}); setChecked(null); setFailed(false);
    play();
    firstRef.current?.focus();
    return () => audio.cancel();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round]);

  const check = () => {
    audio.cancel();
    const r: Record<string, boolean> = {};
    for (const f of pedidas) r[f] = tidy(vals[f] ?? '') === tidy(esperado[f]);
    setChecked(r);
    if (!pedidas.every((f) => r[f])) setFailed(true);
  };
  const ok = checked ? pedidas.every((f) => checked[f]) : false;
  const completo = pedidas.every((f) => (vals[f] ?? '').trim());

  return (
    <div className="cz exlr">
      <div className="osmosis__stage">
        <Waveform active={state === 'speaking'} />
        <div className="osmosis__controls">
          <button className="btn btn--primary" onClick={play}>
            {state === 'speaking' ? '◼ Sonando' : '▶ Escuchar'}
          </button>
        </div>
        {/* Se nombra QUÉ forma es la que se muestra: sin eso, arrancar por el pasado
            se lee como si fuera el infinitivo. */}
        <p className="osmosis__hint">{LABEL[round.given]}</p>
        <p className="wf__word" style={{ fontSize: '1.6rem' }}>{mostrada}</p>
        <p className="osmosis__hint">{round.gloss}</p>
        {/* El patrón se revela DESPUÉS de responder. Antes regala el ejercicio: con
            A-A-A dice "las tres formas iguales" y con A-B-B "pasado = participio",
            que son 75 de los 155 verbos. Como feedback enseña la familia; como pista
            previa, la desactiva. */}
        {checked !== null && <p className="osmosis__hint">Patrón: {PATTERN[round.pattern]}</p>}
      </div>

      <div className="exlr__panel">
        <p className="cz__stem">
          {round.given === 'base' ? 'Pasado y participio' : 'Infinitivo y participio'} de{' '}
          <strong>{mostrada}</strong>:
        </p>
        {pedidas.map((f, i) => (
          <input
            key={f}
            ref={i === 0 ? firstRef : undefined}
            id={`irr-${f}`}
            className={'dict__input' + (checked && !checked[f] ? ' cz__slot--bad' : '')}
            value={vals[f] ?? ''}
            onChange={(e) => setVals({ ...vals, [f]: e.target.value })}
            onKeyDown={(e) => {
              if (e.key !== 'Enter' || e.repeat) return;
              e.preventDefault();
              if (i === 0) { document.getElementById(`irr-${pedidas[1]}`)?.focus(); return; }
              if (checked === null) { if (completo) check(); } else { onDone(ok && !failed); }
            }}
            readOnly={checked !== null}
            placeholder={`${LABEL[f]}…`}
            aria-label={LABEL[f]}
            autoComplete="off" autoCapitalize="off" spellCheck={false}
          />
        ))}

        {checked === null ? (
          <button className="btn btn--primary btn--wide" onClick={check} disabled={!completo}>
            Comprobar
          </button>
        ) : (
          <div className="expansion">
            <p className={'verdict ' + (ok ? 'verdict--ok' : 'verdict--bad')}>
              {ok ? '¡Bien!' : 'Revisá las formas'}
            </p>
            {!ok && (
              <p className="dict__diff">
                <span className="dict__label">Era</span>{' '}
                <strong>{round.base} · {round.past} · {round.participle}</strong>
              </p>
            )}
            {ok && failed && (
              <p className="retry-note">Lo corregiste después de fallar — se repasará pronto.</p>
            )}
            <div className="ab">
              <button className="btn" onClick={() => { setVals({}); setChecked(null); firstRef.current?.focus(); }}>
                ↻ Reintentar
              </button>
              <button className="btn" onClick={play}>🔊 Escuchar</button>
              <button className="btn btn--primary" onClick={() => onDone(ok && !failed)} autoFocus>
                Siguiente →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
