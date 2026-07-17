/**
 * review-flags.ts — convierte los audios marcados en un plan de acción.
 *
 * El botón de la app exporta un JSON. Este script lo lee y responde la única
 * pregunta que importa: ¿es un problema de una voz entera, o de audios sueltos?
 *
 *   npm run flags -- oda-audios-marcados-2026-07-17.json
 *
 * Si una voz junta varias marcas, conviene cambiarla en speakers.json (y todos
 * sus átomos se regeneran solos). Si son casos aislados, quizá solo haga falta
 * regenerarlos, o bajarles la velocidad.
 */

import { readFileSync } from 'node:fs';
import { speakersFileSchema, type Speaker } from '../content/schema.ts';

const path = process.argv[2];
if (!path) {
  console.error('\nUso: npm run flags -- <archivo-exportado.json>\n');
  process.exit(1);
}

interface Flag {
  audioKey: string;
  text: string;
  speakerId: string;
  voice: string;
}

const data = JSON.parse(readFileSync(path, 'utf8')) as { flags: Flag[] };
const flags = data.flags ?? [];

const speakers = new Map<string, Speaker>(
  speakersFileSchema
    .parse(JSON.parse(readFileSync(new URL('../content/speakers.json', import.meta.url), 'utf8')))
    .speakers.map((s) => [s.id, s]),
);

// Voces Kokoro que NO están en uso: candidatas de reemplazo.
const inUse = new Set([...speakers.values()].map((s) => s.voice.kokoro));
const KOKORO_ALL = [
  'af_heart', 'af_alloy', 'af_aoede', 'af_bella', 'af_jessica', 'af_kore', 'af_nicole', 'af_nova',
  'af_river', 'af_sarah', 'af_sky', 'am_adam', 'am_echo', 'am_eric', 'am_fenrir', 'am_liam',
  'am_michael', 'am_onyx', 'am_puck', 'am_santa', 'bf_emma', 'bf_isabella', 'bm_george',
  'bm_lewis', 'bf_alice', 'bf_lily', 'bm_daniel', 'bm_fable',
];

if (!flags.length) {
  console.log('\nNo hay audios marcados en el archivo.\n');
  process.exit(0);
}

const byVoice = new Map<string, Flag[]>();
for (const f of flags) {
  const g = byVoice.get(f.voice) ?? [];
  g.push(f);
  byVoice.set(f.voice, g);
}

console.log(`\n${flags.length} audio(s) marcado(s), en ${byVoice.size} voz(ces):\n`);

// Kokoro nombra las voces <región><género>_: af_=US fem, am_=US masc, bf_=GB fem, bm_=GB masc.
const gender = (v: string) => (v[1] === 'f' ? 'F' : 'M');
const region = (v: string) => (v[0] === 'b' ? 'en-GB' : 'en-US');

for (const [voice, fs] of [...byVoice.entries()].sort((a, b) => b[1].length - a[1].length)) {
  const spk = [...speakers.values()].find((s) => s.voice.kokoro === voice);
  console.log(`  ▓ ${voice}  (${spk?.displayName ?? '?'}, speaker "${spk?.id}")  — ${fs.length} marca(s)`);
  for (const f of fs) console.log(`      ${f.audioKey.padEnd(24)} "${f.text}"`);

  if (fs.length >= 2 && spk) {
    // Sugerir reemplazos libres del mismo género y región: mantiene la coherencia.
    const alt = KOKORO_ALL.filter(
      (v) => !inUse.has(v) && gender(v) === gender(voice) && region(v) === region(voice)
    );
    console.log(
      `      → varias marcas en esta voz. Probá cambiar speakers.json "${spk.id}".voice.kokoro a: ` +
        `${alt.slice(0, 4).join(', ') || '(no quedan libres del mismo tipo)'}`
    );
  } else {
    console.log('      → caso aislado. Probá regenerar (--force --only=' + fs[0]!.audioKey + ') o slowVariant.');
  }
  console.log();
}

console.log('Después de editar speakers.json: npm run build:audio -- --force\n');
