/**
 * Tests de la lógica de contenido: números, selector de aspectos, detección de
 * rúbrica. Son las funciones que la app y el validador comparten; si mienten,
 * mienten en los dos lados.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { canonicalNumbers, ordinalSuffix } from '../src/engine/grading/numbers.ts';
import { atomInAspect, ATOM_ID_RE, type Aspect, type Atom } from '../content/schema.ts';
import { checkRubric } from '../src/mechanics/oral-exam/mechanic.ts';

test('canonicalNumbers: cardinales, ordinales y compuestos', () => {
  assert.deepEqual(canonicalNumbers(['ninety', 'three']), ['93']);
  assert.deepEqual(canonicalNumbers(['twenty', 'seven']), ['27']);
  assert.deepEqual(canonicalNumbers(['tenth']), ['10th']);
  assert.deepEqual(canonicalNumbers(['third']), ['3rd']);
  assert.deepEqual(canonicalNumbers(['the', 'first', 'floor']), ['the', '1st', 'floor']);
});

test('ordinalSuffix: 1st/2nd/3rd y la excepción 11-13', () => {
  assert.equal(ordinalSuffix(1), '1st');
  assert.equal(ordinalSuffix(2), '2nd');
  assert.equal(ordinalSuffix(3), '3rd');
  assert.equal(ordinalSuffix(11), '11th');
  assert.equal(ordinalSuffix(13), '13th');
  assert.equal(ordinalSuffix(21), '21st');
});

test('ATOM_ID_RE: acepta ids válidos y rechaza inválidos', () => {
  assert.ok(ATOM_ID_RE.test('en1.u1.p.007'));
  assert.ok(ATOM_ID_RE.test('en1.u1.qa.012'));
  assert.ok(!ATOM_ID_RE.test('en1.u1.p.7')); // secuencia sin ceros
  assert.ok(!ATOM_ID_RE.test('en5.u1.p.007')); // curso inexistente
  assert.ok(!ATOM_ID_RE.test('p.007'));
});

test('atomInAspect: matchea por CUALQUIER dimensión', () => {
  const atom = { grammar: ['be.present.affirmative'], fn: ['greet'], topic: ['personal_info'] } as unknown as Atom;
  const byGrammar = { match: { grammar: ['be.present.affirmative'] } } as Aspect;
  const byFn = { match: { fn: ['greet'] } } as Aspect;
  const byTopic = { match: { topic: ['personal_info'] } } as Aspect;
  const noMatch = { match: { grammar: ['there-is.affirmative'] } } as Aspect;
  assert.equal(atomInAspect(atom, byGrammar), true);
  assert.equal(atomInAspect(atom, byFn), true);
  assert.equal(atomInAspect(atom, byTopic), true);
  assert.equal(atomInAspect(atom, noMatch), false);
});

test('checkRubric: detecta lo presente, marca lo ausente, deja null lo no verificable', () => {
  const prod = {
    rubric: [
      { text: 'usa there is', detect: '\\bthere is\\b' },
      { text: 'usa there are', detect: '\\bthere are\\b' },
      { text: 'orden de adjetivos' }, // sin detect → auto-chequeo (null)
    ],
  } as any;
  const checks = checkRubric(prod, 'there is a desk and a chair');
  assert.equal(checks[0]!.hit, true);
  assert.equal(checks[1]!.hit, false);
  assert.equal(checks[2]!.hit, null);
});
