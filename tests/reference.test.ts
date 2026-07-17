/**
 * Tests de la guía de expresiones (derivación desde los átomos).
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expressionGuide, modelScripts } from '../src/data/reference.ts';
import type { Atom } from '../content/schema.ts';

const unit = JSON.parse(
  readFileSync(join(import.meta.dirname, '..', 'content', 'en1', 'unit-1.json'), 'utf8')
) as { atoms: Atom[] };

test('agrupa expresiones por función comunicativa', () => {
  const g = expressionGuide(unit.atoms);
  assert.ok(g.length >= 10, `esperaba varios objetivos, hubo ${g.length}`);
  const nombre = g.find((x) => x.fn === 'ask.origin');
  assert.ok(nombre, 'debería existir el objetivo ask.origin');
  // "Where are you from?" y sus variantes.
  assert.ok(nombre!.says.some((e) => /where are you from/i.test(e.text)));
  assert.ok(nombre!.says.length >= 2, 'debería tener varias formas de decirlo');
});

test('solo incluye objetivos con MÁS de una alternativa', () => {
  const g = expressionGuide(unit.atoms);
  for (const grp of g) {
    assert.ok(grp.says.length >= 2 || grp.replies.length >= 2, `${grp.fn} tiene una sola forma`);
  }
});

test('no repite la misma expresión dentro de un objetivo', () => {
  const g = expressionGuide(unit.atoms);
  for (const grp of g) {
    const norm = grp.says.map((e) => e.text.toLowerCase().replace(/[^\w]/g, ''));
    assert.equal(norm.length, new Set(norm).size, `${grp.fn} tiene expresiones repetidas`);
  }
});

test('las expresiones traen su clave de audio', () => {
  const g = expressionGuide(unit.atoms);
  const conAudio = g.flatMap((x) => x.says).filter((e) => e.audioKey);
  assert.ok(conAudio.length > 0, 'al menos algunas expresiones deberían tener audioKey');
});

test('modelScripts: producción con sus versiones', () => {
  const s = modelScripts(unit.atoms);
  assert.ok(s.length >= 1);
  const intro = s.find((x) => /presentarte/i.test(x.title));
  assert.ok(intro, 'debería estar el script de presentarse');
  // modelAnswer + modelVariants.
  assert.ok(intro!.versions.length >= 2, 'debería tener versiones alternativas');
  assert.ok(intro!.versions[0]!.audioKey, 'la primera versión (modelAnswer) tiene audio');
});
