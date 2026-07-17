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

/** De dónde salió el audio que sonó. La UI puede avisar cuando cae al fallback. */
export type AudioSource = 'file' | 'synth' | 'none';

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
 * Elige la voz local menos mala para un speaker.
 *
 * Los prototipos sorteaban una voz al azar en cada reproducción. Acá el orden es
 * determinista a propósito: la misma frase suena siempre igual, o el alumno
 * termina entrenando el oído contra ruido en vez de contra un hablante.
 */
function pickVoice(voices: SpeechSynthesisVoice[], hints: AudioVoiceHints): SpeechSynthesisVoice | null {
  const byName = (needle: string) =>
    voices.find((v) => v.name.toLowerCase().includes(needle.toLowerCase()));

  for (const hint of hints.fallbackHint) {
    const v = byName(hint);
    if (v) return v;
  }
  // Mismo acento exacto (en-GB para un personaje británico).
  const exact = voices.find((v) => v.lang.replace('_', '-') === hints.accent);
  if (exact) return exact;
  // Cualquier inglés antes que nada.
  return voices.find((v) => v.lang.toLowerCase().startsWith('en')) ?? null;
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
      return false; // 404, formato no soportado, o autoplay bloqueado.
    }

    await new Promise<void>((resolve) => {
      const done = () => {
        el.removeEventListener('ended', done);
        el.removeEventListener('error', done);
        resolve();
      };
      el.addEventListener('ended', done);
      el.addEventListener('error', done);
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
        if (myToken !== token) return 'file'; // nos cancelaron: no tocar el estado
        if (ok) {
          setState('idle');
          return 'file';
        }
      }

      setState('speaking');
      const ok = await playSynth(req.text, hints, rate, myToken);
      if (myToken !== token) return 'synth';
      setState(ok ? 'idle' : 'error');
      return ok ? 'synth' : 'none';
    },
  };
}
