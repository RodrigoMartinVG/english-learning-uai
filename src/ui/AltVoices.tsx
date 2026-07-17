/**
 * AltVoices — escuchar la frase actual en otras voces, en línea con el Play.
 *
 * A diferencia del botón viejo del header, este NO depende de "lo último que
 * sonó": recibe la frase actual y muestra sus voces alternativas siempre que
 * existan. Se puede tocar cuantas veces se quiera. Va al lado de los controles
 * de reproducción de cada mecánica.
 *
 * Solo aparece si hay alternativas pregeneradas (las tienen las frases; el
 * deletreo, los ejercicios y las narraciones largas no). Si no hay, no dibuja
 * nada — cero ruido visual.
 */

import { useAudio } from '../audio/AudioProvider.tsx';
import { manifest } from '../data/content.ts';
import { ALT_VOICES as ALT } from '../../content/kokoro-voices.ts';
import './altvoices.css';


export interface AltVoicesProps {
  /** Clave base del audio: "en1.u1.p.007". Las alternativas cuelgan con ".v.<voz>". */
  audioKey: string;
  text: string;
  speakerId: string;
}

export function AltVoices({ audioKey, text, speakerId }: AltVoicesProps) {
  const audio = useAudio();
  const available = ALT.filter((v) => `${audioKey}.v.${v.id}` in manifest.entries);
  if (!available.length) return null;

  return (
    <div className="altvoices">
      <span className="altvoices__label">Otras voces</span>
      {available.map((v) => (
        <button
          key={v.id}
          className="altvoices__voice"
          onClick={() => void audio.speak({ key: `${audioKey}.v.${v.id}`, text, speakerId })}
          aria-label={`Escuchar en voz ${v.label}`}
        >
          🔊 {v.label}
        </button>
      ))}
    </div>
  );
}
