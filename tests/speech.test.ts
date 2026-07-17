/**
 * Tests del motor de corrección de voz. Cubre los bugs reales que encontramos
 * usando la app: contracciones que no matcheaban, números en cifras vs letras,
 * el guion que borraba la separación.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalize, gradeSpeech, words, grammarHints } from '../src/engine/grading/speech.ts';

test('normalize: expande contracciones en ambos sentidos', () => {
  assert.equal(normalize("I'm a teacher"), normalize('I am a teacher'));
  assert.equal(normalize("he's German"), normalize('he is German'));
  assert.equal(normalize("they're here"), normalize('they are here'));
  assert.equal(normalize("isn't"), normalize('is not'));
});

test('normalize: quita puntuación pero conserva palabras', () => {
  assert.equal(normalize('What is your name?'), 'what is your name');
  assert.equal(normalize('  My   name,  Vito. '), 'my name vito');
});

test('normalize: el guion separa, no pega', () => {
  // El bug: "thirty-five" quedaba "thirtyfive" y no matcheaba con "thirty five".
  assert.equal(normalize('thirty-five'), normalize('thirty five'));
});

test('normalize: números a dígitos (el bug tenth/10th)', () => {
  assert.equal(normalize('on the tenth floor'), normalize('on the 10th floor'));
  assert.equal(normalize('I am thirty-five'), normalize('I am 35'));
  assert.equal(normalize('ninety three'), normalize('93'));
  assert.equal(normalize('the third floor'), normalize('the 3rd floor'));
  assert.equal(normalize('at four'), normalize('at 4'));
});

test('gradeSpeech: match exacto y con relleno del ASR', () => {
  assert.equal(gradeSpeech("I'm a systems manager.", 'I am a systems manager').match, true);
  // El ASR agrega muletillas: "um yes ...". El includes recíproco lo tolera.
  assert.equal(
    gradeSpeech('Yes, there is a cafeteria.', 'um yes there is a cafeteria').match,
    true
  );
});

test('gradeSpeech: detecta la palabra equivocada, no todo el resto', () => {
  const v = gradeSpeech('I am from Holland.', 'I am from Ireland');
  assert.equal(v.match, false);
  const wrong = v.words.filter((w) => w.status === 'wrong');
  assert.equal(wrong.length, 1);
  assert.equal(wrong[0]!.word, 'holland');
  assert.equal(wrong[0]!.heard, 'ireland');
});

test('gradeSpeech: palabra faltante se aísla (no arrastra el resto)', () => {
  // Si se come la primera palabra, un diff ingenuo marcaría todo mal.
  const v = gradeSpeech('Is there a cafeteria?', 'there a cafeteria');
  const missing = v.words.filter((w) => w.status === 'missing');
  assert.equal(missing.length, 1);
  assert.equal(missing[0]!.word, 'is');
  // El resto quedó bien alineado.
  assert.equal(v.words.filter((w) => w.status === 'ok').length, 3);
});

test('gradeSpeech: string vacío no rompe ni da match', () => {
  const v = gradeSpeech('Hello.', '');
  assert.equal(v.match, false);
  assert.equal(v.accuracy, 0);
});

test('words: parte en tokens normalizados', () => {
  assert.deepEqual(words("I'm here"), ['i', 'am', 'here']);
  assert.deepEqual(words(''), []);
});

test('grammarHints: usa formas HABLADAS, no dígitos', () => {
  // Los hints son para el reconocedor: "tenth", no "10th".
  const h = grammarHints(['on the tenth floor']);
  assert.ok(h.includes('tenth'));
  assert.ok(!/\b10th\b/.test(h));
});
