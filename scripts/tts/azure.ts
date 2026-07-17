/**
 * azure.ts — proveedor TTS OPCIONAL: Azure Speech (voces neuronales).
 *
 * El proveedor por defecto es Kokoro (local, libre, sin key). Azure existe por
 * una sola razón: es el único que puede renderizar acentos no nativos, dándole
 * texto en inglés a una voz portuguesa/alemana/rusa. Si eso no te importa, no
 * lo necesitás. Ver ARQUITECTURA.md §5.4.
 *
 * Capa gratuita F0: 500.000 caracteres/mes; el curso entero usa una fracción.
 * Usa la API REST directa en vez del SDK: es una sola llamada HTTP y evita
 * arrastrar una dependencia pesada a un script de build.
 */

import {
  escapeXml,
  estimateDurationMs,
  type SynthResult,
  type TtsProvider,
  type Utterance,
} from './provider.ts';

const OUTPUT_FORMAT = 'audio-24khz-48kbitrate-mono-mp3';
const BITRATE_KBPS = 48;

/** Azure espera el rate como porcentaje relativo: 0.9 → "-10%". */
function ratePercent(rate: number): string {
  const pct = Math.round((rate - 1) * 100);
  return `${pct >= 0 ? '+' : ''}${pct}%`;
}

function ssml(u: Utterance): string {
  const rate = ratePercent(u.rate);
  // Diálogo A:/B: → un <voice> por turno. Azure sí soporta varias voces por speak.
  const body = u.segments
    ? u.segments
        .map((s) => `<voice name="${s.voice}"><prosody rate="${rate}">${escapeXml(s.text)}</prosody></voice>`)
        .join('<break time="450ms"/>')
    : `<voice name="${u.voice}"><prosody rate="${rate}">${escapeXml(u.text)}</prosody></voice>`;
  return `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="${u.lang}">${body}</speak>`;
}

export function createAzureProvider(key: string, region: string): TtsProvider {
  const endpoint = `https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`;

  return {
    id: 'azure',
    name: `azure(${region})`,

    async synth(u: Utterance): Promise<SynthResult> {
      // 429 = límite de cuota por segundo, no un error real. Reintento con backoff.
      for (let attempt = 0; attempt < 4; attempt++) {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Ocp-Apim-Subscription-Key': key,
            'Content-Type': 'application/ssml+xml',
            'X-Microsoft-OutputFormat': OUTPUT_FORMAT,
            'User-Agent': 'english-learning-uai',
          },
          body: ssml(u),
        });

        if (res.ok) {
          const data = Buffer.from(await res.arrayBuffer());
          return { data, durationMs: estimateDurationMs(data.length, BITRATE_KBPS) };
        }

        if (res.status === 429 || res.status >= 500) {
          const waitMs = 500 * 2 ** attempt;
          await new Promise((r) => setTimeout(r, waitMs));
          continue;
        }

        const body = await res.text().catch(() => '');
        if (res.status === 401 || res.status === 403) {
          throw new Error(
            `Azure rechazó las credenciales (${res.status}). Revisá AZURE_SPEECH_KEY y ` +
              `AZURE_SPEECH_REGION en .env — la región debe ser la del recurso (ej. "brazilsouth").`
          );
        }
        throw new Error(`Azure ${res.status} para "${u.key}": ${body.slice(0, 200)}`);
      }
      throw new Error(`Azure sigue devolviendo 429/5xx para "${u.key}" tras 4 intentos`);
    },
  };
}
