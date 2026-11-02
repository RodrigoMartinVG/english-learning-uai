/**
 * Tests del Listening continuo: QUÉ entra a la tira y con qué clave de audio.
 *
 * Lo que se cuida acá es el contrato con build-audio. Si el runtime pide una clave
 * que el build no generó, el ítem suena con la voz del navegador en vez de la voz
 * pregenerada — y eso no falla, solo suena mal. Un test es la única forma de notarlo.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { listenItems } from '../src/engine/listen.ts';
import { splitSentences } from '../content/sentences.ts';
import type { Atom } from '../content/schema.ts';

const load = (course: string, unit: number): Atom[] =>
  (
    JSON.parse(
      readFileSync(join(import.meta.dirname, '..', 'content', course, `unit-${unit}.json`), 'utf8')
    ) as { atoms: Atom[] }
  ).atoms;

const en2u1 = load('en2', 1);
const manifest = JSON.parse(
  readFileSync(join(import.meta.dirname, '..', 'public', 'audio', 'en2', 'manifest.json'), 'utf8')
) as { entries: Record<string, unknown> };

test('listen: nada de palabras sueltas, y ningún párrafo entero', () => {
  const items = listenItems(en2u1, 'en2', 1);
  assert.ok(items.length > 50, `pocos ítems: ${items.length}`);
  for (const it of items) {
    assert.ok(it.text.trim().split(/\s+/).length >= 2, `ítem de una sola palabra: "${it.text}"`);
  }
  // Las oraciones DE LOS TEXTOS sí tienen que venir de a una: un párrafo es una
  // lectura, no un ítem de listening.
  for (const it of items.filter((i) => i.source === 'text')) {
    assert.equal(splitSentences(it.text).length, 1, `párrafo sin partir: "${it.text}"`);
  }
});

test('listen: una frase del material NO se parte, aunque traiga dos oraciones', () => {
  // "Where is the apple? It is in the fridge." es UN ítem: el material lo escribió
  // como par pregunta-respuesta y su mp3 es uno solo. Partirlo por el punto dejaría
  // dos mitades sin audio propio y rompería el par, que es lo que se está enseñando.
  const items = listenItems(en2u1, 'en2', 1);
  const par = items.find((i) => i.key === 'en2.u1.p.050');
  assert.ok(par, 'no está el átomo del par pregunta-respuesta');
  assert.equal(par.text, 'Where is the apple? It is in the fridge.');
  assert.equal(par.source, 'phrase');
});

test('listen: no entra el vocabulario suelto (lexemes) ni el deletreo', () => {
  const items = listenItems(load('en1', 1), 'en1', 1);
  const lexemeIds = new Set(load('en1', 1).filter((a) => a.kind === 'lexeme').map((a) => a.id));
  for (const it of items) {
    assert.ok(!lexemeIds.has(it.key), `entró un lexeme: ${it.key}`);
    assert.ok(!/^[A-Za-z][.,]? [A-Za-z][.,]? [A-Za-z][.,]?/.test(it.text), `deletreo: "${it.text}"`);
  }
});

test('listen: las oraciones de los textos entran, con su traducción', () => {
  const items = listenItems(en2u1, 'en2', 1);
  const deTexto = items.filter((i) => i.source === 'text');
  assert.equal(deTexto.length, 11, `el texto de en2.u1 aporta 11 oraciones, dio ${deTexto.length}`);
  for (const it of deTexto) {
    assert.ok(it.gloss, `sin traducción: "${it.text}"`);
    assert.ok(it.from, `sin título del texto: "${it.text}"`);
  }
});

test('listen: cada ítem tiene su mp3 generado (contrato con build-audio)', () => {
  // El bug que esto ataja: el runtime arma la clave por su cuenta y el build la arma
  // por la suya. Si divergen, no explota nada — el ítem cae a la voz del navegador.
  const items = listenItems(en2u1, 'en2', 1);
  const faltan = items.filter((i) => !(i.key in manifest.entries));
  assert.deepEqual(
    faltan.map((i) => `${i.key} — ${i.text}`),
    [],
    'hay ítems sin audio pregenerado'
  );
});

test('listen: la traducción se empareja con la oración correcta', () => {
  // Desalinear traducciones es el error silencioso del modo: cada oración mostraría
  // la traducción de otra y se leería como si estuviera bien.
  const items = listenItems(en2u1, 'en2', 1);
  const primera = items.find((i) => i.source === 'text' && i.text.startsWith('Lunch is a light'));
  assert.ok(primera, 'no se encontró la oración de prueba');
  assert.equal(primera.gloss, 'El almuerzo es una comida liviana.');
});

test('listen: es determinista (no baraja; eso lo hace la vista)', () => {
  const a = listenItems(en2u1, 'en2', 1).map((i) => i.key);
  const b = listenItems(en2u1, 'en2', 1).map((i) => i.key);
  assert.deepEqual(a, b);
});
