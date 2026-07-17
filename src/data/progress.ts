/**
 * progress.ts — lo único que la app recuerda de vos.
 *
 * Ver ARQUITECTURA.md §7. Una tarjeta por (átomo, habilidad, variante): reconocer
 * "Is there a cafeteria?" de oído y poder producirla son dos memorias distintas
 * que se olvidan a ritmos distintos, y hacer de Mary no es hacer de Eric.
 *
 * Guardado en localStorage, no IndexedDB (que es lo que decía §0). El motivo es
 * el tamaño: ~200 tarjetas son ~50 KB contra un límite de 5 MB, y no guardamos
 * audio. IndexedDB traería asincronía y complejidad sin resolver ningún problema
 * que tengamos. Si algún día se guardan grabaciones, se migra.
 */

import { newCard, review as fsrsReview, isDue, isNew, retrievability, type CardState } from '../engine/srs/fsrs.ts';
import type { Skill } from '../../content/schema.ts';

const KEY = 'oda.progress.v1';
const MAX_ERRORS = 500;

/** Qué falló, para el diagnóstico real: "fallás /θ/ el 70% de las veces". */
export interface ErrorEntry {
  atomId: string;
  skill: Skill;
  mechanicId: string;
  at: string;
}

export interface CardId {
  atomId: string;
  skill: Skill;
  variant?: string;
}

interface Store {
  version: 1;
  cards: Record<string, CardState>;
  errors: ErrorEntry[];
}

export const cardKey = ({ atomId, skill, variant }: CardId): string =>
  `${atomId}|${skill}|${variant ?? ''}`;

/** El id de átomo codifica curso y unidad (en1.u1.p.007): se lee sin cargar contenido. */
const unitOf = (key: string): string => key.split('.').slice(0, 2).join('.');

const empty = (): Store => ({ version: 1, cards: {}, errors: [] });

function load(): Store {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return empty();
    const parsed = JSON.parse(raw) as Store;
    // Un progreso corrupto no puede tumbar la app: se pierde el historial, no la sesión.
    if (parsed.version !== 1 || typeof parsed.cards !== 'object') return empty();
    return { version: 1, cards: parsed.cards ?? {}, errors: parsed.errors ?? [] };
  } catch {
    return empty();
  }
}

let store: Store = typeof localStorage === 'undefined' ? empty() : load();
const listeners = new Set<() => void>();

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(store));
  } catch {
    /* modo incógnito o cuota llena: la sesión sigue, el progreso no se guarda */
  }
  for (const fn of listeners) fn();
}

export const subscribeProgress = (fn: () => void): (() => void) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};

export const getCard = (id: CardId): CardState => store.cards[cardKey(id)] ?? newCard();

/**
 * Registra un intento.
 *
 * Solo dos notas, no cuatro: la app sabe si acertaste o no, y no le vamos a
 * pedir al alumno que se autoevalúe "fácil/difícil" — eso es ruido y depende
 * del ánimo. `again`(1) y `good`(3) son las que el modelo usa mejor.
 */
export function recordAttempt(id: CardId, correct: boolean, mechanicId: string): void {
  const key = cardKey(id);
  store.cards[key] = fsrsReview(getCard(id), correct ? 3 : 1);
  if (!correct) {
    store.errors.push({ atomId: id.atomId, skill: id.skill, mechanicId, at: new Date().toISOString() });
    if (store.errors.length > MAX_ERRORS) store.errors = store.errors.slice(-MAX_ERRORS);
  }
  persist();
}

export const cardIsDue = (id: CardId, now = new Date()): boolean => isDue(getCard(id), now);
export const cardIsNew = (id: CardId): boolean => isNew(getCard(id));
export const cardRetrievability = (id: CardId, now = new Date()): number =>
  retrievability(getCard(id), now);

/* ─────────────────────────────────── stats ──────────────────────────────────────── */

export interface Stats {
  seen: number;
  due: number;
  /** Tarjetas con estabilidad ≥ 21 días: se puede decir que las sabés. */
  learned: number;
  lapses: number;
}

const LEARNED_DAYS = 21;

export function statsFor(prefix?: string, now = new Date()): Stats {
  const entries = Object.entries(store.cards).filter(([k]) => !prefix || k.startsWith(prefix));
  return {
    seen: entries.length,
    due: entries.filter(([, c]) => isDue(c, now)).length,
    learned: entries.filter(([, c]) => c.stability >= LEARNED_DAYS).length,
    lapses: entries.reduce((s, [, c]) => s + c.lapses, 0),
  };
}

/** Cuántas tarjetas de estos átomos ya se saben. Para el progreso por aspecto. */
export function progressOf(atomIds: string[], now = new Date()): Stats {
  const ids = new Set(atomIds);
  const entries = Object.entries(store.cards).filter(([k]) => ids.has(k.split('|')[0]!));
  return {
    seen: entries.length,
    due: entries.filter(([, c]) => isDue(c, now)).length,
    learned: entries.filter(([, c]) => c.stability >= LEARNED_DAYS).length,
    lapses: entries.reduce((s, [, c]) => s + c.lapses, 0),
  };
}

/* ─────────────────────────────────── borrado ────────────────────────────────────── */

export type ResetScope =
  | { kind: 'all' }
  | { kind: 'unit'; course: string; unit: number }
  | { kind: 'atoms'; atomIds: string[] };

/**
 * Borra progreso. Es destructivo y no hay deshacer: quien llama tiene que
 * confirmar antes. Devuelve cuántas tarjetas se fueron, para poder decirlo.
 */
export function resetProgress(scope: ResetScope): number {
  const before = Object.keys(store.cards).length;

  if (scope.kind === 'all') {
    store = empty();
  } else if (scope.kind === 'unit') {
    const prefix = `${scope.course}.u${scope.unit}`;
    for (const k of Object.keys(store.cards)) if (unitOf(k) === prefix) delete store.cards[k];
    store.errors = store.errors.filter((e) => unitOf(e.atomId) !== prefix);
  } else {
    const ids = new Set(scope.atomIds);
    for (const k of Object.keys(store.cards)) if (ids.has(k.split('|')[0]!)) delete store.cards[k];
    store.errors = store.errors.filter((e) => !ids.has(e.atomId));
  }

  persist();
  return before - Object.keys(store.cards).length;
}

/** Para poder llevarse el progreso o respaldarlo: es del alumno, no nuestro. */
export const exportProgress = (): string => JSON.stringify(store, null, 2);
