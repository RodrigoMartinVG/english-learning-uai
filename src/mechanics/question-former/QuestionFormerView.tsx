import { useCallback, useEffect } from 'react';
import { useAudio } from '../../audio/AudioProvider.tsx';
import { SpeakPanel } from '../../ui/SpeakPanel.tsx';
import type { MechanicViewProps } from '../types.ts';
import type { QuestionFormerRound } from './mechanic.ts';

/**
 * El encuadre en pantalla según la consigna real del ejercicio. Sin esto, una
 * situación ("You want a student's phone number") o una reescritura ("the desk of
 * Sam") se mostraban como "¿qué pregunta lleva a esa respuesta?", que queda meta o
 * es incorrecto. Cada tipo de transform tiene su propio par etiqueta/consigna.
 */
function frameFor(prompt: string): { label: string; consigna: string } {
  const p = prompt.toLowerCase();
  if (p.includes('ask question'))
    return { label: 'Alguien te dice:', consigna: '¿Qué pregunta lleva a esa respuesta? Decila en voz alta.' };
  if (p.includes('request') || p.includes('situation'))
    return { label: 'Estás en esta situación:', consigna: 'Decí el pedido con can, en voz alta.' };
  if (p.includes('third person'))
    return { label: 'Pasala a tercera persona:', consigna: 'Decí la frase transformada, en voz alta.' };
  if (p.includes('frequency adverb'))
    return { label: 'Ubicá el adverbio de frecuencia:', consigna: 'Decí la frase con el adverbio en su lugar, en voz alta.' };
  if (p.includes('possessive'))
    return { label: "Reescribí con el posesivo 's:", consigna: 'Decí la forma con posesivo, en voz alta.' };
  return { label: 'Transformá la frase:', consigna: 'Decí la frase transformada, en voz alta.' };
}

export function QuestionFormerView({ round, onDone }: MechanicViewProps<QuestionFormerRound>) {
  const audio = useAudio();
  const frame = frameFor(round.prompt);

  const playAnswer = useCallback(
    () => void audio.speak({ key: round.audioKey, text: round.targets[0]!, speakerId: round.speakerId }),
    [audio, round]
  );

  useEffect(() => () => audio.cancel(), [audio]);

  return (
    <div className="osmosis exlr">
      <div className="osmosis__stage">
        {/* La pista se LEE. Lo que hay que producir NO se muestra ni suena hasta el
            final (si no, sería repetir). El encuadre depende de la consigna real:
            respuesta→pregunta, situación→pedido, o reescritura. */}
        <p className="osmosis__hint">{frame.label}</p>
        <p className="mp__stem">{round.statement}</p>
        <p className="osmosis__hint">{frame.consigna}</p>
      </div>

      <div className="exlr__panel">
      <SpeakPanel
        targets={round.targets}
        neighbourhood={round.neighbourhood}
        lang="en-US"
        onPlayReference={playAnswer}
        onDone={onDone}
      />
      </div>
    </div>
  );
}
