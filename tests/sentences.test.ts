/**
 * Tests del divisor de oraciones (para las pausas del TTS). El riesgo real es
 * partir donde el punto NO cierra oración: abreviaturas, iniciales, deletreo.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { splitSentences } from '../scripts/tts/sentences.ts';

test('parte oraciones normales', () => {
  assert.deepEqual(splitSentences('Hi. OK. And you?'), ['Hi.', 'OK.', 'And you?']);
  assert.deepEqual(splitSentences('My name is Mary. And yours?'), ['My name is Mary.', 'And yours?']);
});

test('NO parte el deletreo (iniciales de una letra)', () => {
  assert.deepEqual(splitSentences('S. C. H. U. L. Z.'), ['S. C. H. U. L. Z.']);
});

test('NO parte abreviaturas ni p.m.', () => {
  assert.deepEqual(splitSentences('The Software class is at 4 p.m.'), ['The Software class is at 4 p.m.']);
  assert.deepEqual(splitSentences('Mrs. Lane is a headmistress.'), ['Mrs. Lane is a headmistress.']);
});

test('parte después de una abreviatura solo si sigue otra oración', () => {
  assert.deepEqual(splitSentences('Mr. Lane. He is the teacher.'), ['Mr. Lane.', 'He is the teacher.']);
});

test('una sola oración vuelve entera', () => {
  assert.deepEqual(splitSentences('Yes, there is a cafeteria on the tenth floor.'), [
    'Yes, there is a cafeteria on the tenth floor.',
  ]);
  assert.deepEqual(splitSentences('My address is 93 Lamont Ave.'), ['My address is 93 Lamont Ave.']);
});
