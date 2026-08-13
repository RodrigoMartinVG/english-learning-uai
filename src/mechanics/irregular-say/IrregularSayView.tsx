import { useCallback, useEffect } from 'react';
import { useAudio } from '../../audio/AudioProvider.tsx';
import { SpeakPanel } from '../../ui/SpeakPanel.tsx';
import type { MechanicViewProps } from '../types.ts';
import type { IrregularSayRound } from './mechanic.ts';
import '../irregular-verbs/irregular.css';

export function IrregularSayView({ round, onDone }: MechanicViewProps<IrregularSayRound>) {
  const audio = useAudio();

  /** La referencia se oye forma por forma, con su pausa: es el ritmo con que se recita. */
  const playAll = useCallback(async () => {
    for (const [key, text] of [
      [round.keys.base, round.base],
      [round.keys.past, round.past],
      [round.keys.participle, round.participle],
    ] as const) {
      const r = await audio.speak({ key, text, speakerId: round.speakerId });
      if (r === 'interrupted') return;
    }
  }, [audio, round]);

  useEffect(() => {
    void playAll();
    return () => audio.cancel();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round]);

  return (
    <div className="cz exlr">
      <div className="osmosis__stage">
        <p className="cz__stem">Decí las tres formas, de corrido:</p>
        <div className="irr__row">
          <span className="irr__form">{round.base}</span>
          <span className="irr__sep">·</span>
          <span className="irr__form">{round.past}</span>
          <span className="irr__sep">·</span>
          <span className="irr__form">{round.participle}</span>
        </div>
        <p className="osmosis__hint">{round.gloss}</p>
        <div className="osmosis__controls">
          <button className="btn btn--primary" onClick={() => void playAll()}>
            ▶ Escuchar las tres
          </button>
        </div>
        {/* El caso que justifica este modo: mismas letras, distinto sonido. */}
        {round.base === round.past && (
          <p className="osmosis__hint">
            Ojo: se escriben igual pero <strong>no suenan igual</strong>. Escuchá antes de decirlo.
          </p>
        )}
      </div>

      <div className="exlr__panel">
        <SpeakPanel
          targets={[round.target]}
          neighbourhood={[round.base, round.past, round.participle]}
          lang="en-US"
          onPlayReference={() => void playAll()}
          onDone={onDone}
        />
      </div>
    </div>
  );
}
