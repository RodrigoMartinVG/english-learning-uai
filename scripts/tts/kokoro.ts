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

const MODEL = 'onnx-community/Kokoro-82M-v1.0-ONNX';
const MP3_BITRATE = 64;

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

      const out = await model.generate(u.text, { voice: u.voice, speed: u.rate });
      return {
        data: await encodeMp3(out.audio, out.sampling_rate, MP3_BITRATE),
        // Duración exacta: la sabemos por las muestras, no hace falta estimarla.
        durationMs: Math.round((out.audio.length / out.sampling_rate) * 1000),
      };
    },
  };
}
