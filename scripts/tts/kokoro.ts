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
      if (!(u.voice in model.voices)) {
        throw new Error(
          `kokoro: la voz "${u.voice}" no existe (emisión "${u.key}"). ` +
            `Disponibles: ${Object.keys(model.voices).join(', ')}`
        );
      }

      const sentences = splitSentences(u.text);

      // Una sola oración: camino directo, sin recorte ni concatenación.
      if (sentences.length === 1) {
        const out = await model.generate(u.text, { voice: u.voice, speed: u.rate });
        return {
          data: await encodeMp3(out.audio, out.sampling_rate, MP3_BITRATE),
          durationMs: Math.round((out.audio.length / out.sampling_rate) * 1000),
        };
      }

      // Varias oraciones: cada una por separado, recortada, unidas con un silencio
      // real. Es lo que le da al punto la pausa que Kokoro no le da solo.
      let sampleRate = 24000;
      const pieces: Float32Array[] = [];
      for (const s of sentences) {
        const out = await model.generate(s, { voice: u.voice, speed: u.rate });
        sampleRate = out.sampling_rate;
        pieces.push(trimSilence(out.audio));
      }

      const gap = Math.round((sampleRate * SENTENCE_GAP_MS) / 1000);
      const totalLen = pieces.reduce((n, p) => n + p.length, 0) + gap * (pieces.length - 1);
      const merged = new Float32Array(totalLen);
      let offset = 0;
      pieces.forEach((p, i) => {
        merged.set(p, offset);
        offset += p.length + (i < pieces.length - 1 ? gap : 0);
      });

      return {
        data: await encodeMp3(merged, sampleRate, MP3_BITRATE),
        durationMs: Math.round((totalLen / sampleRate) * 1000),
      };
    },
  };
}
