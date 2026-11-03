/**
 * Tests de las exposiciones con diagrama: que cada señalamiento siga anclado al
 * texto de su versión y apunte a algo que el diagrama dibuja.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { talks } from '../content/talks.ts';
import { diagramSpots, resolveCues, spotAt, talkFor } from '../src/data/talks.ts';
import { versionChunks } from '../src/data/reference.ts';
import type { Atom } from '../content/schema.ts';

const atomById = (id: string): Atom => {
  const [course, unit] = id.split('.');
  const file = join(import.meta.dirname, '..', 'content', course!, `unit-${unit!.slice(1)}.json`);
  const atom = (JSON.parse(readFileSync(file, 'utf8')) as { atoms: Atom[] }).atoms.find((a) => a.id === id);
  assert.ok(atom, `no existe el átomo ${id}`);
  return atom!;
};

for (const talk of talks) {
  const atom = atomById(talk.atomId);
  const versionIdx =
    atom.kind === 'production' ? (atom.modelVariantLabels?.indexOf(talk.version) ?? -1) + 1 : 0;

  test(`${talk.atomId} ${talk.version}: la versión existe y se encuentra`, () => {
    assert.ok(versionIdx > 0, `no hay variante "${talk.version}" en ${talk.atomId}`);
    assert.equal(talkFor(atom, versionIdx), talk);
  });

  test(`${talk.atomId} ${talk.version}: cada señalamiento está en el texto, en orden`, () => {
    const sentences = versionChunks(atom as Extract<Atom, { kind: 'production' }>, versionIdx).map((c) => c.text);
    const resolved = resolveCues(sentences, talk.cues);
    // Arranca señalando desde la primera palabra.
    assert.deepEqual([resolved[0]!.sentence, resolved[0]!.frac], [0, 0]);
    for (let i = 1; i < resolved.length; i++) {
      const [a, b] = [resolved[i - 1]!, resolved[i]!];
      assert.ok(b.sentence > a.sentence || (b.sentence === a.sentence && b.frac > a.frac), `"${talk.cues[i]!.at}" fuera de orden`);
    }
  });

  test(`${talk.atomId} ${talk.version}: cada señalamiento apunta a algo del diagrama`, () => {
    const spots = diagramSpots(talk.diagram);
    assert.equal(spots.length, new Set(spots).size, 'hay ids de spot repetidos');
    for (const c of talk.cues) {
      if (c.spot) assert.ok(spots.includes(c.spot), `"${c.at}" apunta a "${c.spot}", que el diagrama no tiene`);
    }
  });
}

test('spotAt: lo último que la voz ya pasó', () => {
  const cues = resolveCues(['One two. Three four.', 'Five six.'], [
    { at: 'One', spot: 'a' },
    { at: 'Three', spot: 'b' },
    { at: 'Five', spot: null },
  ]);
  assert.equal(spotAt(cues, 0, 0), 'a');
  assert.equal(spotAt(cues, 0, 0.3), 'a');
  assert.equal(spotAt(cues, 0, 0.6), 'b');
  assert.equal(spotAt(cues, 1, 0), null);
});

test('resolveCues: una frase que ya no está en el texto se avisa', () => {
  assert.throws(() => resolveCues(['Hello there.'], [{ at: 'Goodbye', spot: 'x' }]), /Goodbye/);
});
