/**
 * validate-content.ts — hace cumplir la ley de content/schema.ts.
 *
 * Valida forma (Zod) e integridad referencial (cruces entre átomos), que Zod solo
 * no puede ver porque las referencias cruzan archivos.
 *
 * Uso:  npm run validate
 * Sale con código 1 si algo falla → sirve para CI.
 */

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, basename } from 'node:path';
import { z } from 'zod';
import {
  speakersFileSchema,
  unitFileSchema,
  atomSchema,
  atomInAspect,
  ATOM_ID_RE,
  KIND_CODE,
  type Aspect,
  type Atom,
} from '../content/schema.ts';

const CONTENT_DIR = join(import.meta.dirname, '..', 'content');

type Problem = { file: string; where: string; msg: string };
const errors: Problem[] = [];
const warnings: Problem[] = [];

const err = (file: string, where: string, msg: string) => errors.push({ file, where, msg });
const warn = (file: string, where: string, msg: string) => warnings.push({ file, where, msg });

/* ─────────────────────────────────── speakers ───────────────────────────────────── */

const speakersPath = join(CONTENT_DIR, 'speakers.json');
const speakerIds = new Set<string>();

if (!existsSync(speakersPath)) {
  err('speakers.json', '-', 'no existe');
} else {
  const parsed = speakersFileSchema.safeParse(
    JSON.parse(readFileSync(speakersPath, 'utf8'))
  );
  if (!parsed.success) {
    for (const i of parsed.error.issues) {
      err('speakers.json', i.path.join('.') || '-', i.message);
    }
  } else {
    for (const s of parsed.data.speakers) {
      if (speakerIds.has(s.id)) err('speakers.json', s.id, 'id de speaker duplicado');
      speakerIds.add(s.id);
    }
  }
}

/* ──────────────────────────────── archivos de unidad ────────────────────────────── */

/**
 * Cabecera del archivo sin los átomos.
 *
 * Los átomos se parsean de a uno a propósito: si validáramos el archivo entero de
 * una, un solo tag mal escrito haría fallar el parse y nos saltearíamos TODOS los
 * chequeos referenciales del archivo — un error taparía a los otros y el reporte
 * mentiría por omisión. Parseando átomo por átomo, los válidos igual se cruzan.
 */
const unitHeaderSchema = unitFileSchema.omit({ atoms: true }).extend({
  atoms: z.array(z.unknown()).min(1),
});

const unitFiles: {
  file: string;
  course: string;
  unit: number;
  aspects: Aspect[];
  atoms: Atom[];
}[] = [];

for (const course of readdirSync(CONTENT_DIR, { withFileTypes: true })) {
  if (!course.isDirectory()) continue;
  const dir = join(CONTENT_DIR, course.name);
  for (const f of readdirSync(dir)) {
    if (!f.endsWith('.json')) continue;
    const rel = `${course.name}/${f}`;
    let raw: unknown;
    try {
      raw = JSON.parse(readFileSync(join(dir, f), 'utf8'));
    } catch (e) {
      err(rel, '-', `JSON inválido: ${(e as Error).message}`);
      continue;
    }

    const header = unitHeaderSchema.safeParse(raw);
    if (!header.success) {
      for (const i of header.error.issues) err(rel, i.path.join('.') || '-', i.message);
      continue;
    }

    const atoms: Atom[] = [];
    header.data.atoms.forEach((rawAtom, idx) => {
      const parsed = atomSchema.safeParse(rawAtom);
      // El id crudo, para que el error sea legible aunque el átomo no valide.
      const label = (rawAtom as any)?.id ?? `atoms[${idx}]`;
      if (!parsed.success) {
        for (const i of parsed.error.issues) {
          // Los enums largos generan mensajes ilegibles; se recortan.
          const msg = i.message.length > 160 ? i.message.slice(0, 157) + '…' : i.message;
          err(rel, `${label}.${i.path.join('.')}`, msg);
        }
        return;
      }
      atoms.push(parsed.data);
    });

    unitFiles.push({
      file: rel,
      course: header.data.course,
      unit: header.data.unit,
      aspects: header.data.aspects,
      atoms,
    });
  }
}

/* ─────────────────────── integridad referencial (cruza archivos) ────────────────── */

/** Índice global: los ids son únicos en TODO el proyecto, no por archivo. */
const allAtoms = new Map<string, { atom: Atom; file: string }>();

for (const { file, atoms } of unitFiles) {
  for (const atom of atoms) {
    if (allAtoms.has(atom.id)) {
      err(file, atom.id, `id duplicado (ya está en ${allAtoms.get(atom.id)!.file})`);
      continue;
    }
    allAtoms.set(atom.id, { atom, file });
  }
}

const speakerOf = (a: Atom): string | undefined =>
  'speaker' in a ? (a.speaker as string) : undefined;

for (const { file, course, unit, aspects, atoms } of unitFiles) {
  /**
   * Regla §14.2: todo átomo pertenece al menos a un aspecto.
   *
   * Un átomo huérfano existe, tiene audio, y NADIE puede llegar a él desde la
   * navegación. Es exactamente el bug que dejó 52 de 91 átomos inalcanzables
   * en la Fase 2, y que nadie vio hasta contarlos a mano.
   */
  const orphans = atoms.filter((a) => !aspects.some((asp) => atomInAspect(a, asp)));
  for (const a of orphans) {
    err(file, a.id, 'no pertenece a ningún aspecto → sería invisible en la navegación');
  }

  const ids = new Set<string>();
  for (const asp of aspects) {
    if (ids.has(asp.id)) err(file, `aspects.${asp.id}`, 'id de aspecto duplicado');
    ids.add(asp.id);
    const n = atoms.filter((a) => atomInAspect(a, asp)).length;
    if (n === 0) err(file, `aspects.${asp.id}`, 'no selecciona ningún átomo: match muerto');
    else if (n < 3) warn(file, `aspects.${asp.id}`, `solo ${n} átomo(s): no alcanza para una sesión`);
  }

  // El nombre del archivo debe coincidir con su contenido.
  const expected = `unit-${unit}.json`;
  if (basename(file) !== expected) {
    err(file, '-', `el archivo declara unit ${unit} → debería llamarse ${expected}`);
  }
  if (!file.startsWith(course + '/')) {
    err(file, '-', `el archivo declara course "${course}" pero vive en otra carpeta`);
  }

  for (const atom of atoms) {
    const at = (w: string) => `${atom.id}.${w}`;

    // Regla §4.5.1: el id codifica curso, unidad y tipo. Deben coincidir con los campos.
    const m = ATOM_ID_RE.exec(atom.id);
    if (m) {
      const [, course, unit, code] = m;
      if (course !== atom.course) err(file, atom.id, `id dice "${course}", course dice "${atom.course}"`);
      if (Number(unit) !== atom.unit) err(file, atom.id, `id dice u${unit}, unit dice ${atom.unit}`);
      const expectedCode = KIND_CODE[atom.kind];
      if (code !== expectedCode)
        err(file, atom.id, `id usa "${code}" pero kind es "${atom.kind}" → debería ser "${expectedCode}"`);
    }
    if (atom.course !== course || atom.unit !== unit) {
      err(file, atom.id, `átomo de ${atom.course}/u${atom.unit} dentro de ${course}/u${unit}`);
    }

    // Regla §4.5.3: todo speaker referenciado existe.
    const sp = speakerOf(atom);
    if (sp && !speakerIds.has(sp)) err(file, at('speaker'), `speaker "${sp}" no existe en speakers.json`);

    if (atom.kind === 'qa') {
      if (!speakerIds.has(atom.replySpeaker))
        err(file, at('replySpeaker'), `speaker "${atom.replySpeaker}" no existe en speakers.json`);
      if (atom.replySpeaker === atom.speaker)
        err(file, at('replySpeaker'), 'quien responde no puede ser quien pregunta: usá otra voz');
    }

    // Regla §4.5.2: toda referencia resuelve, y al tipo correcto.
    const mustBePhrase = (ref: string, where: string) => {
      const target = allAtoms.get(ref);
      if (!target) err(file, where, `referencia a "${ref}" que no existe`);
      else if (target.atom.kind !== 'phrase')
        err(file, where, `"${ref}" es kind "${target.atom.kind}", se esperaba "phrase"`);
    };

    if (atom.kind === 'dialogue') {
      atom.turns.forEach((t, i) => {
        mustBePhrase(t.phraseId, at(`turns.${i}.phraseId`));
        if (!speakerIds.has(t.speaker))
          err(file, at(`turns.${i}.speaker`), `speaker "${t.speaker}" no existe`);
        // El turno y la phrase referenciada tienen que estar de acuerdo sobre quién habla.
        const target = allAtoms.get(t.phraseId);
        if (target?.atom.kind === 'phrase' && target.atom.speaker !== t.speaker) {
          err(
            file,
            at(`turns.${i}`),
            `el turno dice speaker "${t.speaker}" pero ${t.phraseId} dice "${target.atom.speaker}"`
          );
        }
      });
    }

    if (atom.kind === 'lexeme') mustBePhrase(atom.examplePhraseId, at('examplePhraseId'));

    // Ejercitación 1 es un diálogo: cada línea declara quién la dice.
    if (atom.kind === 'exercise') {
      atom.items.forEach((item, i) => {
        if (item.speaker && !speakerIds.has(item.speaker))
          err(file, at(`items.${i}.speaker`), `speaker "${item.speaker}" no existe`);
      });
    }

    if (atom.kind === 'contrast') {
      atom.examples.forEach((ex, i) => {
        if (ex.phraseId) mustBePhrase(ex.phraseId, at(`examples.${i}.phraseId`));
      });
    }

    // Regla §5.6: las narrativas de listening no existen en el material. Son nuestras.
    if (atom.kind === 'listening' && atom.source.origin !== 'synthetic') {
      err(
        file,
        at('source.origin'),
        `es "${atom.source.origin}", pero el material no trae las narrativas de listening ` +
          `(link externo ausente) → debe ser "synthetic". Ver ARQUITECTURA.md §5.6`
      );
    }

    // Regla §2.4: una corrección sin explicación es indistinguible de un error nuestro.
    if (atom.source.origin === 'corrected' && !atom.source.note) {
      err(file, at('source.note'), 'origin "corrected" exige note: ¿qué decía el original y por qué se cambió?');
    }

    // Avisos: no rompen el build, pero delatan contenido a medio curar.
    if (atom.grammar.length === 0) warn(file, at('grammar'), 'sin tags de gramática → ninguna mecánica lo va a seleccionar');
    if (atom.topic.length === 0) warn(file, at('topic'), 'sin topic → no se puede usar para distractores ni interleaving');
    if (atom.source.origin === 'extracted' && !atom.source.page)
      warn(file, at('source.page'), 'extracted sin page: se pierde la trazabilidad al PDF');
  }
}

/* ──────────────────────────────────── reporte ───────────────────────────────────── */

const show = (list: Problem[], label: string) => {
  if (!list.length) return;
  console.log(`\n${label}`);
  for (const p of list) console.log(`  ${p.file}  ${p.where}\n      ${p.msg}`);
};

const atomCount = allAtoms.size;
const byKind = [...allAtoms.values()].reduce<Record<string, number>>((acc, { atom }) => {
  acc[atom.kind] = (acc[atom.kind] ?? 0) + 1;
  return acc;
}, {});

console.log(`\ncontenido: ${unitFiles.length} unidad(es), ${atomCount} átomos, ${speakerIds.size} speakers`);
if (atomCount) {
  console.log(
    '  por tipo: ' +
      Object.entries(byKind)
        .sort((a, b) => b[1] - a[1])
        .map(([k, n]) => `${k}=${n}`)
        .join('  ')
  );
}

show(warnings, `AVISOS (${warnings.length})`);
show(errors, `ERRORES (${errors.length})`);

if (errors.length) {
  console.log(`\n✗ ${errors.length} error(es). El contenido NO es válido.\n`);
  process.exit(1);
}
console.log(`\n✓ contenido válido${warnings.length ? ` (${warnings.length} aviso(s))` : ''}\n`);
