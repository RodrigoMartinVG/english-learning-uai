import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAudio } from '../../audio/AudioProvider.tsx';
import { played } from '../../audio/AudioService.ts';
import { SpeakPanel } from '../../ui/SpeakPanel.tsx';
import { LiveDictation } from '../../ui/LiveDictation.tsx';
import { contentWords } from '../../engine/grading/speech.ts';
import { speakerById } from '../../data/content.ts';
import type { MechanicViewProps } from '../types.ts';
import type { RolePlayRound } from './mechanic.ts';
import './role-play.css';

export function RolePlayView({ round, onDone }: MechanicViewProps<RolePlayRound>) {
  const audio = useAudio();
  const [i, setI] = useState(0);
  const [ok, setOk] = useState<boolean[]>([]);
  const [improv, setImprov] = useState(false);
  const [didImprov, setDidImprov] = useState(false);
  const log = useRef<HTMLDivElement>(null);
  // Vocabulario del diálogo, para el verde cuando improvisás.
  const expected = useMemo(() => contentWords(round.neighbourhood.join(' ')), [round]);

  const me = speakerById.get(round.myRole);
  const partner = speakerById.get(round.partner);
  const turn = round.turns[i];
  const done = i >= round.turns.length;

  const say = useCallback(
    (id: string, text: string, speakerId: string) => audio.speak({ key: id, text, speakerId }),
    [audio]
  );

  /**
   * Los turnos del otro se reproducen solos: es una conversación, no una lista.
   *
   * Dos guardas, y las dos hacen falta:
   *  · `played(r)` — avanzar solo si el audio SONÓ ENTERO. Antes se avanzaba
   *    también cuando lo cancelaban, y el diálogo se comía un turno.
   *  · `alive` — el cleanup de React. StrictMode corre el efecto dos veces en
   *    desarrollo: sin esto, la primera ejecución (ya cancelada) igual avanzaba.
   */
  useEffect(() => {
    if (!turn || turn.mine) return;
    let alive = true;
    const at = i;
    void say(turn.phrase.id, turn.phrase.text, turn.speaker).then((r) => {
      if (alive && played(r)) setI((n) => (n === at ? n + 1 : n));
    });
    return () => {
      alive = false;
    };
  }, [turn, say, i]);

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
        <label className="rp__toggle">
          <input type="checkbox" checked={improv} onChange={(e) => setImprov(e.target.checked)} />
          <span>
            Improvisar mis turnos <em>— respondé con tus palabras; se transcribe en vivo</em>
          </span>
        </label>
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
          {improv ? (
            <>
              {/* Improvisás: respondés con tus palabras. La línea del guion queda como
                  pista opcional, no como objetivo. */}
              <details className="rp__peek">
                <summary>Ver la línea sugerida</summary>
                <p className="rp__cue">{turn.phrase.text}</p>
              </details>
              <LiveDictation
                key={i}
                expected={expected}
                lang={me?.accent ?? 'en-US'}
                onDone={(r) => {
                  r.recording?.revoke();
                  setDidImprov(true);
                  setOk((o) => [...o, true]);
                  setI((n) => n + 1);
                }}
              />
            </>
          ) : (
            <>
              {/* Guiado: tu línea se muestra y se coteja contra el guion. */}
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
            </>
          )}
        </div>
      )}

      {done && (
        <div className="expansion">
          <p className="verdict verdict--ok">Conversación completa</p>
          <p className="expansion__gloss">
            {didImprov
              ? 'Improvisaste tus turnos y sostuviste la conversación.'
              : `${ok.filter(Boolean).length} de ${ok.length} de tus líneas salieron como el guion.`}
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
