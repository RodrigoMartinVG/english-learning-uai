/**
 * talks.ts — las exposiciones "con el diagrama": un guion modelo + el esquema que lo
 * acompaña + qué parte del esquema señala la voz en cada momento (el láser).
 *
 * Es contenido, como kokoro-voices.ts: datos tipados, sin lógica. La lógica (resolver
 * los señalamientos contra las oraciones del texto) vive en src/data/talks.ts, y
 * tests/talks.test.ts verifica que cada `at` siga apareciendo en el texto: si se
 * retoca la versión y una frase ancla desaparece, el test lo dice.
 *
 * Cada señalamiento se ANCLA A UNA FRASE del texto, no a un tiempo: el láser se mueve
 * cuando la voz llega a esa frase, así que funciona igual en cualquier voz y velocidad.
 */

/** Un tramo de texto. Con `[spot, texto]` el tramo se puede señalar. `**x**` = énfasis. */
export type Run = string | readonly [spot: string, text: string];

/** Una línea del diagrama: uno o varios tramos. Sin `indent` lleva viñeta; con
 *  `indent` va sangrada y sin viñeta (un punto numerado, o la continuación de uno). */
export interface TalkLine {
  runs: readonly Run[];
  indent?: 1 | 2;
}

export type TalkBox =
  | { kind: 'list'; spot: string; title: string; lines: readonly TalkLine[] }
  | {
      kind: 'columns';
      spot: string;
      title: string;
      columns: readonly { spot: string; title: string; lines: readonly TalkLine[] }[];
    }
  | {
      kind: 'table';
      spot: string;
      title: string;
      /** Encabezados de columna; cada celda es un tramo (con `\n` para partir línea). */
      head: readonly Run[];
      rows: readonly (readonly Run[])[];
    };

export interface TalkDiagram {
  title: Run;
  author: Run;
  purpose: Run;
  boxes: readonly TalkBox[];
}

/** El punto que señala el diagrama entero ("I will refer to this diagram"). */
export const WHOLE_DIAGRAM = 'diagram';

/** Cuando la voz llega a `at` (texto literal de la versión), el láser va a `spot`.
 *  `spot: null` apaga el láser (el cierre); `WHOLE_DIAGRAM` enmarca todo el esquema.
 *  Van en el orden en que se dicen. */
export interface TalkCue {
  at: string;
  spot: string | null;
}

export interface Talk {
  atomId: string;
  /** El nombre de la versión en `modelVariantLabels` ("A-4"). */
  version: string;
  /** El archivo de texto del mismo diagrama, para dibujarlo a mano. */
  source: string;
  diagram: TalkDiagram;
  cues: readonly TalkCue[];
}

const line = (...runs: Run[]): TalkLine => ({ runs });
const sub = (indent: 1 | 2, ...runs: Run[]): TalkLine => ({ runs, indent });

/** Inglés 2, Unidad 5: "Tea and nineteenth century physics", Versión A-4. */
const teaA4: Talk = {
  atomId: 'en2.u5.pr.002',
  version: 'A-4',
  source: 'diagrama_A-4.txt',
  diagram: {
    title: ['title', 'Tea and nineteenth century physics'],
    author: ['author', 'Hannah Darken'],
    purpose: ['purpose', '**PURPOSE** → thermodynamics for non-specialists · everyday example'],
    // Palabras disparadoras y flechas, no oraciones: el diagrama es para RECUPERAR el
    // texto al decirlo. Si trae la oración entera, la voz termina leyéndola.
    boxes: [
      {
        kind: 'list',
        spot: 'b1',
        title: '1. The everyday fact',
        lines: [
          line(['b1-cup', 'hot tea · table · cooler room'], ' ', ['b1-cools', '→ cools down'], ' / ', ['b1-never', 'never hotter']),
          line(['b1-why', '**WHY?**'], ' ', ['b1-thermo', '→ **THERMODYNAMICS** (heat · heat flow)']),
          line(['b1-century', '19th century'], ' ', ['b1-today', '→ today: weather · black holes']),
        ],
      },
      {
        kind: 'columns',
        spot: 'b2',
        title: '2. Two key ideas',
        columns: [
          {
            spot: 'b2-temp',
            title: 'Temperature',
            lines: [
              line(['b2-temp-bulk', '**bulk property** ← molecules + atoms in motion']),
              line(['b2-temp-cup', 'tea cooling → molecules slowing']),
            ],
          },
          {
            spot: 'b2-ent',
            title: 'Entropy',
            lines: [
              line(['b2-ent-re', 're-arrange molecules → looks the same']),
              line(['b2-ent-ways', '= **HOW MANY WAYS**']),
            ],
          },
        ],
      },
      {
        kind: 'table',
        spot: 'b3',
        title: '3. The four laws',
        head: [['b3-h-law', 'Law'], ['b3-h-text', 'The text'], ['b3-h-cup', 'Our cup']],
        rows: [
          [
            ['b3-0-law', 'Zeroth'],
            ['b3-0-text', 'A ~ C, B ~ C → A ~ B\n(~ no net heat flow)'],
            ['b3-0-cup', 'thermometer: tea = room\n→ stops cooling'],
          ],
          [
            ['b3-1-law', 'First'],
            ['b3-1-text', 'energy: not created,\nnot destroyed'],
            ['b3-1-cup', 'heat → into the room'],
          ],
          [
            ['b3-2-law', 'Second'],
            ['b3-2-text', 'isolated system:\nentropy ↑ → **MAX** at equilibrium'],
            ['b3-2-cup', 'cup + room\n→ never hotter'],
          ],
          [
            ['b3-3-law', 'Third'],
            ['b3-3-text', 'T → absolute zero (lowest)\nentropy → constant **MIN**'],
            ['b3-3-cup', '—'],
          ],
        ],
      },
      {
        kind: 'list',
        spot: 'b4',
        title: '4. My future profession: mathematics',
        lines: [
          line(['b4-att', 'caught my attention:']),
          sub(1, ['b4-1', '① entropy = **COUNTING** → combinatorics · probability']),
          sub(1, ['b4-2', "② author's method: hard idea + everyday example"]),
          sub(2, ['b4-tool', '→ **TOOL**: explain to non-specialists']),
          line(['b4-rec', '**RECOMMEND** → other math students']),
        ],
      },
    ],
  },
  cues: [
    { at: "Today I'm going to talk about text 1", spot: 'title' },
    { at: 'by Hannah Darken', spot: 'author' },
    { at: 'this diagram', spot: WHOLE_DIAGRAM },
    { at: 'At the top', spot: 'purpose' },
    { at: "Let's start with the everyday fact", spot: 'b1' },
    { at: 'a hot cup of tea on a table', spot: 'b1-cup' },
    { at: 'The tea always cools down', spot: 'b1-cools' },
    { at: 'it never becomes hotter', spot: 'b1-never' },
    { at: 'Why?', spot: 'b1-why' },
    { at: 'Thermodynamics, the theory', spot: 'b1-thermo' },
    { at: 'It was born in the nineteenth century', spot: 'b1-century' },
    { at: 'but today it plays a part', spot: 'b1-today' },
    { at: 'we need two key ideas', spot: 'b2' },
    { at: 'On the left, temperature', spot: 'b2-temp' },
    { at: "It's a bulk property", spot: 'b2-temp-bulk' },
    { at: 'So, while our tea is cooling down', spot: 'b2-temp-cup' },
    { at: 'On the right, entropy', spot: 'b2-ent' },
    { at: 'If we re-arranged', spot: 'b2-ent-re' },
    { at: 'Entropy counts', spot: 'b2-ent-ways' },
    // "these two ideas" vuelve a señalar el recuadro 2 antes de pasar a la tabla.
    { at: 'With these two ideas', spot: 'b2' },
    { at: 'the four laws, in this table', spot: 'b3' },
    { at: 'The zeroth law', spot: 'b3-0-law' },
    { at: 'if two systems are in thermal equilibrium', spot: 'b3-0-text' },
    // La primera vez, la columna entera ("Our cup"); después, su celda.
    { at: 'For our cup of tea', spot: 'b3-h-cup' },
    { at: 'when a thermometer', spot: 'b3-0-cup' },
    { at: 'The first law', spot: 'b3-1-law' },
    { at: 'energy cannot be created', spot: 'b3-1-text' },
    { at: 'So the heat of our tea', spot: 'b3-1-cup' },
    { at: 'The second law', spot: 'b3-2-law' },
    { at: 'in an isolated system', spot: 'b3-2-text' },
    { at: 'like the cup and the room together', spot: 'b3-2-cup' },
    { at: 'entropy tends to increase', spot: 'b3-2-text' },
    { at: "That's why the tea never becomes hotter", spot: 'b3-2-cup' },
    { at: 'the third law', spot: 'b3-3-law' },
    { at: 'near absolute zero', spot: 'b3-3-text' },
    { at: 'Now, the last part', spot: 'b4' },
    { at: 'two things caught my attention', spot: 'b4-att' },
    { at: 'First, entropy is really', spot: 'b4-1' },
    { at: "Second, the author's method", spot: 'b4-2' },
    { at: 'As a future mathematician', spot: 'b4-tool' },
    { at: 'I would recommend this text', spot: 'b4-rec' },
    { at: "And that's all", spot: null },
  ],
};

export const talks: readonly Talk[] = [teaA4];
