/**
 * kokoro.ts — proveedor TTS por defecto: Kokoro-82M, local y libre.
 *
 * Sin API key, sin cuenta, sin nube, sin límite de uso. Apache-2.0. El modelo
 * (~90 MB en q8) se descarga una vez a la cache de Hugging Face y después el
 * build funciona offline.
 *
 * Por qué esto y no Web Speech API en runtime: la voz del navegador depende del
 * sistema operativo del usuario. La app entrena el oído — no puede permitirse
 * que la Unidad 1 suene distinta en cada máquina.
 *
 * Límite real: solo tiene voces en-US y en-GB. Los acentos no nativos que declara
 * `l1` (Pedro portugués, Valentina rusa) no se renderizan. Ver ARQUITECTURA.md §5.4.
 */

import { encodeMp3, type SynthResult, type TtsProvider, type Utterance } from './provider.ts';
import { splitSentences } from './sentences.ts';

const MODEL = 'onnx-community/Kokoro-82M-v1.0-ONNX';
const MP3_BITRATE = 64;

/** Silencio entre oraciones. Un punto tiene que pausar más que una coma. */
const SENTENCE_GAP_MS = 300;
/** Silencio entre turnos de distinto hablante: más largo que entre oraciones. */
const TURN_GAP_MS = 450;
/** Debajo de esto es silencio: se recorta de los extremos de cada oración. */
const SILENCE_THRESHOLD = 0.01;

/** Recorta el silencio de relleno que Kokoro agrega al principio y al final. */
function trimSilence(a: Float32Array): Float32Array {
  let s = 0;
  let e = a.length - 1;
  while (s < e && Math.abs(a[s]!) < SILENCE_THRESHOLD) s++;
  while (e > s && Math.abs(a[e]!) < SILENCE_THRESHOLD) e--;
  return a.subarray(s, e + 1);
}

/** Une trozos de audio con `gapSamples` de silencio entre cada uno. */
function concat(pieces: Float32Array[], gapSamples: number): Float32Array {
  const total = pieces.reduce((n, p) => n + p.length, 0) + gapSamples * (pieces.length - 1);
  const merged = new Float32Array(Math.max(0, total));
  let offset = 0;
  pieces.forEach((p, i) => {
    merged.set(p, offset);
    offset += p.length + (i < pieces.length - 1 ? gapSamples : 0);
  });
  return merged;
}

type KokoroModel = {
  generate(text: string, opts: { voice: string; speed: number }): Promise<{
    audio: Float32Array;
    sampling_rate: number;
  }>;
  voices: Record<string, unknown>;
};

export function createKokoroProvider(dtype: 'q8' | 'fp32' = 'q8'): TtsProvider {
  let model: KokoroModel | null = null;

  return {
    id: 'kokoro',
    name: `kokoro(${MODEL.split('/')[1]}, ${dtype})`,

    async init() {
      const { KokoroTTS } = await import('kokoro-js');
      // La primera vez descarga el modelo; después sale de la cache local.
      model = (await KokoroTTS.from_pretrained(MODEL, { dtype, device: 'cpu' })) as unknown as KokoroModel;
    },

    async synth(u: Utterance): Promise<SynthResult> {
      if (!model) throw new Error('kokoro: init() no fue llamado');
      const m = model; // referencia no-null para los closures de abajo
      if (!(u.voice in model.voices)) {
        throw new Error(
          `kokoro: la voz "${u.voice}" no existe (emisión "${u.key}"). ` +
            `Disponibles: ${Object.keys(model.voices).join(', ')}`
        );
      }

      let sampleRate = 24000;

      // Genera un texto de una voz, partiendo en oraciones para que los puntos pausen.
      const sayOneVoice = async (text: string, voice: string): Promise<Float32Array> => {
        const sentences = splitSentences(text);
        const pieces: Float32Array[] = [];
        for (const s of sentences) {
          const out = await m.generate(s, { voice, speed: u.rate });
          sampleRate = out.sampling_rate;
          pieces.push(trimSilence(out.audio));
        }
        return concat(pieces, Math.round((sampleRate * SENTENCE_GAP_MS) / 1000));
      };

      // Multi-voz (ejercicio A:/B:): un trozo por turno, con su voz, y pausa de turno.
      if (u.segments && u.segments.length > 0) {
        const turns: Float32Array[] = [];
        for (const seg of u.segments) turns.push(await sayOneVoice(seg.text, seg.voice));
        const merged = concat(turns, Math.round((sampleRate * TURN_GAP_MS) / 1000));
        return {
          data: await encodeMp3(merged, sampleRate, MP3_BITRATE),
          durationMs: Math.round((merged.length / sampleRate) * 1000),
        };
      }

      const merged = await sayOneVoice(u.text, u.voice);
      return {
        data: await encodeMp3(merged, sampleRate, MP3_BITRATE),
        durationMs: Math.round((merged.length / sampleRate) * 1000),
      };
    },
  };
}
