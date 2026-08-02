/**
 * Tests del armado de sesiones. Cubre los bugs de diseño que encontramos: la
 * escalera que no subía, y el interleaving que no interleaveaba (12/12 iguales).
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { buildSession, type Scheduler, type Step } from '../src/engine/session.ts';
import { mechanics } from '../src/mechanics/registry.ts';
import type { Aspect, Atom } from '../content/schema.ts';

const unit = JSON.parse(
  readFileSync(join(import.meta.dirname, '..', 'content', 'en1', 'unit-1.json'), 'utf8')
) as { aspects: Aspect[]; atoms: Atom[] };
const { atoms, aspects } = unit;

const levelOf = (id: string) => mechanics.find((m) => m.id === id)!.level;
const runs = (steps: Step[]) => {
  let r = 0;
  for (let i = 1; i < steps.length; i++) if (steps[i]!.mechanicId === steps[i - 1]!.mechanicId) r++;
  return r;
};

test('descubrir: la escalera SUBE (termina más arriba de donde empieza)', () => {
  const s = buildSession(
    { scope: { kind: 'aspect', course: 'en1', unit: 1, aspectId: 'be' }, mode: 'discover', length: 12 },
    atoms,
    aspects,
    'be'
  );
  const levels = s.steps.map((st) => levelOf(st.mechanicId));
  assert.ok(levels.length > 0);
  assert.ok(levels[levels.length - 1]! >= levels[0]!, 'el último paso no está por debajo del primero');
  // Y llega a producción (nivel 4-5) en algún momento, no se queda abajo.
  assert.ok(Math.max(...levels) >= 4, 'la escalera llega a producción');
});

test('repaso: interleaving evita encadenar la misma mecánica', () => {
  // Sin scheduler → pickBalanced. El bug viejo daba 11/11 repeticiones.
  let worst = 0;
  for (let k = 0; k < 20; k++) {
    const s = buildSession({ scope: { kind: 'due' }, mode: 'review', length: 12 }, atoms, aspects, 'hoy');
    worst = Math.max(worst, runs(s.steps));
  }
  assert.ok(worst <= 3, `demasiadas repeticiones consecutivas: ${worst}`);
});

test('repaso: reparte entre mecánicas, no una sola (el desbalance viejo)', () => {
  const s = buildSession({ scope: { kind: 'due' }, mode: 'review', length: 12 }, atoms, aspects, 'hoy');
  const distintas = new Set(s.steps.map((st) => st.mechanicId)).size;
  assert.ok(distintas >= 2, 'una sesión de repaso usa más de una mecánica');
});

test('examen: solo mecánicas de nivel 5', () => {
  const s = buildSession({ scope: { kind: 'unit', course: 'en1', unit: 1 }, mode: 'exam', length: 12 }, atoms, aspects, 'final');
  for (const st of s.steps) assert.equal(levelOf(st.mechanicId), 5, `paso ${st.mechanicId} no es nivel 5`);
});

test('scope atoms: la sesión se limita a esos átomos', () => {
  const ids = ['en1.u1.p.009', 'en1.u1.p.032'];
  const s = buildSession({ scope: { kind: 'atoms', atomIds: ids }, mode: 'review', length: 12 }, atoms, aspects, 'débiles');
  for (const st of s.steps) assert.ok(ids.includes(st.atomId), `${st.atomId} fuera del scope`);
});

test('scheduler: lo vencido va primero', () => {
  // Un scheduler falso que marca un átomo como vencido y el resto no.
  const dueId = 'en1.u1.p.009';
  const sched: Scheduler = {
    isDue: (s) => s.atomId === dueId,
    isNew: () => false,
    retrievability: (s) => (s.atomId === dueId ? 0.1 : 0.9),
  };
  const s = buildSession({ scope: { kind: 'due' }, mode: 'review', length: 12 }, atoms, aspects, 'hoy', sched);
  assert.equal(s.steps[0]!.atomId, dueId, 'el vencido debería ser el primer paso');
});

test('repaso: un tema casi terminado estrena varios átomos nuevos, no uno', () => {
  // El bug del contador enganchado (76/80): casi todos los átomos ya empezados
  // (una mecánica tocada, el resto sin tocar → miles de tarjetas isNew), y unos
  // pocos átomos totalmente nuevos. Elegir "fresh" al azar casi nunca tocaba uno
  // de los nuevos, así que el contador de átomos subía de a uno. El cupo fresh
  // debe priorizar ÁTOMOS sin empezar y estrenar varios por tanda.
  const reachable = atoms.filter((a) => mechanics.some((m) => m.accepts(a)));
  const brandNew = new Set(reachable.slice(0, 3).map((a) => a.id));
  // Ancla no-nueva por átomo empezado: una mecánica tocada; todo lo demás, nuevo.
  const anchor = new Set<string>();
  for (const a of reachable) {
    if (brandNew.has(a.id)) continue;
    const m = mechanics.find((mm) => mm.accepts(a))!;
    anchor.add(`${a.id}|${m.id}`);
  }
  const sched: Scheduler = {
    isDue: () => false,
    isNew: (s) => (brandNew.has(s.atomId) ? true : !anchor.has(`${s.atomId}|${s.mechanicId}`)),
    retrievability: () => 0.9,
  };
  const s = buildSession(
    { scope: { kind: 'unit', course: 'en1', unit: 1 }, mode: 'review', length: 12 },
    atoms,
    aspects,
    'u1',
    sched
  );
  const estrenados = new Set(s.steps.filter((st) => brandNew.has(st.atomId)).map((st) => st.atomId));
  assert.ok(estrenados.size >= 3, `debería estrenar los 3 átomos nuevos, estrenó ${estrenados.size}`);
});

test('cada paso apunta a un átomo y mecánica reales', () => {
  const s = buildSession({ scope: { kind: 'unit', course: 'en1', unit: 1 }, mode: 'discover', length: 12 }, atoms, aspects, 'u1');
  const ids = new Set(atoms.map((a) => a.id));
  const mids = new Set(mechanics.map((m) => m.id));
  for (const st of s.steps) {
    assert.ok(ids.has(st.atomId), `átomo inexistente: ${st.atomId}`);
    assert.ok(mids.has(st.mechanicId), `mecánica inexistente: ${st.mechanicId}`);
  }
});
