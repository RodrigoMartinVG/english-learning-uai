/**
 * build-coverage.ts — rastreador de cobertura de vocabulario.
 *
 * Cruza las listas de frecuencia reales (content/voc1/spec/sources/*.txt: NGSL, NAWL)
 * con los lexemas YA construidos en content/voc1/unit-*.json, y responde la pregunta
 * del curso: "¿cuánto cubrimos y qué falta?".
 *
 * Genera content/voc1/spec/cobertura.csv (list,word,status,unit) y un resumen por lista.
 * No toca contenido: solo lee y reporta. Correr con `npm run coverage`.
 */

import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const SOURCES_DIR = join(ROOT, 'content', 'voc1', 'spec', 'sources');
const UNITS_DIR = join(ROOT, 'content', 'voc1');
const OUT_CSV = join(ROOT, 'content', 'voc1', 'spec', 'cobertura.csv');

/** Palabras de un .txt: separa por comas/saltos, saltea comentarios (#), normaliza. */
function readList(file: string): string[] {
  const raw = readFileSync(file, 'utf8');
  const words = raw
    .split(/\r?\n/)
    .filter((line) => !line.trim().startsWith('#'))
    .join(',')
    .split(/[,\s]+/)
    .map((w) => w.trim().toLowerCase())
    .filter(Boolean);
  return [...new Set(words)];
}

/** Lexemas ya construidos: word (minúscula) → número de unidad donde aparece. */
function builtLexemes(): Map<string, number> {
  const covered = new Map<string, number>();
  if (!existsSync(UNITS_DIR)) return covered;
  const files = readdirSync(UNITS_DIR).filter((f) => /^unit-.*\.json$/.test(f));
  for (const f of files) {
    const data = JSON.parse(readFileSync(join(UNITS_DIR, f), 'utf8')) as {
      atoms?: Array<{ kind?: string; word?: string; unit?: number }>;
    };
    for (const a of data.atoms ?? []) {
      if (a.kind === 'lexeme' && a.word) {
        covered.set(a.word.toLowerCase(), a.unit ?? 0);
      }
    }
  }
  return covered;
}

/** Nombre de lista a partir del archivo: ngsl.txt → NGSL. */
const listName = (file: string) => file.replace(/\.txt$/i, '').toUpperCase();

function main(): void {
  if (!existsSync(SOURCES_DIR)) {
    console.error(`✗ no existe ${SOURCES_DIR}. Poné ngsl.txt / nawl.txt ahí.`);
    process.exit(1);
  }
  const sourceFiles = readdirSync(SOURCES_DIR)
    .filter((f) => f.toLowerCase().endsWith('.txt'))
    .sort();
  if (!sourceFiles.length) {
    console.error(`✗ sin listas .txt en ${SOURCES_DIR}.`);
    process.exit(1);
  }

  const covered = builtLexemes();
  const rows: string[] = ['list,word,status,unit'];
  console.log(`\ncobertura de vocabulario (voc1)\n`);

  for (const file of sourceFiles) {
    const list = listName(file);
    const words = readList(join(SOURCES_DIR, file));
    let done = 0;
    for (const w of words) {
      const unit = covered.get(w);
      const status = unit !== undefined ? 'hecho' : 'pendiente';
      if (unit !== undefined) done++;
      rows.push(`${list},${w},${status},${unit ?? ''}`);
    }
    const pct = words.length ? ((done / words.length) * 100).toFixed(1) : '0.0';
    console.log(`  ${list.padEnd(6)} ${String(done).padStart(4)} / ${words.length}  (${pct}%)  · faltan ${words.length - done}`);
  }

  writeFileSync(OUT_CSV, rows.join('\n') + '\n');
  console.log(`\n✓ ${OUT_CSV.replace(ROOT + '\\', '').replace(ROOT + '/', '')} — ${rows.length - 1} filas\n`);
}

main();
