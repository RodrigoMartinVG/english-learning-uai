import { useCallback, useEffect, useState } from 'react';
import { useAudio, useAudioState } from '../../audio/AudioProvider.tsx';
import { Waveform } from '../../ui/Waveform.tsx';
import { AltVoices } from '../../ui/AltVoices.tsx';
import { SpeakPanel } from '../../ui/SpeakPanel.tsx';
import { ModedAnswers } from '../../ui/ModedAnswers.tsx';
import { speakerById } from '../../data/content.ts';
import type { MechanicViewProps } from '../types.ts';
import type { PingPongRound } from './mechanic.ts';

export function PingPongView({ round, onDone }: MechanicViewProps<PingPongRound>) {
  const audio = useAudio();
  const state = useAudioState();
  const [peek, setPeek] = useState(false);
  const { target } = round;
  const asker = speakerById.get(target.speaker);

  const ask = useCallback(
    () => void audio.speak({ key: target.id, text: target.prompt, speakerId: target.speaker }),
    [audio, target]
  );
  const say = (text: string, key: string, speakerId: string) =>
    void audio.speak({ key, text, speakerId });

  useEffect(() => {
    setPeek(false);
    ask();
    return () => audio.cancel();
  }, [ask, audio]);

  return (
    <div className="osmosis exlr">
      <div className="osmosis__stage">
        <Waveform active={state === 'speaking'} />
        {/* La pregunta NO se muestra: en un final oral el examinador no te la escribe. */}
        <div className="osmosis__controls">
          <button className="btn btn--primary" onClick={ask}>
            {state === 'speaking' ? '◼ Preguntando' : '▶ Repetir pregunta'}
          </button>
        </div>
        <AltVoices audioKey={target.id} text={target.prompt} speakerId={target.speaker} />
        <p className="osmosis__hint">
          Te pregunta <strong>{asker?.displayName ?? target.speaker}</strong>. Contestá en voz alta.
        </p>
      </div>

      <div className="exlr__panel">
      <SpeakPanel
        targets={round.accepted}
        neighbourhood={round.neighbourhood}
        lang={asker?.accent ?? 'en-US'}
        onPlayReference={() =>
          void audio.speak({
            key: `${target.id}.reply.0`,
            text: round.accepted[0]!,
            speakerId: target.replySpeaker,
          })
        }
        onDone={onDone}
      />

      {/* Rendirse es legítimo, pero explícito: si se lo damos gratis, no produce. */}
      {!peek ? (
        <button className="btn" onClick={() => setPeek(true)}>
          No me sale — mostrar pregunta y respuestas
        </button>
      ) : (
        <div className="expansion">
          {/* La pregunta y sus otras formas, cada una con su audio. */}
          <p className="ref__sublabel">La pregunta (y otras formas de preguntarla)</p>
          <ul className="ref__lines">
            <li>
              <button className="ref__line" onClick={() => say(target.prompt, target.id, target.speaker)}>
                <span aria-hidden="true">🔊</span> {target.prompt}
              </button>
            </li>
            {target.promptVariants.map((v, i) => (
              <li key={i}>
                <button className="ref__line" onClick={() => say(v, `${target.id}.alt.${i}`, target.speaker)}>
                  <span aria-hidden="true">🔊</span> {v}
                </button>
              </li>
            ))}
          </ul>

          {/* Unidad 5: si la pregunta trae respuestas por modo, mostrá el abanico
              en vez de una lista plana — enseña a apropiarse, no a memorizar. */}
          {target.answers?.length ? (
            <ModedAnswers atomId={target.id} answers={target.answers} speakerId={target.replySpeaker} />
          ) : (
            <>
              <p className="ref__sublabel">Respuestas naturales</p>
              <ul className="ref__lines">
                {round.accepted.map((r, i) => (
                  <li key={i}>
                    <button
                      className="ref__line ref__line--reply"
                      onClick={() => say(r, `${target.id}.reply.${i}`, target.replySpeaker)}
                    >
                      <span aria-hidden="true">🔊</span> {r}
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
      </div>
    </div>
  );
}
