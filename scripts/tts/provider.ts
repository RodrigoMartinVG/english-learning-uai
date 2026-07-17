/**
 * provider.ts — el contrato de síntesis de voz.
 *
 * build-audio.ts no sabe qué proveedor usa. Por defecto es Kokoro: local, libre
 * (Apache-2.0) y sin credenciales. Azure es opcional y solo aporta acentos no
 * nativos. Ver ARQUITECTURA.md §5.4.
 */

export type ProviderId = 'kokoro' | 'azure';

/** Un turno de un audio multi-voz: su texto y con qué voz se dice. */
export interface Segment {
  text: string;
  voice: string;
  lang: string;
}

/** Una emisión a sintetizar: el texto de un átomo con la voz de su speaker. */
export interface Utterance {
  /** Clave estable en el manifest. Ej: "en1.u1.p.007" o "en1.u1.qa.001.reply.0" */
  key: string;
  text: string;
  /** Id de voz, ya resuelto para el proveedor activo. Ej: "af_heart" | "en-US-AriaNeural" */
  voice: string;
  /** 1.0 = velocidad natural. */
  rate: number;
  /**
   * Idioma del TEXTO según el proveedor. Kokoro lo ignora (la voz ya lo fija).
   * Azure lo usa para el truco de acento: texto inglés con locale portugués.
   */
  lang: string;
  /**
   * Turnos con voces distintas, para los ejercicios de diálogo (A:/B:).
   *
   * Cuando está presente, el audio se arma con estos segmentos —cada uno con su
   * voz— y `text`/`voice` se ignoran. Es lo que convierte "A: What do you do?
   * B: I'm a teacher" en dos voces de verdad, sin leer las etiquetas "A" y "B".
   */
  segments?: Segment[];
}

export interface SynthResult {
  data: Buffer;
  /** Lo reporta el proveedor: Kokoro cuenta muestras, Azure estima por bitrate. */
  durationMs: number;
}

export interface TtsProvider {
  readonly id: ProviderId;
  readonly name: string;
  synth(u: Utterance): Promise<SynthResult>;
  /** Modelos que cargar, conexiones que abrir. Se llama una vez. */
  init?(): Promise<void>;
}

/** Escapa lo que rompería el XML del SSML. Un apóstrofe en "It's" no, pero & sí. */
export function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Duración por tamaño, para formatos de bitrate constante. */
export function estimateDurationMs(bytes: number, bitrateKbps: number): number {
  return Math.round(((bytes * 8) / (bitrateKbps * 1000)) * 1000);
}

/**
 * PCM float32 → mp3 mono.
 *
 * Kokoro devuelve muestras crudas: sin comprimir, la Unidad 1 pesaría ~24 MB.
 * Se usa lamejs (JS puro) en vez de ffmpeg para no exigir un binario del sistema
 * que en Windows no viene instalado.
 */
export async function encodeMp3(
  samples: Float32Array,
  sampleRate: number,
  bitrateKbps = 64
): Promise<Buffer> {
  const { default: lamejs } = await import('@breezystack/lamejs');

  const pcm = new Int16Array(samples.length);
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]!));
    pcm[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }

  const encoder = new lamejs.Mp3Encoder(1, sampleRate, bitrateKbps);
  const chunks: Buffer[] = [];
  const BLOCK = 1152; // el tamaño de frame que espera MPEG
  for (let i = 0; i < pcm.length; i += BLOCK) {
    const buf = encoder.encodeBuffer(pcm.subarray(i, i + BLOCK));
    if (buf.length) chunks.push(Buffer.from(buf));
  }
  const tail = encoder.flush();
  if (tail.length) chunks.push(Buffer.from(tail));

  return Buffer.concat(chunks);
}
