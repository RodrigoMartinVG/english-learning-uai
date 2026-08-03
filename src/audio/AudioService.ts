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
  entries: Record<string, { src: string; durationMs: number; hash?: string }>;
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

/** Lo último que sonó. Es lo que el botón de "marcar audio" necesita señalar. */
export interface LastPlayed {
  key: string;
  text: string;
  speakerId: string;
  source: AudioSource;
}

/**
 * Estado del mini-reproductor del header: el transporte del ÚLTIMO audio de archivo.
 *
 * Solo los mp3 tienen transporte: Web Speech no expone posición ni permite buscar,
 * así que la síntesis no aparece acá (con ella solo se puede cortar). `active` es
 * false cuando no hay elemento de audio; el reproductor entonces no se dibuja.
 * Persiste tras terminar (queda en pausa al final) para poder volver a escucharlo,
 * hasta que se reemplace por otro audio, se corte, o se navegue a otra pantalla.
 */
export interface TransportSnapshot {
  active: boolean;
  paused: boolean;
  /** Segundos. */
  currentTime: number;
  /** Segundos. 0 si aún no se conoce la duración. */
  duration: number;
}

export interface AudioService {
  speak(req: SpeakRequest): Promise<AudioSource>;
  /**
   * Reproduce un audio suelto por URL (típicamente una grabación del alumno, un
   * blob:). Va por el MISMO canal único que speak(): corta lo que estuviera
   * sonando y se corta con cancel() o al navegar. Sin esto, las grabaciones
   * sonaban con `new Audio()` por su cuenta y se solapaban con la referencia.
   */
  playClip(url: string): Promise<AudioSource>;
  cancel(): void;
  preload(keys: string[]): void;
  hasFile(key: string): boolean;
  getState(): AudioState;
  subscribe(fn: (s: AudioState) => void): () => void;
  /** ── Transporte del último audio (mini-reproductor del header) ─────────────── */
  /** Pausa sin resetear: se puede continuar con resume(). No resuelve el speak(). */
  pause(): void;
  /** Continúa desde donde se pausó. */
  resume(): void;
  /** Mueve la reproducción a `seconds` (se acota a [0, duración]). */
  seek(seconds: number): void;
  /** Vuelve al principio y reproduce de nuevo. */
  replay(): void;
  getTransport(): TransportSnapshot;
  subscribeTransport(fn: () => void): () => void;
  /** true si algún audio pregenerado no se pudo reproducir y se usó la voz del
   *  navegador (dev: mp3 nuevos no servidos hasta reiniciar; o caída de red/CPU). */
  getDegraded(): boolean;
  subscribeDegraded(fn: () => void): () => void;
  /** Qué sonó último, para poder marcarlo si suena mal. Null si nada sonó aún. */
  getLastPlayed(): LastPlayed | null;
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
  let lastPlayed: LastPlayed | null = null;
  const preloaded = new Map<string, HTMLAudioElement>();

  // "Degradado": había un mp3 pregenerado para la clave, pero no se pudo reproducir
  // (no se descargó / no decodificó) y hubo que caer a la voz del navegador. Se avisa
  // sutilmente en la UI. Una vez que pasa, queda marcado hasta recargar: el alumno
  // debe saber que parte del audio no es el de estudio. Ver AudioProvider/App.
  let degraded = false;
  const degradedListeners = new Set<() => void>();
  const markDegraded = () => {
    if (degraded) return;
    degraded = true;
    for (const fn of degradedListeners) fn();
  };

  /** Destraba la promesa de playFile en curso (la usa cancel/stopEverything). Solo la
   *  resuelven `ended`/`error` o un corte explícito — NUNCA una pausa del usuario. */
  let pendingDone: (() => void) | null = null;
  /** Quita los listeners de transporte del elemento actual. */
  let unbindTransport: (() => void) | null = null;
  const transportListeners = new Set<() => void>();
  const emitTransport = () => {
    for (const fn of transportListeners) fn();
  };

  /** Reemite el snapshot de transporte ante cualquier cambio del elemento. */
  const bindTransport = (el: HTMLAudioElement): (() => void) => {
    const evs = ['timeupdate', 'durationchange', 'play', 'pause', 'ended'] as const;
    for (const e of evs) el.addEventListener(e, emitTransport);
    return () => {
      for (const e of evs) el.removeEventListener(e, emitTransport);
    };
  };

  const setState = (s: AudioState) => {
    if (s === state) return;
    state = s;
    for (const fn of listeners) fn(s);
  };

  const stopEverything = () => {
    if (current) {
      current.pause();
      try {
        current.currentTime = 0;
      } catch {
        /* si aún no cargó metadata, ignorar */
      }
    }
    if (unbindTransport) {
      unbindTransport();
      unbindTransport = null;
    }
    current = null;
    // Destrabar la reproducción en vuelo: sin esto, su promesa quedaría colgada,
    // porque ya no escuchamos 'pause' para detectar el corte. Ver playFile.
    if (pendingDone) {
      const done = pendingDone;
      pendingDone = null;
      done();
    }
    if (typeof speechSynthesis !== 'undefined') speechSynthesis.cancel();
    emitTransport();
  };

  // Cache-busting: el archivo tiene nombre fijo por id (…/en1.u6.p.001.mp3). Si
  // regeneramos el audio con texto nuevo, el navegador seguiría sirviendo el mp3
  // viejo cacheado (misma URL). Colgarle el hash del contenido hace que la URL
  // cambie SOLO cuando el audio cambió, y así se recarga la versión nueva.
  const urlOf = (entry: { src: string; hash?: string }) =>
    AUDIO_BASE + entry.src + (entry.hash ? `?v=${entry.hash}` : '');

  async function playFile(url: string, rate: number, _myToken: number): Promise<boolean> {
    const el = preloaded.get(url) ?? new Audio(url);
    el.playbackRate = rate;
    // Sin esto, bajar la velocidad baja el tono y la voz suena a cinta gastada.
    el.preservesPitch = true;
    // Un elemento precargado puede venir con posición vieja (se reusa por URL).
    try {
      el.currentTime = 0;
    } catch {
      /* metadata no cargada aún: arranca en 0 igual */
    }
    current = el;
    unbindTransport?.();
    unbindTransport = bindTransport(el);
    emitTransport();

    try {
      await el.play();
    } catch {
      // 404, formato no soportado, autoplay bloqueado, o lo cancelaron: soltar el
      // elemento para que no quede colgado en el transporte, y caer al fallback.
      if (current === el) {
        unbindTransport?.();
        unbindTransport = null;
        current = null;
        emitTransport();
      }
      return false;
    }

    await new Promise<void>((resolve) => {
      const done = () => {
        el.removeEventListener('ended', done);
        el.removeEventListener('error', done);
        pendingDone = null;
        resolve();
      };
      el.addEventListener('ended', done);
      el.addEventListener('error', done);
      // Un corte (cancel/nuevo speak) resuelve vía pendingDone; una pausa del
      // usuario NO — por eso ya no escuchamos 'pause' acá.
      pendingDone = done;
    });

    // Al terminar solo (no cortado) dejamos `current` apuntando al elemento en pausa
    // al final: así el mini-reproductor sigue visible para volver a escucharlo. Se
    // limpia recién con el próximo speak(), un corte, o al navegar.
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

    getLastPlayed() {
      return lastPlayed;
    },

    getState() {
      return state;
    },

    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },

    subscribeTransport(fn) {
      transportListeners.add(fn);
      return () => transportListeners.delete(fn);
    },

    getDegraded() {
      return degraded;
    },

    subscribeDegraded(fn) {
      degradedListeners.add(fn);
      return () => degradedListeners.delete(fn);
    },

    getTransport() {
      const el = current;
      if (!el) return { active: false, paused: true, currentTime: 0, duration: 0 };
      return {
        active: true,
        paused: el.paused,
        currentTime: el.currentTime || 0,
        duration: Number.isFinite(el.duration) ? el.duration : 0,
      };
    },

    pause() {
      if (current && !current.paused) {
        current.pause();
        emitTransport();
      }
    },

    resume() {
      if (current && current.paused) {
        void current.play().catch(() => {});
        emitTransport();
      }
    },

    seek(seconds) {
      if (!current) return;
      const dur = Number.isFinite(current.duration) ? current.duration : seconds;
      try {
        current.currentTime = Math.max(0, Math.min(seconds, dur));
      } catch {
        /* metadata no lista: ignorar */
      }
      emitTransport();
    },

    replay() {
      if (!current) return;
      try {
        current.currentTime = 0;
      } catch {
        /* ignorar */
      }
      void current.play().catch(() => {});
      emitTransport();
    },

    cancel() {
      token++;
      stopEverything();
      setState('idle');
    },

    preload(keys) {
      for (const k of keys) {
        const entry = manifest.entries[k];
        if (!entry) continue;
        const url = urlOf(entry);
        if (preloaded.has(url)) continue;
        const el = new Audio(url);
        el.preload = 'auto';
        preloaded.set(url, el);
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

      const remember = (source: AudioSource) => {
        // Solo lo que sonó de un archivo es marcable: la voz de fallback del
        // navegador no la generamos nosotros, no tiene sentido reportarla.
        lastPlayed = { key: req.key, text: req.text, speakerId: req.speakerId, source };
      };

      const entry = manifest.entries[req.key];
      if (entry) {
        setState('speaking');
        const ok = await playFile(urlOf(entry), req.rateFactor ?? 1, myToken);
        // Nos pisó otro speak(): ni tocamos el estado ni mentimos diciendo que sonó.
        if (myToken !== token) return 'interrupted';
        if (ok) {
          setState('idle');
          remember('file');
          return 'file';
        }
        // Había mp3 pregenerado pero no se pudo reproducir (no bajó / no decodificó):
        // caemos a la voz del navegador y lo señalamos.
        markDegraded();
      }

      setState('speaking');
      const ok = await playSynth(req.text, hints, rate, myToken);
      if (myToken !== token) return 'interrupted';
      setState(ok ? 'idle' : 'error');
      if (ok) remember('synth');
      return ok ? 'synth' : 'none';
    },

    async playClip(url) {
      // Mismo protocolo que speak(): token nuevo + cortar todo, para que sea el
      // único audio y quede sujeto a cancel()/navegación.
      token++;
      const myToken = token;
      stopEverything();
      setState('speaking');
      const ok = await playFile(url, 1, myToken);
      if (myToken !== token) return 'interrupted';
      setState(ok ? 'idle' : 'error');
      return ok ? 'file' : 'none';
    },
  };
}
