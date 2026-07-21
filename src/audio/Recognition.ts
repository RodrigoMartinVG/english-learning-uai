/**
 * Recognition.ts — el micrófono. Ver ARQUITECTURA.md §6.4 y §10.
 *
 * Envuelve la Web Speech API (SpeechRecognition) y se hace cargo de todo lo que
 * falla en la vida real y los prototipos ignoraban:
 *
 *  · permisos denegados → estado explícito, no un botón muerto
 *  · silencio → timeout, o el micro queda escuchando ruido para siempre
 *  · arranque lento → estado 'starting', no un botón que parece roto
 *  · navegador sin soporte → se detecta al arrancar y se dice
 *
 * Devuelve una transcripción. NO puntúa pronunciación: eso no existe en esta API.
 * La corrección vive en engine/grading/speech.ts.
 */

export type RecognitionState =
  | 'idle'
  | 'starting'
  | 'listening'
  | 'denied'
  | 'unsupported'
  | 'error';

export interface RecognitionResult {
  transcript: string;
  /** Confianza del motor, 0..1. Orientativa: no es una nota. */
  confidence: number;
}

export interface ListenOptions {
  lang?: string;
  /** Léxico esperado (JSGF). Mejora bastante el reconocimiento de frases cortas. */
  hints?: string;
  /**
   * Tolerancia a la pausa DENTRO de la frase: cuánto silencio aguantar, ya
   * habiendo empezado a hablar, antes de dar por cerrada la toma. Subirlo = el
   * micro perdona pausas más largas para pensar la palabra siguiente. Sin esto
   * el micro queda colgado en ruido de fondo.
   */
  silenceMs?: number;
  /**
   * Cuánto esperar a que ARRANQUE a hablar, antes de la primera palabra. Es un
   * tiempo aparte y más largo: el alumno lee la consigna y duda. Confundirlo con
   * `silenceMs` es lo que hacía que cortara "muy rápido". Por defecto, `silenceMs`.
   */
  leadMs?: number;
  /**
   * Seguir escuchando después de la primera pausa.
   *
   * Imprescindible para monólogos: sin esto, el reconocimiento se cierra apenas
   * el alumno respira, y una respuesta de examen oral queda cortada en la primera
   * coma. Conviene también para frases sueltas: deja que `silenceMs`/`leadMs`
   * gobiernen el corte en vez del fin-de-habla agresivo del navegador.
   */
  continuous?: boolean;
  /** Transcripción parcial, para dar feedback mientras habla. */
  onInterim?: (text: string) => void;
}

type SpeechRecognitionCtor = new () => any;

function getCtor(): SpeechRecognitionCtor | null {
  const w = globalThis as any;
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function isRecognitionSupported(): boolean {
  return getCtor() !== null;
}

export interface Recognizer {
  listen(opts?: ListenOptions): Promise<RecognitionResult>;
  abort(): void;
  getState(): RecognitionState;
  subscribe(fn: (s: RecognitionState) => void): () => void;
}

export function createRecognizer(): Recognizer {
  let state: RecognitionState = isRecognitionSupported() ? 'idle' : 'unsupported';
  const listeners = new Set<(s: RecognitionState) => void>();
  let active: any = null;

  const setState = (s: RecognitionState) => {
    if (s === state) return;
    state = s;
    for (const fn of listeners) fn(s);
  };

  return {
    getState: () => state,
    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },

    abort() {
      if (active) {
        active.onend = null;
        active.abort();
        active = null;
      }
      if (state !== 'unsupported') setState('idle');
    },

    listen(opts: ListenOptions = {}): Promise<RecognitionResult> {
      const Ctor = getCtor();
      if (!Ctor) {
        setState('unsupported');
        return Promise.reject(new Error('Este navegador no reconoce voz. Probá Chrome o Edge.'));
      }

      this.abort();

      return new Promise<RecognitionResult>((resolve, reject) => {
        const rec = new Ctor();
        active = rec;
        rec.lang = opts.lang ?? 'en-US';
        rec.interimResults = true;
        rec.maxAlternatives = 1;
        rec.continuous = opts.continuous ?? false;

        // Grammar hints: la propiedad infrautilizada del PRD. Puede no existir
        // (Firefox, versiones viejas) y no es motivo para no reconocer nada.
        const w = globalThis as any;
        const ListCtor = w.SpeechGrammarList ?? w.webkitSpeechGrammarList;
        if (opts.hints && ListCtor) {
          try {
            const list = new ListCtor();
            list.addFromString(opts.hints, 1);
            rec.grammars = list;
          } catch {
            /* sin hints se reconoce igual, solo peor */
          }
        }

        let best = '';
        let confidence = 0;
        let settled = false;

        const finish = (fn: () => void) => {
          if (settled) return;
          settled = true;
          clearTimeout(silence);
          active = null;
          setState('idle');
          fn();
        };

        // El reloj se reinicia con cada palabra: mide silencio, no duración total.
        // Y usa DOS tiempos: uno largo para que arranque a hablar (leadMs) y otro
        // más corto para tolerar pausas ya empezada la frase (silenceMs). Antes era
        // uno solo, y una pausa para pensar se leía como "terminó" → cortaba rápido.
        let heardSpeech = false;
        let silence: ReturnType<typeof setTimeout>;
        const armSilence = () => {
          clearTimeout(silence);
          const ms = heardSpeech
            ? opts.silenceMs ?? 2500
            : opts.leadMs ?? opts.silenceMs ?? 8000;
          silence = setTimeout(() => {
            try {
              rec.stop();
            } catch {
              /* ya estaba parado */
            }
          }, ms);
        };

        rec.onstart = () => {
          setState('listening');
          armSilence();
        };

        rec.onresult = (e: any) => {
          heardSpeech = true;
          armSilence();
          let interim = '';
          for (let i = e.resultIndex; i < e.results.length; i++) {
            const r = e.results[i];
            if (r.isFinal) {
              best += r[0].transcript;
              confidence = r[0].confidence ?? 0;
            } else {
              interim += r[0].transcript;
            }
          }
          if (interim) opts.onInterim?.(interim);
        };

        rec.onerror = (e: any) => {
          if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
            setState('denied');
            finish(() => reject(new Error('denied')));
            return;
          }
          // 'no-speech' y 'aborted' no son fallas: el alumno no dijo nada.
          if (e.error === 'no-speech' || e.error === 'aborted') {
            finish(() => resolve({ transcript: best.trim(), confidence }));
            return;
          }
          setState('error');
          finish(() => reject(new Error(e.error ?? 'error de reconocimiento')));
        };

        rec.onend = () => finish(() => resolve({ transcript: best.trim(), confidence }));

        setState('starting');
        try {
          rec.start();
        } catch (err) {
          setState('error');
          finish(() => reject(err as Error));
        }
      });
    },
  };
}
