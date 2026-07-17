/**
 * provider.ts — el contrato de síntesis de voz.
 *
 * build-audio.ts no sabe qué proveedor usa. Cambiar Azure por Piper (local, gratis)
 * es implementar esta interfaz, no tocar el build. Ver ARQUITECTURA.md §5.4.
 */

/** Una emisión a sintetizar: el texto de un átomo con la voz de su speaker. */
export interface Utterance {
  /** Clave estable en el manifest. Ej: "en1.u1.p.007" o "en1.u1.p.009.slow" */
  key: string;
  text: string;
  /** Id de voz del proveedor. Ej: "en-US-AriaNeural" */
  voice: string;
  /** 1.0 = velocidad natural del proveedor. */
  rate: number;
  /**
   * Idioma del TEXTO, no de la voz. Son distintos a propósito: para los acentos
   * no nativos usamos una voz portuguesa/alemana/rusa leyendo texto en inglés.
   */
  lang: string;
}

export interface TtsProvider {
  readonly name: string;
  /** Formato que devuelve synth(), para calcular duración sin dependencias externas. */
  readonly format: { ext: 'mp3'; bitrateKbps: number };
  synth(u: Utterance): Promise<Buffer>;
}

/** Escapa lo que rompería el XML del SSML. Un apóstrofe en "It's" no, pero & sí. */
export function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Duración a partir del tamaño, asumiendo bitrate constante.
 * Evita depender de ffprobe para un dato que el CBR ya determina.
 */
export function estimateDurationMs(bytes: number, bitrateKbps: number): number {
  return Math.round((bytes * 8) / (bitrateKbps * 1000) * 1000);
}
