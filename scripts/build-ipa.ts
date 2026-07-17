/**
 * build-ipa.ts — completa el campo `ipa` de cada frase.
 *
 * Usa el paquete `phonemizer` (espeak-ng por debajo), que es EL MISMO que usa
 * Kokoro para sintetizar. Consecuencia clave: el IPA que mostramos coincide con
 * lo que el alumno escucha, no con una transcripción de diccionario que podría
 * diferir del audio.
 *
 * Fonemiza según el acento del hablante (en-US / en-GB), para que la
 * transcripción sea fiel a la voz que suena. El IPA es contenido (texto chico):
 * se guarda en el JSON y se versiona, a diferencia del audio.
 *
 *   npm run build:ipa
 */

import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { phonemize } from 'phonemizer';
import { speakersFileSchema, unitFileSchema, type Speaker } from '../content/schema.ts';

const ROOT = join(import.meta.dirname, '..');
const CONTENT = join(ROOT, 'content');

const speakers = new Map<string, Speaker>(
  speakersFileSchema
    .parse(JSON.parse(readFileSync(join(CONTENT, 'speakers.json'), 'utf8')))
    .speakers.map((s) => [s.id, s])
);

/** El fonemizador espera 'en-us' | 'en-gb'. Sale del acento del hablante. */
const langOf = (accent: string): string => (accent === 'en-GB' ? 'en-gb' : 'en-us');

async function ipaOf(text: string, lang: string): Promise<string> {
  const out = await phonemize(text, lang);
  return (Array.isArray(out) ? out.join(' ') : out).trim();
}

let updated = 0;
let unchanged = 0;

for (const course of readdirSync(CONTENT, { withFileTypes: true })) {
  if (!course.isDirectory()) continue;
  const dir = join(CONTENT, course.name);
  for (const f of readdirSync(dir)) {
    if (!f.endsWith('.json')) continue;
    const path = join(dir, f);
    const unit = unitFileSchema.parse(JSON.parse(readFileSync(path, 'utf8')));
    // Se reparsea el crudo para preservar formato/campos extra al escribir.
    const raw = JSON.parse(readFileSync(path, 'utf8')) as {
      atoms: { id: string; kind: string; text?: string; speaker?: string; ipa?: string }[];
    };

    let touched = false;
    for (const atom of raw.atoms) {
      if (atom.kind !== 'phrase' || !atom.text) continue;
      const sp = atom.speaker ? speakers.get(atom.speaker) : undefined;
      const lang = langOf(sp?.accent ?? 'en-US');
      const ipa = await ipaOf(atom.text, lang);
      if (atom.ipa === ipa) {
        unchanged++;
      } else {
        atom.ipa = ipa;
        touched = true;
        updated++;
      }
    }

    if (touched) writeFileSync(path, JSON.stringify(raw, null, 2) + '\n');
    console.log(`${course.name}/${f}: ${unit.atoms.filter((a) => a.kind === 'phrase').length} frases`);
  }
}

console.log(`\n✓ IPA: ${updated} actualizadas, ${unchanged} ya al día.\n`);
