/**
 * ModedAnswers — las respuestas modelo etiquetadas por modo (Unidad 5, §3.5).
 *
 * La misma pregunta respondida desde varios ángulos: apoyándose en el texto,
 * con palabras propias, conectando ideas, o desde la mirada personal. No es la
 * "respuesta correcta": es el abanico que enseña a apropiarse del texto. Cada una
 * se puede escuchar leída en voz alta.
 */

import { answerKey, type AnswerMode, type ModedAnswer } from '../../content/schema.ts';
import { useAudio } from '../audio/AudioProvider.tsx';
import './modedanswers.css';

const MODE_LABEL: Record<AnswerMode, string> = {
  quote: 'Apoyándote en el texto',
  paraphrase: 'Con tus palabras',
  connect: 'Conectando ideas',
  personal: 'Tu mirada',
};

const MODE_HINT: Record<AnswerMode, string> = {
  quote: 'Cita la parte del texto que lo dice.',
  paraphrase: 'Lo mismo, dicho a tu manera.',
  connect: 'Relaciona esta idea con otra del texto.',
  personal: 'Qué te sorprende o cómo lo explicarías.',
};

export function ModedAnswers({
  atomId,
  answers,
  speakerId,
}: {
  atomId: string;
  answers: ModedAnswer[];
  speakerId: string;
}) {
  const audio = useAudio();
  if (!answers.length) return null;

  return (
    <div className="modes">
      <p className="modes__intro">No hay una sola respuesta. Mirá cómo responderla desde cada ángulo:</p>
      <ul className="modes__list">
        {answers.map((a, i) => (
          <li key={i} className={'modes__item modes__item--' + a.mode}>
            <div className="modes__head">
              <span className="modes__badge">{MODE_LABEL[a.mode]}</span>
              <button
                className="modes__play"
                onClick={() => void audio.speak({ key: answerKey(atomId, i), text: a.text, speakerId })}
                aria-label={`Escuchar: ${MODE_LABEL[a.mode]}`}
              >
                🔊
              </button>
            </div>
            <p className="modes__text">{a.text}</p>
            <p className="modes__hint">{MODE_HINT[a.mode]}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
