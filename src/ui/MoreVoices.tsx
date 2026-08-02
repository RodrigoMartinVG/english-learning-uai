/**
 * MoreVoices — "escucharlo en otras voces", detrás de un spoiler.
 *
 * Para los modos de audio único (Dictado, Al oído, Armar la frase): ahí mostrar más
 * audio de entrada rompería la consigna (oír una vez / reproducir de memoria). Pero
 * las otras voces existen y son útiles como refuerzo. La solución: un `<details>`
 * colapsado con advertencia — no se oye nada hasta que el alumno decide abrirlo.
 *
 * Envuelve AltVoices; no dibuja nada si no hay voces alternativas para esta clave.
 */

import { manifest } from '../data/content.ts';
import { ALT_VOICES } from '../../content/kokoro-voices.ts';
import { AltVoices } from './AltVoices.tsx';
import './morevoices.css';

export function MoreVoices({
  audioKey,
  text,
  speakerId,
}: {
  audioKey: string;
  text: string;
  speakerId: string;
}) {
  const isQuestion = /\?\s*$/.test(text.trim());
  const hasKokoro = ALT_VOICES.some((v) => `${audioKey}.v.${v.id}` in manifest.entries);
  if (!hasKokoro && !isQuestion) return null;

  return (
    <details className="morevoices">
      <summary>
        🔊 Escucharlo en otras voces <span>· revela audio</span>
      </summary>
      <div className="morevoices__body">
        <AltVoices audioKey={audioKey} text={text} speakerId={speakerId} />
      </div>
    </details>
  );
}
