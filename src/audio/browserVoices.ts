/**
 * browserVoices.ts — voces del navegador (Web Speech) como alternativa EN VIVO.
 *
 * Por qué en vivo y no pregeneradas: la Web Speech API no expone el audio, así que
 * estas voces no se pueden grabar ni hornear en mp3 (ver AudioService.ts). Pero
 * como alternativa que el alumno dispara a mano sí sirven — y las de Windows
 * (David, Mark, Zira) son SAPI locales: offline, sin key, sin nube.
 *
 * Se ofrecen SOLO en las preguntas, donde el usuario las pidió como opción extra
 * junto a Kokoro (que sigue siendo la voz principal, pregenerada y consistente).
 */

import { useEffect, useState } from 'react';

/** Voces del navegador que ofrecemos en las preguntas. Orden = preferencia. */
export const QUESTION_BROWSER_VOICES = ['Zira', 'David', 'Mark'];

/** "Microsoft David - English (United States)" → "David". */
export function shortVoiceName(v: SpeechSynthesisVoice): string {
  return v.name.replace(/^Microsoft\s+/i, '').split(/\s*[-–—]\s*/)[0]!.trim();
}

/**
 * Las voces del navegador disponibles que matchean `names` (por substring del
 * nombre) y son de inglés. Se re-evalúa cuando el navegador termina de poblar la
 * lista (`voiceschanged`), que llega asíncrona. Vacío si no hay Web Speech o no hay
 * match — así el componente simplemente no dibuja nada.
 */
export function useBrowserVoices(names: string[]): SpeechSynthesisVoice[] {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const key = names.join(',');
  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window) || !names.length) {
      setVoices([]);
      return;
    }
    const synth = window.speechSynthesis;
    const load = () => {
      const all = synth.getVoices();
      const matched = names
        .map((n) => all.find((v) => v.name.includes(n) && /^en/i.test(v.lang)))
        .filter((v): v is SpeechSynthesisVoice => Boolean(v));
      setVoices(matched);
    };
    load();
    synth.addEventListener('voiceschanged', load);
    return () => synth.removeEventListener('voiceschanged', load);
    // key resume `names`; evitamos re-suscribir por identidad del array.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return voices;
}

/** Dice el texto en vivo con una voz del navegador. Corta cualquier habla previa. */
export function speakWithBrowserVoice(text: string, voice: SpeechSynthesisVoice): void {
  const synth = window.speechSynthesis;
  synth.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.voice = voice;
  u.lang = voice.lang;
  u.rate = 1;
  synth.speak(u);
}
