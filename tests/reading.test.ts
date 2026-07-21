/**
 * Tests del schema de la Unidad 5: el átomo `reading` (texto de estudio) y las
 * respuestas con modo. Son las piezas nuevas del contenido de textos; si el schema
 * las acepta mal, entra basura a la app o se rechaza contenido válido.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readingAtomSchema, qaAtomSchema, ANSWER_MODES } from '../content/schema.ts';

const baseFields = {
  course: 'en1',
  unit: 5,
  source: { origin: 'extracted', page: 6 },
  grammar: [],
  fn: [],
  topic: [],
  difficulty: 1,
};

const validReading = {
  ...baseFields,
  id: 'en1.u5.rd.001',
  kind: 'reading',
  textId: 'square',
  title: 'What is a square?',
  credit: { author: 'Hannah Darken', publication: 'plus.maths.org', url: 'https://plus.maths.org/content/what-square' },
  speaker: 'narrator',
  sections: [
    {
      heading: 'What is a square?',
      blocks: [
        { kind: 'para', text: 'A square is a shape with four straight sides of equal length.' },
        { kind: 'list', items: ['A plane has zero curvature.', 'A sphere has positive curvature.'] },
        { kind: 'figure', image: { src: '/img/en1-u5/square-honest.png', role: 'illustration', alt: 'A blue square with right-angle marks.' } },
      ],
    },
  ],
  afterReadingTask: 'Find 5 example sentences which use the Verb To Be.',
};

test('reading: acepta un texto de estudio válido', () => {
  const r = readingAtomSchema.safeParse(validReading);
  assert.ok(r.success, r.success ? '' : JSON.stringify(r.error.issues, null, 2));
});

test('reading: textId es obligatorio (es el ancla del aspecto)', () => {
  const { textId, ...withoutTextId } = validReading;
  assert.equal(readingAtomSchema.safeParse(withoutTextId).success, false);
});

test('reading: la url del credit debe ser una url', () => {
  const bad = { ...validReading, credit: { ...validReading.credit, url: 'no-es-url' } };
  assert.equal(readingAtomSchema.safeParse(bad).success, false);
});

test('reading: una figura exige alt (el original es inaccesible sin él)', () => {
  const bad = {
    ...validReading,
    sections: [{ blocks: [{ kind: 'figure', image: { src: '/img/x.png', role: 'illustration' } }] }],
  };
  assert.equal(readingAtomSchema.safeParse(bad).success, false);
});

test('respuestas con modo: qa acepta answers etiquetadas por modo', () => {
  const qa = {
    ...baseFields,
    id: 'en1.u5.qa.001',
    kind: 'qa',
    prompt: 'Can a triangle have three right angles?',
    promptVariants: [],
    replies: ['Yes, on a sphere.'],
    answers: [
      { text: 'The text says they add up to 270 degrees.', mode: 'quote' },
      { text: 'Yes, on a curved surface the angles add up to more than 180.', mode: 'paraphrase' },
      { text: 'This happens because the sphere has positive curvature.', mode: 'connect' },
      { text: 'What surprised me is that it just needs the equator and two longitudes.', mode: 'personal' },
    ],
    speaker: 'examiner',
    replySpeaker: 'student',
  };
  const r = qaAtomSchema.safeParse(qa);
  assert.ok(r.success, r.success ? '' : JSON.stringify(r.error.issues, null, 2));
});

test('respuestas con modo: rechaza un modo desconocido', () => {
  const qa = {
    ...baseFields,
    id: 'en1.u5.qa.002',
    kind: 'qa',
    prompt: 'x?',
    promptVariants: [],
    replies: ['y'],
    answers: [{ text: 'z', mode: 'summarize' }], // no está en ANSWER_MODES
    speaker: 'examiner',
    replySpeaker: 'student',
  };
  assert.equal(qaAtomSchema.safeParse(qa).success, false);
});

test('los 4 modos son los esperados', () => {
  assert.deepEqual([...ANSWER_MODES], ['quote', 'paraphrase', 'connect', 'personal']);
});
