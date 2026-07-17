/**
 * schema.ts — la ley del contenido.
 *
 * Implementa ARQUITECTURA.md §4. Todo archivo de content/ se valida contra esto,
 * en desarrollo y en CI. Si algo no pasa por acá, no entra a la app.
 *
 * Principio: el contenido son átomos con metadatos; las mecánicas son funciones
 * que los consumen. Los metadatos (grammar, fn, topic) NO son decorativos: son
 * lo que los selectores de las mecánicas usan para elegir qué mostrar. Un typo
 * en un tag no rompe nada ruidosamente — simplemente hace que un átomo no
 * aparezca nunca. Por eso son vocabularios cerrados y no strings libres.
 */

import { z } from 'zod';

/* ────────────────────────────── vocabularios cerrados ───────────────────────────── */

export const COURSES = ['en1', 'en2', 'en3', 'en4'] as const;

/** Estructuras gramaticales. Jerárquico: 'be.present.interrogative'. */
export const GRAMMAR_TAGS = [
  // Unidad 1 — Bienvenida
  'be.present.affirmative',
  'be.present.negative',
  'be.present.interrogative',
  'be.present.short-answer',
  'be.contractions',
  'pronouns.subject',
  'possessives.adjectives',
  'demonstratives',
  'articles.indefinite',
  'articles.definite',
  'there-is.affirmative',
  'there-is.negative',
  'there-is.interrogative',
  'wh-questions',
  'numbers.cardinal',
  'nationalities',
  'spelling.alphabet',
  // Unidad 2 — Estilo de vida
  'present-simple.affirmative',
  'present-simple.negative',
  'present-simple.interrogative',
  'present-simple.third-person',
  'present-simple.short-answer',
  'have-has',
  'time.at',
  'time.telling',
  // Unidad 3 — Gente
  'have-got.affirmative',
  'have-got.negative',
  'have-got.interrogative',
  'frequency-adverbs',
  'how-often',
  'prepositions.time',
  'arrangements',
  'family',
  // Unidad 4 — Lugares
  'can.ability',
  'can.request',
  'can.negative',
  'prepositions.place',
  'some-any',
  'how-much-many',
  'shopping',
  'directions',
  'would-like',
] as const;

/** Funciones comunicativas: qué HACE el hablante, no qué estructura usa. */
export const FUNCTION_TAGS = [
  'greet',
  'introduce-self',
  'ask.name',
  'ask.spelling',
  'ask.origin',
  'ask.age',
  'ask.occupation',
  'ask.marital-status',
  'ask.address',
  'ask.nationality',
  'ask.existence',
  'ask.location',
  'ask.possession',
  'ask.routine',
  'ask.time',
  'ask.frequency',
  'ask.permission',
  'ask.price',
  'ask.identity',
  'describe.place',
  'describe.person',
  'describe.routine',
  'state.fact',
  'confirm',
  'deny',
  'correct',
  'thank',
  'offer-help',
  'make-request',
  'propose-plan',
  'accept-plan',
  'give-directions',
  'classroom-language',
] as const;

/** Dominio temático. Se usa para generar distractores e interleaving. */
export const TOPIC_TAGS = [
  'personal_info',
  'origin_nationality',
  'occupation',
  'workplace',
  'campus',
  'objects',
  'classroom',
  'routine',
  'time',
  'family',
  'leisure',
  'home',
  'city',
  'shopping',
] as const;

/** Habilidades: una tarjeta de SRS es (atomId, skill). Ver ARQUITECTURA.md §7. */
export const SKILLS = ['perception', 'comprehension', 'retrieval', 'production'] as const;

/* ─────────────────────────────────── ids ────────────────────────────────────────── */

/** Código de id por tipo de átomo. Los ids son estables DE POR VIDA: el progreso
 *  del alumno apunta a ellos. Nunca se reusan ni se reordenan. */
export const KIND_CODE = {
  phrase: 'p',
  dialogue: 'd',
  qa: 'qa',
  lexeme: 'lx',
  contrast: 'ct',
  exercise: 'ex',
  production: 'pr',
  listening: 'ls',
} as const;

/** Formato: en1.u1.p.007 — curso.unidad.tipo.secuencia */
export const ATOM_ID_RE = /^(en[1-4])\.u([1-9]\d?)\.(p|d|qa|lx|ct|ex|pr|ls)\.(\d{3})$/;

export const atomIdSchema = z
  .string()
  .regex(ATOM_ID_RE, 'id inválido: se espera curso.unidad.tipo.NNN (ej. en1.u1.p.007)');

/* ──────────────────────────────── núcleo común ──────────────────────────────────── */

export const sourceSchema = z.object({
  /**
   * extracted → copiado del material oficial, tal cual (normalizando tipografía).
   * corrected → el material tiene una errata; guardamos la forma correcta + note.
   * synthetic → lo escribimos nosotros. Se declara SIEMPRE. Sin excepción.
   */
  origin: z.enum(['extracted', 'synthetic', 'corrected']),
  page: z.number().int().positive().optional(),
  section: z.string().min(1).optional(),
  /** Errata detectada, ambigüedad de la grilla, decisión de diseño. */
  note: z.string().min(1).optional(),
});

const atomBase = {
  id: atomIdSchema,
  course: z.enum(COURSES),
  unit: z.number().int().min(1).max(12),
  source: sourceSchema,
  grammar: z.array(z.enum(GRAMMAR_TAGS)),
  fn: z.array(z.enum(FUNCTION_TAGS)),
  topic: z.array(z.enum(TOPIC_TAGS)),
  /** Ruta de dificultad de ARQUITECTURA.md §2.3 / §6.2, de más guiado a más libre. */
  difficulty: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]),
  tags: z.array(z.string()).optional(),
};

/* ──────────────────────────────────── audio ─────────────────────────────────────── */

export const audioRefSchema = z.object({
  src: z.string().startsWith('/audio/'),
  durationMs: z.number().int().positive(),
  /** hash(text + speaker + rate). Invalida el cache si el texto cambia. */
  hash: z.string().min(8),
});

export const imageRefSchema = z.object({
  src: z.string().startsWith('/img/'),
  role: z.enum(['source-comic', 'exercise-data', 'illustration']),
  /** Obligatorio: el material original es 100% inaccesible. No repetimos ese error. */
  alt: z.string().min(1),
  /** Texto contenido DENTRO de la imagen, si lo hay. */
  transcribed: z.string().optional(),
});

/* ──────────────────────────────────── átomos ────────────────────────────────────── */

/** El átomo más importante: una oración pronunciable. */
export const phraseAtomSchema = z.object({
  ...atomBase,
  kind: z.literal('phrase'),
  text: z.string().min(1),
  /** Traducción de apoyo. Nunca protagonista. */
  gloss: z.string().optional(),
  ipa: z.string().optional(),
  speaker: z.string().min(1),
  /** Habilita el Intonation Trainer: yes/no asciende, wh- desciende. */
  intonation: z.enum(['rising', 'falling']).optional(),
  alternatives: z.array(z.string()).optional(),
  replies: z.array(z.string()).optional(),
  /** Pre-renderizar variante lenta con SSML (no time-stretch). Ver §5.5. */
  slowVariant: z.boolean().optional(),
  phoneticFocus: z.array(z.string()).optional(),
  audio: audioRefSchema.optional(),
});

export const dialogueAtomSchema = z.object({
  ...atomBase,
  kind: z.literal('dialogue'),
  title: z.string().min(1),
  situation: z.string().min(1),
  /** Referencias a phrases. NO se duplica el texto. */
  turns: z.array(z.object({ speaker: z.string().min(1), phraseId: atomIdSchema })).min(2),
  variants: z.array(z.string()).optional(),
  image: imageRefSchema.optional(),
});

export const qaAtomSchema = z.object({
  ...atomBase,
  kind: z.literal('qa'),
  prompt: z.string().min(1),
  promptVariants: z.array(z.string()),
  replies: z.array(z.string()).min(1),
  /** Quién pregunta. Las promptVariants son la MISMA persona reformulando. */
  speaker: z.string().min(1),
  /**
   * Quién responde. Es otra persona: una pregunta y su respuesta no pueden
   * salir de la misma voz sin romper la ilusión de diálogo. Sin esto, las
   * replies no tienen voz asignada y se quedan sin audio.
   */
  replySpeaker: z.string().min(1),
  audio: audioRefSchema.optional(),
});

export const lexemeAtomSchema = z.object({
  ...atomBase,
  kind: z.literal('lexeme'),
  word: z.string().min(1),
  pos: z.enum(['noun', 'verb', 'adjective', 'adverb', 'phrase', 'preposition']),
  gloss: z.string().min(1),
  /** Toda palabra vive en una oración. Nunca aislada. */
  examplePhraseId: atomIdSchema,
  focus: z.enum(['phonetic', 'spelling', 'translation', 'variant']),
  /** Diferencias UK/US: lift/elevator, return ticket/round-trip. */
  variantOf: z.object({ uk: z.string(), us: z.string() }).optional(),
});

export const contrastAtomSchema = z.object({
  ...atomBase,
  kind: z.literal('contrast'),
  pair: z.tuple([z.string().min(1), z.string().min(1)]),
  type: z.enum(['homophone', 'minimal-pair', 'article-liaison']),
  /**
   * Distinción clave para el diseño de la mecánica:
   * phoneme → se oye la diferencia (pen/pan). Se puede entrenar el oído.
   * syntax  → NO se oye (it's/its). Solo el contexto lo resuelve.
   */
  discriminator: z.enum(['syntax', 'phoneme']),
  examples: z
    .array(
      z.object({
        text: z.string().min(1),
        correct: z.union([z.literal(0), z.literal(1)]),
        phraseId: atomIdSchema.optional(),
      })
    )
    .min(1),
});

/** Marcador de hueco en un stem de cloze. */
export const BLANK = '___';

/** Una respuesta esperada: la nuestra (accept) y la de la cátedra (officialKey). */
const answerSchema = z.object({
  /** TODAS las respuestas válidas, no solo la de la grilla. accept[0] es la preferida. */
  accept: z.array(z.string().min(1)).min(1),
  /** Lo que exige la grilla oficial, si difiere de accept[0]. */
  officialKey: z.string().optional(),
  note: z.string().optional(),
});

export const exerciseAtomSchema = z
  .object({
    ...atomBase,
    kind: z.literal('exercise'),
    /** Consigna original, textual. */
    prompt: z.string().min(1),
    format: z.enum(['cloze', 'reorder', 'punctuate', 'match', 'transform', 'error-hunt']),
    items: z
      .array(
        z.object({
          /** El ítem tal como se presenta. En cloze, los huecos se marcan con ___ */
          stem: z.string().min(1),
          /** Quién dice esta línea, si el ejercicio es un diálogo (Ejercitación 1). */
          speaker: z.string().optional(),
          /**
           * cloze: una entrada por hueco, en orden de aparición.
           * El material tiene ítems con varios huecos en una sola oración
           * ("If you go out take ___ umbrella" / "Hello, ___'m Sam. ___'m a teacher").
           */
          blanks: z.array(answerSchema).optional(),
          /** Resto de formatos: la respuesta completa del ítem. */
          answer: answerSchema.optional(),
        })
      )
      .min(1),
    /** native = fiel en audio · adapted = se transforma · text-only = es escrito. §6.3 */
    audioViable: z.enum(['native', 'adapted', 'text-only']),
  })
  .superRefine((atom, ctx) => {
    atom.items.forEach((item, i) => {
      const nBlanks = item.stem.split(BLANK).length - 1;

      if (atom.format === 'cloze') {
        if (!item.blanks) {
          ctx.addIssue({ code: 'custom', path: ['items', i, 'blanks'], message: 'cloze exige blanks' });
          return;
        }
        // El stem y las respuestas tienen que estar de acuerdo sobre cuántos huecos hay.
        // Sin esto, un ___ de más deja al alumno frente a un hueco sin respuesta válida.
        if (nBlanks !== item.blanks.length) {
          ctx.addIssue({
            code: 'custom',
            path: ['items', i],
            message: `el stem tiene ${nBlanks} hueco(s) "${BLANK}" pero hay ${item.blanks.length} entrada(s) en blanks`,
          });
        }
      } else {
        if (!item.answer) {
          ctx.addIssue({
            code: 'custom',
            path: ['items', i, 'answer'],
            message: `format "${atom.format}" exige answer`,
          });
        }
        if (nBlanks > 0) {
          ctx.addIssue({
            code: 'custom',
            path: ['items', i, 'stem'],
            message: `solo cloze usa huecos "${BLANK}"; format es "${atom.format}"`,
          });
        }
      }

      // Regla §4.5.5: si la grilla contradice lo que aceptamos, hay que explicarlo.
      // El alumno rinde con la cátedra: necesita saber qué espera la grilla Y qué es correcto.
      const answers = [...(item.blanks ?? []), ...(item.answer ? [item.answer] : [])];
      answers.forEach((a, j) => {
        if (a.officialKey && a.officialKey !== a.accept[0] && !a.note) {
          ctx.addIssue({
            code: 'custom',
            path: ['items', i, item.blanks ? 'blanks' : 'answer', ...(item.blanks ? [j, 'note'] : ['note'])],
            message:
              `officialKey ("${a.officialKey}") difiere de accept[0] ("${a.accept[0]}") y no hay note. ` +
              `Explicá por qué divergen.`,
          });
        }
      });
    });
  });

export const productionAtomSchema = z.object({
  ...atomBase,
  kind: z.literal('production'),
  prompt: z.string().min(1),
  wordBank: z.array(z.string()).optional(),
  /** Referencia para shadowing de alta dificultad y para el examinador. */
  modelAnswer: z.string().min(1),
  /** "My Life: Chapter N" — hilo acumulativo. Al final de las 4, es el final oral. */
  chapter: z.number().int().positive().optional(),
  /** Qué tiene que aparecer sí o sí. Lo chequea el Oral Exam Simulator. */
  rubric: z.array(z.string().min(1)).min(1),
  speaker: z.string().min(1),
});

export const listeningAtomSchema = z.object({
  ...atomBase,
  kind: z.literal('listening'),
  /**
   * OJO: el PDF referencia las pistas por un link externo que NO está en el material.
   * Toda narrative es escrita por nosotros → origin SIEMPRE 'synthetic'.
   * Restricción dura: debe hacer verdaderas las respuestas oficiales. Ver §5.6.
   */
  narrative: z.string().min(1),
  speaker: z.string().min(1),
  questions: z.array(z.object({ q: z.string().min(1), accept: z.array(z.string()).min(1) })).min(1),
  audio: audioRefSchema.optional(),
});

export const atomSchema = z.discriminatedUnion('kind', [
  phraseAtomSchema,
  dialogueAtomSchema,
  qaAtomSchema,
  lexemeAtomSchema,
  contrastAtomSchema,
  exerciseAtomSchema,
  productionAtomSchema,
  listeningAtomSchema,
]);

/* ─────────────────────────────────── speakers ───────────────────────────────────── */

export const speakerSchema = z.object({
  id: z.string().min(1),
  displayName: z.string().min(1),
  /** Personaje recurrente del material (Mary aparece en u1, u3, u4). */
  recurring: z.boolean().optional(),
  bio: z.string().optional(),
  accent: z.enum(['en-US', 'en-GB', 'en-AU']),
  /** L1 del hablante, para acentos no nativos. Azure tiene voces multilingües. */
  l1: z.string().optional(),
  gender: z.enum(['female', 'male', 'neutral']),
  /** Id de voz del proveedor: "en-US-AriaNeural". */
  ttsVoice: z.string().min(1),
  /** Pistas para matchear una voz local si no hay mp3. Ver §5.3. */
  fallbackHint: z.array(z.string()).min(1),
  rate: z.number().min(0.5).max(1.5),
});

export const speakersFileSchema = z.object({
  $schema: z.string().optional(),
  speakers: z.array(speakerSchema).min(1),
});

/* ────────────────────────────────── archivo de unidad ───────────────────────────── */

export const unitFileSchema = z.object({
  $schema: z.string().optional(),
  course: z.enum(COURSES),
  unit: z.number().int().min(1).max(12),
  title: z.string().min(1),
  /** Metas de aprendizaje, tal como las declara el material. */
  goals: z.array(z.string()).min(1),
  atoms: z.array(atomSchema).min(1),
});

/* ──────────────────────────────────── tipos ─────────────────────────────────────── */

export type Course = (typeof COURSES)[number];
export type GrammarTag = (typeof GRAMMAR_TAGS)[number];
export type FunctionTag = (typeof FUNCTION_TAGS)[number];
export type TopicTag = (typeof TOPIC_TAGS)[number];
export type Skill = (typeof SKILLS)[number];
export type AtomKind = keyof typeof KIND_CODE;

export type AudioRef = z.infer<typeof audioRefSchema>;
export type ImageRef = z.infer<typeof imageRefSchema>;
export type PhraseAtom = z.infer<typeof phraseAtomSchema>;
export type DialogueAtom = z.infer<typeof dialogueAtomSchema>;
export type QaAtom = z.infer<typeof qaAtomSchema>;
export type LexemeAtom = z.infer<typeof lexemeAtomSchema>;
export type ContrastAtom = z.infer<typeof contrastAtomSchema>;
export type ExerciseAtom = z.infer<typeof exerciseAtomSchema>;
export type ProductionAtom = z.infer<typeof productionAtomSchema>;
export type ListeningAtom = z.infer<typeof listeningAtomSchema>;
export type Atom = z.infer<typeof atomSchema>;
export type Speaker = z.infer<typeof speakerSchema>;
export type SpeakersFile = z.infer<typeof speakersFileSchema>;
export type UnitFile = z.infer<typeof unitFileSchema>;
