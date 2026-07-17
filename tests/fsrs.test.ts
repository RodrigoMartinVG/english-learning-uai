/**
 * Tests del motor de repetición espaciada (FSRS). Verifica las propiedades que
 * importan para el aprendizaje, no la aritmética interna: acertar espacia,
 * fallar no manda al principio, y lo más olvidado sale primero.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { newCard, review, retrievability, isDue, isNew } from '../src/engine/srs/fsrs.ts';

const at = (iso: string) => new Date(iso);
const daysBetween = (a: string, b: string) =>
  (new Date(b).getTime() - new Date(a).getTime()) / 86_400_000;

test('una tarjeta nueva es nueva y no está vencida', () => {
  const c = newCard(at('2026-01-01'));
  assert.equal(isNew(c), true);
  assert.equal(isDue(c, at('2026-01-01')), false);
});

test('acertar repetido ESPACIA el próximo repaso', () => {
  let c = newCard(at('2026-01-01'));
  c = review(c, 3, at('2026-01-01'));
  const gap1 = daysBetween(c.lastReview!, c.due);
  c = review(c, 3, at(c.due));
  const gap2 = daysBetween(c.lastReview!, c.due);
  c = review(c, 3, at(c.due));
  const gap3 = daysBetween(c.lastReview!, c.due);
  assert.ok(gap2 > gap1, `esperaba ${gap2} > ${gap1}`);
  assert.ok(gap3 > gap2, `esperaba ${gap3} > ${gap2}`);
});

test('fallar NO reinicia la memoria (baja estabilidad, no a cero)', () => {
  let c = newCard(at('2026-01-01'));
  c = review(c, 3, at('2026-01-01'));
  c = review(c, 3, at(c.due));
  const stableBefore = c.stability;
  const diffBefore = c.difficulty;
  c = review(c, 1, at(c.due)); // fallo
  assert.ok(c.stability < stableBefore, 'la estabilidad baja al fallar');
  assert.ok(c.stability > 0.1, 'pero no se va a cero');
  assert.ok(c.difficulty > diffBefore, 'la dificultad sube al fallar');
  assert.equal(c.lapses, 1);
});

test('retrievability cae con el tiempo', () => {
  let c = newCard(at('2026-01-01'));
  c = review(c, 3, at('2026-01-01'));
  const rSoon = retrievability(c, at(c.lastReview!));
  const rLater = retrievability(c, at('2026-03-01'));
  assert.ok(rSoon > rLater);
  assert.ok(rSoon <= 1 && rLater >= 0);
});

test('lo más olvidado tiene menor retrievability (orden de repaso)', () => {
  const now = at('2026-06-01');
  let sabido = newCard(at('2026-01-01'));
  for (const d of ['2026-01-01', '2026-01-10', '2026-02-01']) sabido = review(sabido, 3, at(d));
  let reciente = newCard(at('2026-05-28'));
  reciente = review(reciente, 3, at('2026-05-29'));

  // El repasado hace poco se recuerda mejor que el visto una vez hace meses.
  assert.ok(retrievability(reciente, now) > retrievability(sabido, now));
});

test('isDue: vence cuando pasa la fecha, no antes', () => {
  let c = newCard(at('2026-01-01'));
  c = review(c, 3, at('2026-01-01'));
  assert.equal(isDue(c, at(c.due)), true);
  assert.equal(isDue(c, at('2026-01-01')), false);
});
