import { useEffect, useRef, useState } from 'react';
import { useAudio, useAudioState } from '../../audio/AudioProvider.tsx';
import { Waveform } from '../../ui/Waveform.tsx';
import type { MechanicViewProps } from '../types.ts';
import type { IrregularRound } from './mechanic.ts';

const tidy = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ');

const PATTERN: Record<IrregularRound['pattern'], string> = {
  same: 'A-A-A · las tres formas iguales (cut, put, read)',
  aba: 'A-B-A · base = participio (come/came/come)',
  abb: 'A-B-B · pasado = participio (buy/bought/bought)',
  vowel: 'i-a-u · cambia la vocal (sing/sang/sung)',
  other: 'irregular · sin patrón simple',
};

export function IrregularVerbsView({ round, onDone }: MechanicViewProps<IrregularRound>) {
  const audio = useAudio();
  const state = useAudioState();
  const [past, setPast] = useState('');
  const [part, setPart] = useState('');
  const [checked, setChecked] = useState<null | { past: boolean; part: boolean }>(null);
  // Corregir tras fallar (viendo la respuesta) no cuenta como acierto: se graba repaso.
  const [failed, setFailed] = useState(false);
  const pastRef = useRef<HTMLInputElement>(null);

  const play = () => void audio.speak({ key: round.audioKey, text: round.base, speakerId: round.speakerId });

  useEffect(() => {
    setPast(''); setPart(''); setChecked(null); setFailed(false);
    play();
    pastRef.current?.focus();
    return () => audio.cancel();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round]);

  const check = () => {
    audio.cancel();
    const r = { past: tidy(past) === tidy(round.past), part: tidy(part) === tidy(round.participle) };
    setChecked(r);
    if (!(r.past && r.part)) setFailed(true);
  };
  const ok = checked ? checked.past && checked.part : false;

  return (
    <div className="cz exlr">
      <div className="osmosis__stage">
        <Waveform active={state === 'speaking'} />
        <div className="osmosis__controls">
          <button className="btn btn--primary" onClick={play}>
            {state === 'speaking' ? '◼ Sonando' : '▶ Escuchar'}
          </button>
        </div>
        <p className="wf__word" style={{ fontSize: '1.6rem' }}>{round.base}</p>
        <p className="osmosis__hint">{round.gloss}</p>
        <p className="osmosis__hint">Patrón: {PATTERN[round.pattern]}</p>
      </div>

      <div className="exlr__panel">
        <p className="cz__stem">
          Pasado y participio de <strong>{round.base}</strong>:
        </p>
        <input
          ref={pastRef}
          className={'dict__input' + (checked && !checked.past ? ' cz__slot--bad' : '')}
          value={past}
          onChange={(e) => setPast(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.repeat) { e.preventDefault(); document.getElementById('irr-part')?.focus(); } }}
          readOnly={checked !== null}
          placeholder="pasado (past simple)…"
          aria-label="Pasado" autoComplete="off" autoCapitalize="off" spellCheck={false}
        />
        <input
          id="irr-part"
          className={'dict__input' + (checked && !checked.part ? ' cz__slot--bad' : '')}
          value={part}
          onChange={(e) => setPart(e.target.value)}
          onKeyDown={(e) => {
            if (e.key !== 'Enter' || e.repeat) return;
            e.preventDefault();
            if (checked === null) { if (past.trim() && part.trim()) check(); } else { onDone(ok && !failed); }
          }}
          readOnly={checked !== null}
          placeholder="participio (past participle)…"
          aria-label="Participio" autoComplete="off" autoCapitalize="off" spellCheck={false}
        />

        {checked === null ? (
          <button className="btn btn--primary btn--wide" onClick={check} disabled={!past.trim() || !part.trim()}>
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
              <button
                className="btn"
                onClick={() => { setPast(''); setPart(''); setChecked(null); pastRef.current?.focus(); }}
              >
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
