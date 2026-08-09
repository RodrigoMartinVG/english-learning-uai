/**
 * manifest-fs.ts — E/S del manifest de audio, UN ARCHIVO POR CURSO.
 *
 * Cada curso tiene su propio `public/audio/<curso>/manifest.json` con solo sus
 * entradas. Antes había un único `audio-manifest.json` compartido: dos builds de
 * cursos distintos corriendo a la vez (p. ej. en2 y voc1 en sesiones paralelas)
 * mergeaban en el mismo archivo → carrera de escritura y contaminación en git al
 * commitear un curso. Con un archivo por curso, cada build toca SOLO el suyo:
 * aislamiento entre cursos, sin coordinación manual. Ver ARQUITECTURA.md §5.2.
 *
 * La app lo consume distinto (Vite `import.meta.glob` en src/data/content.ts, que
 * fusiona todos los per-curso en un solo índice). Este módulo es para los scripts
 * de Node (build-audio, audio-review), que usan `fs`.
 */

import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { z } from 'zod';

const manifestEntrySchema = z.object({
  src: z.string(),
  durationMs: z.number(),
  hash: z.string(),
  chars: z.number(),
});
export const manifestSchema = z.object({
  generatedAt: z.string(),
  provider: z.string(),
  entries: z.record(z.string(), manifestEntrySchema),
});
export type ManifestEntry = z.infer<typeof manifestEntrySchema>;
export type Manifest = z.infer<typeof manifestSchema>;

/** El curso al que pertenece una clave del manifest. Ej: "voc1.u1.p.001" → "voc1". */
export const courseOf = (key: string): string => key.split('.')[0]!;

const manifestPath = (audioDir: string, course: string) => join(audioDir, course, 'manifest.json');

/**
 * Lee y fusiona TODOS los manifests por-curso en un solo índice en memoria (para
 * los chequeos de cache y de huérfanos, que necesitan la foto completa). Devuelve
 * además qué cursos existían, para saber cuáles reescribir en un build completo.
 */
export function readAllManifests(audioDir: string): {
  entries: Record<string, ManifestEntry>;
  provider: string;
  courses: Set<string>;
} {
  const entries: Record<string, ManifestEntry> = {};
  const courses = new Set<string>();
  let provider = '';
  if (!existsSync(audioDir)) return { entries, provider, courses };
  for (const name of readdirSync(audioDir)) {
    const dir = join(audioDir, name);
    if (!statSync(dir).isDirectory()) continue; // saltea archivos sueltos en public/audio
    const p = manifestPath(audioDir, name);
    if (!existsSync(p)) continue;
    const m = manifestSchema.parse(JSON.parse(readFileSync(p, 'utf8')));
    Object.assign(entries, m.entries);
    if (m.provider) provider = m.provider;
    courses.add(name);
  }
  return { entries, provider, courses };
}

/**
 * Reescribe SOLO los manifests de los cursos indicados, agrupando las entradas por
 * prefijo de clave. NO toca los manifests de otros cursos: es lo que hace seguro
 * correr dos builds `--only` a la vez sin pisarse.
 */
export function writeManifestsByCourse(
  audioDir: string,
  allEntries: Record<string, ManifestEntry>,
  provider: string,
  coursesToWrite: Iterable<string>
): void {
  const byCourse = new Map<string, Record<string, ManifestEntry>>();
  for (const [key, entry] of Object.entries(allEntries)) {
    const c = courseOf(key);
    let bucket = byCourse.get(c);
    if (!bucket) byCourse.set(c, (bucket = {}));
    bucket[key] = entry;
  }
  const now = new Date().toISOString();
  for (const c of new Set(coursesToWrite)) {
    const dir = join(audioDir, c);
    mkdirSync(dir, { recursive: true });
    const out: Manifest = { generatedAt: now, provider, entries: byCourse.get(c) ?? {} };
    writeFileSync(manifestPath(audioDir, c), JSON.stringify(out, null, 2) + '\n');
  }
}
