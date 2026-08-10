/**
 * session.ts — arma sesiones. La capa que faltaba. Ver ARQUITECTURA.md §14.
 *
 * Una sesión es meta + largo + escalera + cierre. Sin esto, una mecánica es
 * rondas aleatorias infinitas: un juguete, no una clase.
 */

import { atomInAspect, type Aspect, type Atom, type Course, type Skill } from '../../content/schema.ts';
import { mechanics } from '../mechanics/registry.ts';
import { shuffle } from '../shared/shuffle.ts';

export type SessionMode = 'discover' | 'drill' | 'review' | 'exam';

export type SessionScope =
  | { kind: 'aspect'; course: Course; unit: number; aspectId: string }
  | { kind: 'unit'; course: Course; unit: number }
  | { kind: 'atoms'; atomIds: string[] }
  | { kind: 'due'; course?: Course; units?: number[] };

export interface SessionSpec {
  scope: SessionScope;
  mode: SessionMode;
  length: number;
  /** Entrenar UNA mecánica y nada más. Sin esto, caen las que toquen. */
  mechanicId?: string;
}

/**
 * Lo que el motor necesita saber del progreso, sin conocer dónde se guarda.
 *
 * El engine no importa data/: recibe esto. Así se puede razonar y probar la
 * selección sin localStorage ni navegador.
 */
export interface Scheduler {
  isDue(step: Step): boolean;
  isNew(step: Step): boolean;
  /** 0..1 — probabilidad de recordarlo hoy. Más bajo = más urgente. */
  retrievability(step: Step): number;
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
  /**
   * Copia de reaprendizaje: un paso que fallaste y vuelve al final de la MISMA
   * sesión, como ronda nueva (segundo intento de recall real). El player lo agrega
   * al vuelo; nunca lo produce buildSession. Con la marca no se re-encola dos veces.
   */
  relearn?: boolean;
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
    case 'atoms': {
      // Repaso dirigido: solo estos átomos (los que más fallás).
      const ids = new Set(scope.atomIds);
      return all.filter((a) => ids.has(a.id));
    }
    case 'due': {
      // Repaso global: átomos del curso elegido, acotado a las unidades seleccionadas
      // (si se pasan). Sin `units`, entran todas.
      const units = scope.units;
      return all.filter(
        (a) =>
          (!scope.course || a.course === scope.course) && (!units || units.includes(a.unit))
      );
    }
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
/**
 * Reordena una lista rotando mecánicas: una de cada, y vuelta a empezar.
 *
 * Preserva el orden relativo DENTRO de cada mecánica, así no pisa la prioridad con
 * la que venía la lista (dificultad en la escalera, retrievability en el repaso):
 * solo evita que una mecánica con muchos candidatos se coma la tanda. Sin esto, la
 * cantidad de candidatos decidía la sesión, y esa cantidad es un accidente del
 * contenido —cuántas frases tiene el tema— no una decisión pedagógica.
 */
function spreadByMechanic<T extends { step: Step }>(list: T[]): T[] {
  const byMech = new Map<string, T[]>();
  for (const c of list) {
    const g = byMech.get(c.step.mechanicId) ?? [];
    g.push(c);
    byMech.set(c.step.mechanicId, g);
  }
  const queues = [...byMech.values()];
  const out: T[] = [];
  while (out.length < list.length) {
    let movio = false;
    for (const q of queues) {
      const c = q.shift();
      if (c) {
        out.push(c);
        movio = true;
      }
    }
    if (!movio) break; // defensivo: nunca debería pasar (el total es el mismo)
  }
  return out;
}

function climbLadder(candidates: { step: Step; level: number; difficulty: number }[], n: number): Step[] {
  const byLevel = new Map<number, typeof candidates>();
  for (const c of candidates) {
    const g = byLevel.get(c.level) ?? [];
    g.push(c);
    byLevel.set(c.level, g);
  }
  // Dentro de un peldaño: primero lo más fácil, pero ROTANDO mecánicas.
  //
  // Ordenar solo por dificultad hacía que cada peldaño entregara siempre la misma
  // mecánica —la del candidato más fácil— y la sesión entera cabía en tantas
  // mecánicas como niveles. Medido sobre el tema de entropía (17 mecánicas
  // disponibles): un alumno nuevo veía 5, y 3 de sus 12 pasos eran pares mínimos,
  // sobre un tema con 4 átomos de contraste. Los repetía tres veces por sesión.
  for (const [l, g] of byLevel) {
    g.sort((a, b) => a.difficulty - b.difficulty);
    byLevel.set(l, spreadByMechanic(g));
  }

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
  title: string,
  scheduler?: Scheduler
): Session {
  const pool = atomsInScope(spec.scope, all, aspects);

  // Un candidato por (átomo × mecánica × variante): el mismo átomo puede
  // entrenarse de varias formas, y son tarjetas de SRS distintas.
  const candidates: { step: Step; level: number; difficulty: number }[] = [];
  const reachable = new Set<string>();

  for (const atom of pool) {
    for (const mechanic of mechanics) {
      if (spec.mechanicId && mechanic.id !== spec.mechanicId) continue;
      if (!mechanic.accepts(atom)) continue;
      if (spec.mode === 'exam' && mechanic.level < 5) continue;
      reachable.add(atom.id);
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

  const unreachable = spec.mechanicId ? [] : pool.filter((a) => !reachable.has(a.id));

  let ordered: Step[];
  if (spec.mode === 'review' && scheduler) {
    // El repaso GLOBAL (scope 'due') es repaso puro: solo lo ya estudiado, nunca
    // material nuevo — es la acción de fijar la repetición espaciada. El repaso de
    // UN tema sí incorpora lo nuevo del tema, para poder avanzarlo.
    ordered = scheduleReview(candidates, spec.length, scheduler, spec.scope.kind !== 'due');
  } else if (spec.mode === 'discover') {
    ordered = climbLadder(candidates, spec.length);
  } else {
    ordered = pickBalanced(candidates, spec.length);
  }

  return { spec, title, steps: ordered, unreachable };
}

/**
 * El repaso de verdad: lo vencido primero, lo más olvidado antes.
 *
 * Es lo que arregla el desbalance medido — sin SRS, el reparto por mecánica hacía
 * que Examen oral (2 átomos) saliera todas las sesiones con los mismos dos, y un
 * átomo apareciera 22 veces mientras otro 1. Con el scheduler, lo que aparece es
 * lo que estás por olvidar, no lo que sobra en una mecánica escasa.
 *
 * Vencidas mandan (prioridad SRS), pero se RESERVA un cupo de material nuevo por
 * tanda (~1/3). Sin eso, un tema casi terminado (p. ej. 74/80) con muchas vencidas
 * llenaba las 12 con puro repaso y los últimos ítems nuevos no entraban nunca — el
 * contador quedaba enganchado. Con el cupo, cada tanda suma algo nuevo igual.
 *
 * Clave: el cupo fresh prioriza ÁTOMOS todavía sin empezar, no cualquier tarjeta
 * nueva. Un átomo ya empezado tiene muchas mecánicas sin tocar (todas isNew), así
 * que `fresh` está dominado por tarjetas de átomos que YA cuentan en el contador.
 * Elegir al azar casi nunca tocaba uno de los pocos átomos nuevos → el contador
 * (átomos con tarjeta) subía de a uno aunque la tanda trajera 4 nuevas. Por eso
 * dentro del cupo entran primero átomos distintos sin empezar, uno cada uno y por
 * el peldaño más bajo (percepción), como en la escalera de Descubrir.
 *
 * Partición disjunta: nuevas (isNew) → fresh; vencidas-no-nuevas → due; resto → rest.
 * `includeFresh=false` deja el repaso PURO (sin nuevas). Lo usa el repaso global.
 */
function scheduleReview(
  candidates: { step: Step; level: number }[],
  n: number,
  sch: Scheduler,
  includeFresh = true
): Step[] {
  // Una tanda debe cubrir tarjetas DISTINTAS. La tarjeta de SRS es (átomo, habilidad,
  // variante); varias mecánicas comparten tarjeta, así que sin deduplicar una sesión
  // de 12 podía caer sobre 3-4 tarjetas (la misma repetida en varios modos) y el
  // contador de vencidas casi no bajaba. Se deja una candidata por tarjeta.
  const cardKey = (s: Step) => `${s.atomId}|${s.skill}|${s.variant ?? ''}`;
  /**
   * Una candidata por tarjeta — y la mecánica se SORTEA entre las que la comparten.
   *
   * Quedarse con la primera parecía inocente y no lo era: el orden de `candidates`
   * es registro adentro, así que la tarjeta de recuperación de toda frase larga caía
   * siempre en la misma mecánica (medido: echo-type se llevaba 5 de los 12 pasos de
   * cada repaso, y es-to-en-write no aparecía nunca). La tarjeta es la misma memoria;
   * cuál ejercicio la entrena es indistinto para el SRS y variarlo entrena mejor.
   *
   * Se conserva la POSICIÓN de la primera aparición, así el orden por retrievability
   * —lo más olvidado primero— queda intacto.
   */
  const oncePerCard = (list: { step: Step; level: number }[]) => {
    const porTarjeta = new Map<string, { step: Step; level: number }[]>();
    const orden: string[] = [];
    for (const c of list) {
      const k = cardKey(c.step);
      const g = porTarjeta.get(k);
      if (g) g.push(c);
      else {
        porTarjeta.set(k, [c]);
        orden.push(k);
      }
    }
    return orden.map((k) => {
      const g = porTarjeta.get(k)!;
      return g[Math.floor(Math.random() * g.length)]!;
    });
  };

  const due = oncePerCard(
    candidates
      .filter((c) => sch.isDue(c.step) && !sch.isNew(c.step))
      .sort((a, b) => sch.retrievability(a.step) - sch.retrievability(b.step))
  );
  const rest = oncePerCard(candidates.filter((c) => !sch.isDue(c.step) && !sch.isNew(c.step)));

  // Un átomo está EMPEZADO si alguno de sus pasos ya no es nuevo (tiene tarjeta).
  const startedAtoms = new Set(
    candidates.filter((c) => !sch.isNew(c.step)).map((c) => c.step.atomId)
  );
  const freshAll = includeFresh ? candidates.filter((c) => sch.isNew(c.step)) : [];
  // Un paso por átomo SIN empezar, el de menor nivel: así cada uno arranca por
  // percepción y la tanda estrena varios átomos distintos (mueve el contador).
  const newAtomIds = shuffle([
    ...new Set(freshAll.filter((c) => !startedAtoms.has(c.step.atomId)).map((c) => c.step.atomId)),
  ]);
  const startNewAtoms = newAtomIds.map(
    (id) =>
      freshAll
        .filter((c) => c.step.atomId === id)
        .sort((a, b) => a.level - b.level)[0]!
  );
  // El resto del material nuevo: tarjetas nuevas de átomos ya empezados + los pasos
  // sobrantes de los átomos recién estrenados. Va después, si queda cupo.
  const startNewSet = new Set(startNewAtoms);
  // Rotando mecánicas: si no, la que más candidatos tiene (siempre las genéricas,
  // que valen 4 ejercicios por frase) se lleva el cupo de material nuevo.
  const otherFresh = spreadByMechanic(shuffle(freshAll.filter((c) => !startNewSet.has(c))));
  const freshOrdered = [...startNewAtoms, ...otherFresh];

  // Cupo garantizado de nuevas (~1/3 de la tanda), con los átomos nuevos al frente.
  // Lo vencido llena el resto y tiene prioridad; si sobra lugar, entra repaso
  // adelantado y más material nuevo.
  const freshQuota = Math.min(freshOrdered.length, Math.max(1, Math.round(n / 3)));
  const chosen: { step: Step }[] = [
    ...due.slice(0, Math.max(0, n - freshQuota)),
    ...freshOrdered.slice(0, freshQuota),
  ];
  const room = () => n - chosen.length;
  if (room() > 0) chosen.push(...spreadByMechanic(shuffle(rest)).slice(0, room()));
  if (room() > 0) chosen.push(...freshOrdered.slice(freshQuota, freshQuota + room()));
  if (room() > 0) chosen.push(...due.slice(Math.max(0, n - freshQuota)));

  return spaceOut(chosen.slice(0, n).map((c) => c.step));
}

/** Evita dos pasos seguidos de la misma mecánica, sin reordenar por prioridad de más. */
function spaceOut(steps: Step[]): Step[] {
  const out: Step[] = [];
  const pending = [...steps];
  let last = '';
  while (pending.length) {
    const i = pending.findIndex((s) => s.mechanicId !== last);
    const pick = pending.splice(i === -1 ? 0 : i, 1)[0]!;
    out.push(pick);
    last = pick.mechanicId;
  }
  return out;
}
