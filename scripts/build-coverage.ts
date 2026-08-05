/**
 * build-coverage.ts — rastreador de cobertura de vocabulario.
 *
 * Cruza las listas de frecuencia reales (content/voc1/spec/sources/) con los lexemas ya
 * construidos en content/voc1/unit-*.json, y responde la pregunta del curso: "¿cuánto
 * cubrimos y qué falta?" — por lista Y por nivel CEFR (la espiral).
 *
 * Fuentes:
 *   - *.txt  → lista de palabras (un denominador). Ej: ngsl.txt, nawl.txt.
 *   - *.csv  → `word,cefr` (denominador + banda CEFR). Ej: oxford5000.csv.
 * La banda CEFR de cualquier palabra sale de los .csv (Oxford 5000 hoy).
 *
 * Genera content/voc1/spec/cobertura.csv (list,word,cefr,status,unit). `npm run coverage`.
 */

import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const SOURCES_DIR = join(ROOT, 'content', 'voc1', 'spec', 'sources');
const UNITS_DIR = join(ROOT, 'content', 'voc1');
const OUT_CSV = join(ROOT, 'content', 'voc1', 'spec', 'cobertura.csv');
const CEFR_ORDER = ['a1', 'a2', 'b1', 'b2', 'c1', 'c2'];

const clean = (line: string) => line.trim();
const isComment = (line: string) => line.startsWith('#') || line === '';

/** Palabras de un .txt: separa por comas/saltos, saltea comentarios, normaliza. */
function readWordsTxt(file: string): string[] {
  const raw = readFileSync(file, 'utf8');
  const words = raw
    .split(/\r?\n/)
    .filter((l) => !clean(l).startsWith('#'))
    .join(',')
    .split(/[,\s]+/)
    .map((w) => w.trim().toLowerCase())
    .filter(Boolean);
  return [...new Set(words)];
}

/** Filas `word,cefr` de un .csv (saltea # y el encabezado). */
function readCsv(file: string): Array<{ word: string; cefr: string }> {
  const rows: Array<{ word: string; cefr: string }> = [];
  for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
    const l = clean(line);
    if (isComment(l) || l.toLowerCase().startsWith('word,')) continue;
    const [word, cefr = ''] = l.split(',');
    if (word) rows.push({ word: word.trim().toLowerCase(), cefr: cefr.trim().toLowerCase() });
  }
  return rows;
}

/** Lexemas ya construidos: word (minúscula) → número de unidad. */
function builtLexemes(): Map<string, number> {
  const covered = new Map<string, number>();
  if (!existsSync(UNITS_DIR)) return covered;
  for (const f of readdirSync(UNITS_DIR).filter((f) => /^unit-.*\.json$/.test(f))) {
    const data = JSON.parse(readFileSync(join(UNITS_DIR, f), 'utf8')) as {
      atoms?: Array<{ kind?: string; word?: string; unit?: number }>;
    };
    for (const a of data.atoms ?? []) {
      if (a.kind === 'lexeme' && a.word) covered.set(a.word.toLowerCase(), a.unit ?? 0);
    }
  }
  return covered;
}

const listName = (file: string) => file.replace(/\.(txt|csv)$/i, '').toUpperCase();

function main(): void {
  if (!existsSync(SOURCES_DIR)) {
    console.error(`✗ no existe ${SOURCES_DIR}`);
    process.exit(1);
  }
  const files = readdirSync(SOURCES_DIR)
    .filter((f) => /\.(txt|csv)$/i.test(f))
    .sort();

  // Mapa palabra → banda CEFR (de los .csv). Primera aparición gana.
  const cefrByWord = new Map<string, string>();
  const lists: Array<{ name: string; words: string[] }> = [];
  for (const f of files) {
    let words: string[];
    if (f.toLowerCase().endsWith('.csv')) {
      const rows = readCsv(join(SOURCES_DIR, f));
      for (const r of rows) if (r.cefr && !cefrByWord.has(r.word)) cefrByWord.set(r.word, r.cefr);
      words = [...new Set(rows.map((r) => r.word))];
    } else {
      words = readWordsTxt(join(SOURCES_DIR, f));
    }
    lists.push({ name: listName(f), words });
  }

  const covered = builtLexemes();
  const rows: string[] = ['list,word,cefr,status,unit'];
  console.log(`\ncobertura de vocabulario (voc1)\n`);

  // Por lista.
  for (const { name, words } of lists) {
    let done = 0;
    for (const w of words) {
      const unit = covered.get(w);
      const cefr = cefrByWord.get(w) ?? '';
      if (unit !== undefined) done++;
      rows.push(`${name},${w},${cefr},${unit !== undefined ? 'hecho' : 'pendiente'},${unit ?? ''}`);
    }
    const pct = words.length ? ((done / words.length) * 100).toFixed(1) : '0.0';
    console.log(`  ${name.padEnd(11)} ${String(done).padStart(4)} / ${String(words.length).padStart(4)}  (${pct}%)  · faltan ${words.length - done}`);
  }

  // Por nivel CEFR, sobre la UNIÓN de todas las palabras objetivo (la espiral).
  const union = new Set<string>(lists.flatMap((l) => l.words));
  const byBand = new Map<string, { total: number; done: number }>();
  for (const w of union) {
    const band = cefrByWord.get(w) ?? 'sin banda';
    const b = byBand.get(band) ?? { total: 0, done: 0 };
    b.total++;
    if (covered.has(w)) b.done++;
    byBand.set(band, b);
  }
  console.log(`\n  por nivel CEFR (unión de ${union.size} palabras objetivo):`);
  for (const band of [...CEFR_ORDER, 'sin banda']) {
    const b = byBand.get(band);
    if (b) console.log(`    ${band.padEnd(9)} ${String(b.done).padStart(4)} / ${String(b.total).padStart(4)}  · faltan ${b.total - b.done}`);
  }

  writeFileSync(OUT_CSV, rows.join('\n') + '\n');
  console.log(`\n✓ cobertura.csv — ${rows.length - 1} filas\n`);
}

main();
