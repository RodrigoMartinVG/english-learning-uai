/**
 * kokoro-voices.ts — el catálogo de voces Kokoro, en un solo lugar.
 *
 * Fuente única de verdad para: build-audio (qué genera), AltVoices (qué ofrece),
 * review-flags y audio-review (qué sugiere). Antes estaba copiado en cuatro
 * archivos, y la lista de AltVoices tenía que coincidir A MANO con la de
 * build-audio: si no, el botón ofrecía audio que no existía. Ahora no puede
 * desincronizarse.
 */

export type Region = 'en-US' | 'en-GB';
export type VoiceGender = 'F' | 'M';

export interface KokoroVoice {
  id: string;
  region: Region;
  gender: VoiceGender;
}

/** Convención de Kokoro: <región><género>_nombre. af_=US-F, am_=US-M, bf_=GB-F, bm_=GB-M. */
const V = (id: string): KokoroVoice => ({
  id,
  region: id[0] === 'b' ? 'en-GB' : 'en-US',
  gender: id[1] === 'f' ? 'F' : 'M',
});

export const KOKORO_VOICES: KokoroVoice[] = [
  'af_heart', 'af_alloy', 'af_aoede', 'af_bella', 'af_jessica', 'af_kore', 'af_nicole', 'af_nova',
  'af_river', 'af_sarah', 'af_sky', 'am_adam', 'am_echo', 'am_eric', 'am_fenrir', 'am_liam',
  'am_michael', 'am_onyx', 'am_puck', 'am_santa', 'bf_emma', 'bf_isabella', 'bf_alice', 'bf_lily',
  'bm_george', 'bm_lewis', 'bm_daniel', 'bm_fable',
].map(V);

/**
 * Las voces alternativas para "escuchar en otra voz".
 *
 * Elegidas por diversidad de género y acento, no por personaje: el objetivo es
 * que el alumno oiga la misma frase en timbres distintos. Ver ARQUITECTURA.md §5.
 */
export const ALT_VOICES = [
  { id: 'af_bella', label: 'US ♀' },
  { id: 'am_michael', label: 'US ♂' },
  { id: 'bm_george', label: 'GB ♂' },
] as const;

/**
 * Voces para los "Scripts modelo" (las producciones largas de la guía).
 *
 * Ahí sí vale la pena ofrecer MÁS timbres que las tres de siempre: es donde el
 * alumno escucha el texto completo y elige con qué voz estudiarlo. Incluye las
 * tres alternativas habituales, la voz del narrador `bf_emma` (GB ♀, la que se
 * oye en los "Ejemplo significativo" y que faltaba como alternativa) y un par de
 * timbres distintivos. Solo se generan para las claves `.model`, no para todo el
 * habla: ver `build-audio` (se saltea el tope de largo para estos).
 */
export const MODEL_VOICES = [
  { id: 'af_bella', label: 'Bella · US ♀' },
  { id: 'am_michael', label: 'Michael · US ♂' },
  { id: 'bf_emma', label: 'Emma · GB ♀' },
  { id: 'bm_george', label: 'George · GB ♂' },
  { id: 'am_onyx', label: 'Onyx · US ♂' },
  { id: 'af_nicole', label: 'Nicole · US ♀' },
] as const;
