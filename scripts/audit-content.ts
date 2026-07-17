/**
 * audit-content.ts — la CALIDAD del contenido, no su validez.
 *
 * validate-content.ts responde "¿es correcto?". Esto responde "¿es bueno?":
 * aspectos flacos, dificultad desbalanceada, frases sin fonética, ejercicios que
 * siempre preguntan lo mismo. No falla el build —la calidad es un juicio, no una
 * regla— pero pone los números sobre la mesa para decidir qué mejorar.
 *
 *   npm run audit
 */

import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { atomInAspect, type Atom, type UnitFile } from '../content/schema.ts';
import { mechanics } from '../src/mechanics/registry.ts';

const CONTENT = join(import.meta.dirname, '..', 'content');

const units: UnitFile[] = [];
for (const c of readdirSync(CONTENT, { withFileTypes: true })) {
  if (!c.isDirectory()) continue;
  for (const f of readdirSync(join(CONTENT, c.name))) {
    if (f.endsWith('.json')) units.push(JSON.parse(readFileSync(join(CONTENT, c.name, f), 'utf8')));
  }
}

let issues = 0;
const flag = (msg: string) => {
  issues++;
  console.log(`  ⚠ ${msg}`);
};

for (const u of units) {
  console.log(`\n═══ ${u.course.toUpperCase()} · Unidad ${u.unit}: ${u.title} ═══`);
  const A = u.atoms;

  // 1. Balance de dificultad. La escalera necesita punta, no solo base.
  console.log('\nDificultad:');
  const byDiff = [1, 2, 3, 4, 5].map((d) => A.filter((a) => a.difficulty === d).length);
  byDiff.forEach((n, i) => console.log(`  nivel ${i + 1}: ${String(n).padStart(3)} ${'█'.repeat(n)}`));
  const top = byDiff[3]! + byDiff[4]!;
  const bottom = byDiff[0]! + byDiff[1]!;
  if (top < bottom / 4)
    flag(`producción escasa: ${top} átomos en niveles 4-5 contra ${bottom} en 1-2. El final oral se apoya en los altos.`);

  // 2. Aspectos flacos o con poca variedad de práctica.
  console.log('\nAspectos:');
  for (const asp of [...u.aspects].sort((a, b) => a.order - b.order)) {
    const pool = A.filter((a) => atomInAspect(a, asp));
    const mechs = new Set(pool.flatMap((at) => mechanics.filter((m) => m.accepts(at)).map((m) => m.id)));
    const line = `  ${String(asp.order).padStart(2)}. ${asp.title.slice(0, 28).padEnd(29)} ${String(pool.length).padStart(2)} átomos · ${mechs.size} práctica(s)`;
    console.log(line);
    if (pool.length < 6) flag(`aspecto flaco "${asp.title}": ${pool.length} átomos, las sesiones van a repetir.`);
    if (mechs.size < 3) flag(`aspecto monótono "${asp.title}": solo ${mechs.size} práctica(s) distinta(s).`);
  }

  // 3. Frases sin apoyo fonético — Shadowing y Pares mínimos lo aprovechan.
  const phrases = A.filter((a): a is Extract<Atom, { kind: 'phrase' }> => a.kind === 'phrase');
  const noIpa = phrases.filter((p) => !p.ipa).length;
  console.log(`\nFonética: ${noIpa}/${phrases.length} frases sin IPA`);
  if (noIpa === phrases.length && phrases.length > 0)
    flag('ninguna frase tiene IPA: Shadowing no puede mostrar la transcripción fonética.');

  // 4. Ejercicios chicos: si un exercise tiene 1-2 ítems, siempre pregunta lo mismo.
  const thin = A.filter((a) => a.kind === 'exercise' && a.items.length <= 2);
  if (thin.length) flag(`${thin.length} ejercicio(s) de ≤2 ítems: van a repetir el mismo ítem. (${thin.map((a) => a.id).join(', ')})`);

  // 5. qa sin variantes de pregunta: Ping-Pong siempre formula igual.
  const qaThin = A.filter((a) => a.kind === 'qa' && a.promptVariants.length === 0);
  if (qaThin.length) flag(`${qaThin.length} pregunta(s) sin variantes: siempre se formulan igual.`);
}

console.log(`\n${issues === 0 ? '✓ sin observaciones de calidad' : `${issues} observación(es) de calidad — no bloquean, orientan.`}\n`);
