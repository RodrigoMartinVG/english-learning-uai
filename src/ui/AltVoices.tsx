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
import {
  QUESTION_BROWSER_VOICES,
  shortVoiceName,
  speakWithBrowserVoice,
  useBrowserVoices,
} from '../audio/browserVoices.ts';
import './altvoices.css';

/** Sin voces del navegador cuando no es pregunta (referencia estable para el hook). */
const NO_BROWSER_VOICES: string[] = [];

export interface AltVoicesProps {
  /** Clave base del audio: "en1.u1.p.007". Las alternativas cuelgan con ".v.<voz>". */
  audioKey: string;
  text: string;
  speakerId: string;
  /** Qué voces ofrecer. Por defecto las tres de siempre; los Scripts modelo pasan más. */
  voices?: readonly { id: string; label: string }[];
}

export function AltVoices({ audioKey, text, speakerId, voices = ALT }: AltVoicesProps) {
  const audio = useAudio();
  const kokoro = voices.filter((v) => `${audioKey}.v.${v.id}` in manifest.entries);
  // Voces del navegador (David/Mark/Zira) SOLO en las preguntas, como pidió el usuario.
  const isQuestion = /\?\s*$/.test(text.trim());
  const browser = useBrowserVoices(isQuestion ? QUESTION_BROWSER_VOICES : NO_BROWSER_VOICES);

  if (!kokoro.length && !browser.length) return null;

  return (
    <div className="altvoices">
      <span className="altvoices__label">Otras voces</span>
      {kokoro.map((v) => (
        <button
          key={v.id}
          className="altvoices__voice"
          onClick={() => void audio.speak({ key: `${audioKey}.v.${v.id}`, text, speakerId })}
          aria-label={`Escuchar en voz ${v.label}`}
        >
          🔊 {v.label}
        </button>
      ))}
      {browser.map((v) => (
        <button
          key={v.name}
          className="altvoices__voice altvoices__voice--browser"
          // El navegador no comparte el AudioService: cortamos Kokoro antes de hablar.
          onClick={() => {
            audio.cancel();
            speakWithBrowserVoice(text, v);
          }}
          aria-label={`Escuchar ${shortVoiceName(v)} (voz del navegador, en vivo)`}
          title="Voz del navegador (en vivo)"
        >
          🗣 {shortVoiceName(v)}
        </button>
      ))}
    </div>
  );
}
