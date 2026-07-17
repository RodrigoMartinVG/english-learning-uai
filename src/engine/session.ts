/**
 * session.ts — arma sesiones. La capa que faltaba. Ver ARQUITECTURA.md §14.
 *
 * Una sesión es meta + largo + escalera + cierre. Sin esto, una mecánica es
 * rondas aleatorias infinitas: un juguete, no una clase.
 */

import { atomInAspect, type Aspect, type Atom, type Course, type Skill } from '../../content/schema.ts';
import { mechanics } from '../mechanics/registry.ts';

export type SessionMode = 'discover' | 'drill' | 'review' | 'exam';

export type SessionScope =
  | { kind: 'aspect'; course: Course; unit: number; aspectId: string }
  | { kind: 'unit'; course: Course; unit: number }
  | { kind: 'due' };

export interface SessionSpec {
  scope: SessionScope;
  mode: SessionMode;
  length: number;
}

export interface Step {
  mechanicId: string;
  atomId: string;
  skill: Skill;
  /**
   * Qué forma del átomo se entrena, si la mecánica ofrece varias.
   *
   * Hoy: el papel que toma el alumno en un Role-play. Un diálogo genera un paso
   * por papel, porque hacer siempre de Karel jamás te hace formular una pregunta.
   */
  variant?: string;
}

export interface Session {
  spec: SessionSpec;
  title: string;
  steps: Step[];
  /**
   * Átomos del scope que NINGUNA mecánica sabe consumir.
   *
   * No se descartan en silencio: contenido inalcanzable es un bug, y un bug que
   * no se ve es peor. Es lo que dejó 52 de 91 átomos muertos en la Fase 2.
   */
  unreachable: Atom[];
}

export const DEFAULT_LENGTH = 12;

const shuffle = <T,>(arr: T[]): T[] => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
};

export function atomsInScope(scope: SessionScope, all: Atom[], aspects: Aspect[]): Atom[] {
  switch (scope.kind) {
    case 'unit':
      return all.filter((a) => a.course === scope.course && a.unit === scope.unit);
    case 'aspect': {
      const aspect = aspects.find((x) => x.id === scope.aspectId);
      if (!aspect) return [];
      return all.filter(
        (a) => a.course === scope.course && a.unit === scope.unit && atomInAspect(a, aspect)
      );
    }
    case 'due':
      // Fase 3: acá entra FSRS. Hasta entonces, todo es candidato — y se dice.
      return all;
  }
}

/**
 * Elige `n` pasos repartiendo entre mecánicas, y los intercala.
 *
 * El reparto ocurre AL ELEGIR, no al ordenar. Mezclar todo y recortar a 12 parece
 * equivalente y no lo es: con 39 frases contra 5 contrastes, un muestreo uniforme
 * casi nunca saca un contraste y la sesión sale monótona aunque el interleaving
 * funcione. Medido: daba 12 de 12 pasos de la misma mecánica.
 *
 * Round-robin entre mecánicas → cada una aporta lo que puede → después se alterna.
 * No es cosmético: alternar el tipo de esfuerzo sostiene la atención y retiene
 * mejor que doce rondas del mismo juego.
 */
function pickBalanced(candidates: { step: Step }[], n: number): Step[] {
  const groups = new Map<string, Step[]>();
  for (const c of shuffle(candidates)) {
    const g = groups.get(c.step.mechanicId) ?? [];
    g.push(c.step);
    groups.set(c.step.mechanicId, g);
  }

  const picked: Step[] = [];
  const queues = [...groups.values()];
  while (picked.length < n && queues.some((q) => q.length)) {
    for (const q of queues) {
      if (picked.length >= n) break;
      const s = q.shift();
      if (s) picked.push(s);
    }
  }

  // Alternar: nunca dos seguidos de la misma mecánica si queda con qué.
  // Si no hay, se repite antes que acortar la sesión.
  const out: Step[] = [];
  const pending = [...picked];
  let last = '';
  while (pending.length) {
    const i = pending.findIndex((s) => s.mechanicId !== last);
    const pick = pending.splice(i === -1 ? 0 : i, 1)[0]!;
    out.push(pick);
    last = pick.mechanicId;
  }
  return out;
}

/**
 * La escalera de "Descubrir": empieza percibiendo y TERMINA produciendo.
 *
 * Ordenar por nivel y cortar en 12 parece la escalera y no lo es: con ~30
 * candidatos de comprensión disponibles, los peldaños altos nunca entran en los
 * 12 lugares y el alumno jamás llega a hablar. Medido: 12 de 12 pasos en niveles
 * 1-2, cero producción. Una escalera que no sube no es una escalera.
 *
 * Se reparte por nivel (round-robin, cada peldaño aporta lo que puede) y recién
 * después se ordena ascendente, para que la sesión efectivamente trepe.
 */
function climbLadder(candidates: { step: Step; level: number; difficulty: number }[], n: number): Step[] {
  const byLevel = new Map<number, typeof candidates>();
  for (const c of candidates) {
    const g = byLevel.get(c.level) ?? [];
    g.push(c);
    byLevel.set(c.level, g);
  }
  // Dentro de un peldaño, primero lo más fácil.
  for (const g of byLevel.values()) g.sort((a, b) => a.difficulty - b.difficulty);

  const levels = [...byLevel.keys()].sort((a, b) => a - b);
  const picked: typeof candidates = [];
  while (picked.length < n && levels.some((l) => byLevel.get(l)!.length)) {
    for (const l of levels) {
      if (picked.length >= n) break;
      const c = byLevel.get(l)!.shift();
      if (c) picked.push(c);
    }
  }

  return picked.sort((a, b) => a.level - b.level || a.difficulty - b.difficulty).map((c) => c.step);
}

export function buildSession(
  spec: SessionSpec,
  all: Atom[],
  aspects: Aspect[],
  title: string
): Session {
  const pool = atomsInScope(spec.scope, all, aspects);

  // Un candidato por (átomo × mecánica compatible): el mismo átomo puede
  // entrenarse de varias formas, y son tarjetas de SRS distintas.
  const candidates: { step: Step; level: number; difficulty: number }[] = [];
  const reachable = new Set<string>();

  for (const atom of pool) {
    for (const mechanic of mechanics) {
      if (!mechanic.accepts(atom)) continue;
      if (spec.mode === 'exam' && mechanic.level < 5) continue;
      reachable.add(atom.id);
      // Sin variantes, un paso. Con variantes, uno por cada una: son formas
      // distintas de entrenar lo mismo, no repeticiones.
      const variants = mechanic.variants?.(atom) ?? [undefined];
      for (const variant of variants) {
        candidates.push({
          step: { mechanicId: mechanic.id, atomId: atom.id, skill: mechanic.skill, variant },
          level: mechanic.level,
          difficulty: atom.difficulty,
        });
      }
    }
  }

  const unreachable = pool.filter((a) => !reachable.has(a.id));

  let ordered: Step[];
  if (spec.mode === 'discover') {
    ordered = climbLadder(candidates, spec.length);
  } else {
    ordered = pickBalanced(candidates, spec.length);
  }

  return { spec, title, steps: ordered, unreachable };
}
