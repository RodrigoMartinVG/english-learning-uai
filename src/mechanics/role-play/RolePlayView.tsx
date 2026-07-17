import { useCallback, useEffect, useRef, useState } from 'react';
import { useAudio } from '../../audio/AudioProvider.tsx';
import { SpeakPanel } from '../../ui/SpeakPanel.tsx';
import { speakerById } from '../../data/content.ts';
import type { MechanicViewProps } from '../types.ts';
import type { RolePlayRound } from './mechanic.ts';
import './role-play.css';

export function RolePlayView({ round, onDone }: MechanicViewProps<RolePlayRound>) {
  const audio = useAudio();
  const [i, setI] = useState(0);
  const [ok, setOk] = useState<boolean[]>([]);
  const log = useRef<HTMLDivElement>(null);

  const me = speakerById.get(round.myRole);
  const partner = speakerById.get(round.partner);
  const turn = round.turns[i];
  const done = i >= round.turns.length;

  const say = useCallback(
    (id: string, text: string, speakerId: string) => audio.speak({ key: id, text, speakerId }),
    [audio]
  );

  // Los turnos del otro se reproducen solos: es una conversación, no una lista.
  useEffect(() => {
    if (!turn || turn.mine) return;
    void say(turn.phrase.id, turn.phrase.text, turn.speaker).then(() => setI((n) => n + 1));
  }, [turn, say]);

  useEffect(() => {
    log.current?.scrollTo({ top: log.current.scrollHeight, behavior: 'smooth' });
  }, [i]);

  useEffect(() => () => audio.cancel(), [audio]);

  return (
    <div className="rp">
      <div className="rp__head">
        <p className="rp__title">{round.dialogue.title}</p>
        <p className="rp__situation">{round.dialogue.situation}</p>
        <p className="rp__role">
          Sos <strong>{me?.displayName ?? round.myRole}</strong> · habla{' '}
          {partner?.displayName ?? round.partner}
        </p>
      </div>

      <div className="rp__log" ref={log}>
        {round.turns.slice(0, i).map((t, k) => (
          <div key={k} className={'rp__turn' + (t.mine ? ' rp__turn--mine' : '')}>
            <span className="rp__who">{speakerById.get(t.speaker)?.displayName ?? t.speaker}</span>
            <button
              className="rp__line"
              onClick={() => void say(t.phrase.id, t.phrase.text, t.speaker)}
              aria-label={`Escuchar: ${t.phrase.text}`}
            >
              {t.phrase.text}
            </button>
          </div>
        ))}
        {turn && !turn.mine && (
          <div className="rp__turn">
            <span className="rp__who">{partner?.displayName ?? round.partner}</span>
            <span className="rp__line rp__line--live">…</span>
          </div>
        )}
      </div>

      {turn && turn.mine && (
        <div className="rp__mine">
          {/* Tu línea SÍ se muestra: es role-play guiado, no improvisación.
              La improvisación sin guion es el Examen oral. */}
          <p className="rp__cue">{turn.phrase.text}</p>
          <SpeakPanel
            key={i}
            targets={[turn.phrase.text]}
            neighbourhood={round.neighbourhood}
            lang={me?.accent ?? 'en-US'}
            onPlayReference={() => void say(turn.phrase.id, turn.phrase.text, turn.speaker)}
            onDone={(correct) => {
              setOk((r) => [...r, correct]);
              setI((n) => n + 1);
            }}
          />
        </div>
      )}

      {done && (
        <div className="expansion">
          <p className="verdict verdict--ok">Conversación completa</p>
          <p className="expansion__gloss">
            {ok.filter(Boolean).length} de {ok.length} de tus líneas salieron como el guion.
          </p>
          <button
            className="btn btn--primary btn--wide"
            onClick={() => onDone(ok.filter(Boolean).length >= Math.ceil(ok.length / 2))}
            autoFocus
          >
            Siguiente →
          </button>
        </div>
      )}
    </div>
  );
}
