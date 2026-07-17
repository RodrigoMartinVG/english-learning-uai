/**
 * AudioService — el único lugar de la app que hace sonar algo.
 *
 * Ninguna mecánica toca speechSynthesis ni construye un <audio>. Todas piden
 * acá. Eso hace cumplir dos reglas que en los prototipos se rompían solas:
 *
 *  1. Un solo audio suena a la vez. Siempre. Si el usuario aprieta Play mientras
 *     algo habla, lo anterior se cancela; nunca se solapan dos voces.
 *  2. La voz de un personaje es estable. Mary suena como Mary, no como lo que
 *     el navegador tenga a mano.
 *
 * Cascada: mp3 pregenerado → Web Speech con la voz sugerida → Web Speech con
 * cualquier voz del acento → error honesto. Ver ARQUITECTURA.md §5.3.
 *
 * ── Por qué Web Speech es el fallback y no la fuente ──────────────────────────
 *
 * Las voces neuronales del navegador (Edge: "Aria Online (Natural)"; Chrome:
 * "Google US English") son excelentes y gratis. Pero no pueden ser la fuente:
 *
 *  · No se pueden grabar. La Web Speech API no expone el audio: no hay forma de
 *    capturar las muestras. Sirve para reproducir en vivo, nunca para pregenerar.
 *  · Son de nube. El "Online" del nombre es literal: salen de un servidor. Sin
 *    internet no hay voz, y adiós al modo offline.
 *  · Dependen del navegador. Las Natural solo están en Edge. En Firefox quedan
 *    las SAPI de Windows (David, Zira), de otra década. La misma frase sonaría
 *    distinta —o robótica— según dónde abras la app.
 *  · Cortan las frases largas. Chrome trunca las emisiones de más de ~15s. La
 *    narrativa del Listening 1 dura 35s: el contenido más valioso de la unidad
 *    es justo el que se rompe.
 *  · El `rate` estira, no re-articula. Un TTS lento de verdad vuelve a
 *    pronunciar; esto solo alarga.
 *
 * Con mp3 pregenerado nada de eso pasa, y este fallback sigue estando para
 * cuando un audio falte. No se pierde nada: se gana un piso.
 */

export interface SpeakRequest {
  /** Clave del manifest. Ej: "en1.u1.p.007" o "en1.u1.qa.001.reply.0" */
  key: string;
  /** El texto. Necesario para el fallback: sin mp3, hay que sintetizar en vivo. */
  text: string;
  speakerId: string;
  /** Multiplicador sobre la velocidad del speaker. 0.75 = práctica lenta. */
  rateFactor?: number;
}

export interface AudioVoiceHints {
  ttsVoice: string;
  accent: string;
  fallbackHint: string[];
  rate: number;
}

export interface AudioManifest {
  entries: Record<string, { src: string; durationMs: number }>;
}

export type AudioState = 'idle' | 'loading' | 'speaking' | 'error';

/**
 * Cómo terminó un speak().
 *
 * `file` y `synth` significan SONÓ ENTERO. `interrupted` significa que otro
 * speak() o un cancel() lo pisó; `none` que no había con qué reproducirlo.
 *
 * La distinción no es cosmética: sin ella, la promesa de speak() resuelve igual
 * al terminar que al ser cancelada, y quien haga `.then(avanzar)` avanza de más.
 * Fue exactamente el bug del Role-play, que se comía un turno entero.
 */
export type AudioSource = 'file' | 'synth' | 'none' | 'interrupted';

/** ¿El audio sonó completo? Lo que casi siempre se quiere preguntar. */
export const played = (r: AudioSource): boolean => r === 'file' || r === 'synth';

export interface AudioService {
  speak(req: SpeakRequest): Promise<AudioSource>;
  cancel(): void;
  preload(keys: string[]): void;
  hasFile(key: string): boolean;
  getState(): AudioState;
  subscribe(fn: (s: AudioState) => void): () => void;
  /** Para el arranque: si esto es false, la app no puede cumplir su función. */
  isSupported(): boolean;
}

const AUDIO_BASE = '';

/** getVoices() suele venir vacío en el primer llamado: el navegador las carga async. */
function voicesReady(timeoutMs = 2000): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    const now = speechSynthesis.getVoices();
    if (now.length) return resolve(now);

    const timer = setTimeout(() => {
      speechSynthesis.removeEventListener('voiceschanged', onChange);
      resolve(speechSynthesis.getVoices());
    }, timeoutMs);

    function onChange() {
      clearTimeout(timer);
      speechSynthesis.removeEventListener('voiceschanged', onChange);
      resolve(speechSynthesis.getVoices());
    }
    speechSynthesis.addEventListener('voiceschanged', onChange);
  });
}

/**
 * Marcadores de voz neuronal en el nombre que expone el navegador.
 *
 * Edge publica las voces de Azure como "Microsoft Aria Online (Natural)"; Chrome
 * publica las de Google como "Google US English". Suenan muy por encima de las
 * SAPI locales de Windows (David, Zira), que son de otra década.
 *
 * La idea y la lista vienen del NATURAL_RE de los prototipos: filtraban por
 * naturalidad antes que por cualquier otra cosa, y tenían razón.
 */
const NATURAL_RE = /natural|neural|online|premium|enhanced|google (uk|us)|aria|guy|jenny|emma|sonia|ryan/i;

/**
 * Elige la mejor voz disponible para un speaker.
 *
 * Dos reglas, en este orden:
 *  1. Naturalidad: una voz neuronal siempre le gana a una SAPI, aunque el
 *     personaje pidiera otro nombre. Es preferible que Mary suene natural con
 *     otra voz a que suene a robot con "la suya".
 *  2. Determinismo: nunca al azar. Los prototipos sorteaban una voz por
 *     reproducción; así el alumno entrena el oído contra ruido en vez de contra
 *     un hablante. Se ordena por nombre para que el desempate no dependa del
 *     orden en que el navegador devuelva la lista.
 */
function pickVoice(voices: SpeechSynthesisVoice[], hints: AudioVoiceHints): SpeechSynthesisVoice | null {
  const en = [...voices]
    .filter((v) => v.lang.toLowerCase().startsWith('en'))
    .sort((a, b) => a.name.localeCompare(b.name));
  if (!en.length) return null;

  const accent = hints.accent.toLowerCase();
  const sameAccent = (v: SpeechSynthesisVoice) => v.lang.replace('_', '-').toLowerCase() === accent;
  const named = (v: SpeechSynthesisVoice) =>
    hints.fallbackHint.some((h) => v.name.toLowerCase().includes(h.toLowerCase()));
  const natural = (v: SpeechSynthesisVoice) => NATURAL_RE.test(v.name);

  return (
    en.find((v) => named(v) && natural(v)) ??       // la voz del personaje, y además neuronal
    en.find((v) => natural(v) && sameAccent(v)) ??  // otra neuronal, mismo acento
    en.find((v) => natural(v)) ??                   // cualquier neuronal
    en.find((v) => named(v)) ??                     // la del personaje, aunque sea SAPI
    en.find(sameAccent) ??
    en[0] ??
    null
  );
}

export function createAudioService(
  manifest: AudioManifest,
  speakers: Record<string, AudioVoiceHints>
): AudioService {
  let state: AudioState = 'idle';
  const listeners = new Set<(s: AudioState) => void>();

  let current: HTMLAudioElement | null = null;
  /** Cada speak() incrementa esto. Un token viejo que resuelve ya no manda. */
  let token = 0;
  const preloaded = new Map<string, HTMLAudioElement>();

  const setState = (s: AudioState) => {
    if (s === state) return;
    state = s;
    for (const fn of listeners) fn(s);
  };

  const stopEverything = () => {
    if (current) {
      current.pause();
      current.currentTime = 0;
      current = null;
    }
    if (typeof speechSynthesis !== 'undefined') speechSynthesis.cancel();
  };

  async function playFile(src: string, rate: number, myToken: number): Promise<boolean> {
    const el = preloaded.get(src) ?? new Audio(AUDIO_BASE + src);
    el.playbackRate = rate;
    // Sin esto, bajar la velocidad baja el tono y la voz suena a cinta gastada.
    el.preservesPitch = true;
    current = el;

    try {
      await el.play();
    } catch {
      return false; // 404, formato no soportado, autoplay bloqueado, o lo cancelaron.
    }

    await new Promise<void>((resolve) => {
      const done = () => {
        el.removeEventListener('ended', done);
        el.removeEventListener('error', done);
        // 'pause' es indispensable: cancel() llama pause(), que NO dispara
        // 'ended' ni 'error'. Sin escucharlo, esta promesa quedaba colgada para
        // siempre y sus listeners nunca se soltaban.
        el.removeEventListener('pause', done);
        resolve();
      };
      el.addEventListener('ended', done);
      el.addEventListener('error', done);
      el.addEventListener('pause', done);
    });

    if (myToken === token) current = null;
    return true;
  }

  async function playSynth(
    text: string,
    hints: AudioVoiceHints,
    rate: number,
    myToken: number
  ): Promise<boolean> {
    if (typeof speechSynthesis === 'undefined') return false;

    const voices = await voicesReady();
    if (myToken !== token) return true; // nos cancelaron mientras cargaban las voces
    const voice = pickVoice(voices, hints);
    if (!voice) return false;

    const utt = new SpeechSynthesisUtterance(text);
    utt.voice = voice;
    utt.lang = voice.lang;
    utt.rate = rate;

    await new Promise<void>((resolve) => {
      utt.onend = () => resolve();
      utt.onerror = () => resolve();
      speechSynthesis.speak(utt);
    });
    return true;
  }

  return {
    isSupported() {
      return typeof speechSynthesis !== 'undefined' || Object.keys(manifest.entries).length > 0;
    },

    hasFile(key) {
      return key in manifest.entries;
    },

    getState() {
      return state;
    },

    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },

    cancel() {
      token++;
      stopEverything();
      setState('idle');
    },

    preload(keys) {
      for (const k of keys) {
        const entry = manifest.entries[k];
        if (!entry || preloaded.has(entry.src)) continue;
        const el = new Audio(AUDIO_BASE + entry.src);
        el.preload = 'auto';
        preloaded.set(entry.src, el);
      }
    },

    async speak(req) {
      // Regla 1: cancelar SIEMPRE antes de hablar. Este era el bug de voces
      // solapadas de los prototipos, y no se arregla en el que llama.
      token++;
      const myToken = token;
      stopEverything();

      const hints = speakers[req.speakerId];
      if (!hints) {
        setState('error');
        return 'none';
      }

      const rate = hints.rate * (req.rateFactor ?? 1);
      setState('loading');

      const entry = manifest.entries[req.key];
      if (entry) {
        setState('speaking');
        const ok = await playFile(entry.src, req.rateFactor ?? 1, myToken);
        // Nos pisó otro speak(): ni tocamos el estado ni mentimos diciendo que sonó.
        if (myToken !== token) return 'interrupted';
        if (ok) {
          setState('idle');
          return 'file';
        }
      }

      setState('speaking');
      const ok = await playSynth(req.text, hints, rate, myToken);
      if (myToken !== token) return 'interrupted';
      setState(ok ? 'idle' : 'error');
      return ok ? 'synth' : 'none';
    },
  };
}
