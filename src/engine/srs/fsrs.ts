/**
 * fsrs.ts — repetición espaciada. Ver ARQUITECTURA.md §7.
 *
 * Implementación compacta de FSRS-4.5 (Free Spaced Repetition Scheduler). Se
 * eligió sobre SM-2 —que proponía el PRD— porque SM-2 es de 1987 y modela la
 * memoria con una sola variable; FSRS separa ESTABILIDAD (cuánto dura el
 * recuerdo) de DIFICULTAD (cuánto cuesta el ítem), que es lo que permite
 * programar bien un ítem fácil que fallaste y uno difícil que acertaste.
 *
 * Se implementa a mano y no con librería por una razón concreta: son ~80 líneas,
 * los pesos son públicos, y evita una dependencia en el núcleo de la app.
 */

/** Pesos por defecto de FSRS-4.5, entrenados sobre ~700M de reviews reales. */
const W = [
  0.4872, 1.4003, 3.7145, 13.8206, 5.1618, 1.2298, 0.8975, 0.031, 1.6474, 0.1367, 1.0461,
  2.1072, 0.0793, 0.3246, 1.587, 0.2272, 2.8755,
] as const;

const DECAY = -0.5;
const FACTOR = 19 / 81;

/** Qué tan bien salió. La app solo distingue dos, pero el modelo admite cuatro. */
export type Rating = 1 | 2 | 3 | 4; // again | hard | good | easy

export interface CardState {
  /** Días que el recuerdo aguanta antes de caer al 90% de retención. */
  stability: number;
  /** 1..10 — cuánto cuesta este ítem a este alumno. */
  difficulty: number;
  /** Cuándo toca repasarlo (ISO). */
  due: string;
  /** Última vez que se vio (ISO). */
  lastReview: string | null;
  reps: number;
  /** Cuántas veces se olvidó después de haberlo sabido. */
  lapses: number;
}

export const RETENTION_TARGET = 0.9;

const clampD = (d: number) => Math.min(Math.max(d, 1), 10);

/** Probabilidad de recordarlo hoy. 1 = recién visto, baja con el tiempo. */
export function retrievability(card: CardState, now = new Date()): number {
  if (!card.lastReview) return 0;
  const days = Math.max(0, (now.getTime() - new Date(card.lastReview).getTime()) / 86_400_000);
  return Math.pow(1 + (FACTOR * days) / card.stability, DECAY);
}

/** Cuántos días esperar para que la retención caiga justo al objetivo. */
function interval(stability: number, retention = RETENTION_TARGET): number {
  const days = (stability / FACTOR) * (Math.pow(retention, 1 / DECAY) - 1);
  return Math.max(1, Math.round(days));
}

export function newCard(now = new Date()): CardState {
  return {
    stability: 0,
    difficulty: 0,
    due: now.toISOString(),
    lastReview: null,
    reps: 0,
    lapses: 0,
  };
}

export const isNew = (c: CardState): boolean => c.lastReview === null;

function initialDifficulty(rating: Rating): number {
  return clampD(W[4]! - Math.exp(W[5]! * (rating - 1)) + 1);
}

function nextDifficulty(d: number, rating: Rating): number {
  const delta = -W[6]! * (rating - 3);
  const next = d + delta * ((10 - d) / 9);
  // Reversión a la media: sin esto, la dificultad deriva sin techo.
  return clampD(W[7]! * initialDifficulty(4) + (1 - W[7]!) * next);
}

function nextStabilityOnSuccess(d: number, s: number, r: number, rating: Rating): number {
  const hardPenalty = rating === 2 ? W[15]! : 1;
  const easyBonus = rating === 4 ? W[16]! : 1;
  return (
    s *
    (1 +
      Math.exp(W[8]!) *
        (11 - d) *
        Math.pow(s, -W[9]!) *
        (Math.exp((1 - r) * W[10]!) - 1) *
        hardPenalty *
        easyBonus)
  );
}

function nextStabilityOnLapse(d: number, s: number, r: number): number {
  return (
    W[11]! * Math.pow(d, -W[12]!) * (Math.pow(s + 1, W[13]!) - 1) * Math.exp((1 - r) * W[14]!)
  );
}

/**
 * Programa la próxima aparición.
 *
 * Lo importante del modelo: fallar un ítem NO lo manda al principio. Baja la
 * estabilidad pero conserva lo aprendido, y sube la dificultad. Un ítem que
 * fallás siempre vuelve seguido; uno que sabés se espacia solo.
 */
export function review(card: CardState, rating: Rating, now = new Date()): CardState {
  const r = isNew(card) ? 0 : retrievability(card, now);

  const difficulty = isNew(card) ? initialDifficulty(rating) : nextDifficulty(card.difficulty, rating);

  let stability: number;
  if (isNew(card)) {
    stability = Math.max(0.1, W[rating - 1]!);
  } else if (rating === 1) {
    stability = Math.min(nextStabilityOnLapse(difficulty, card.stability, r), card.stability);
  } else {
    stability = nextStabilityOnSuccess(difficulty, card.stability, r, rating);
  }
  stability = Math.max(0.1, stability);

  const due = new Date(now.getTime() + interval(stability) * 86_400_000);

  return {
    stability,
    difficulty,
    due: due.toISOString(),
    lastReview: now.toISOString(),
    reps: card.reps + 1,
    lapses: card.lapses + (rating === 1 && !isNew(card) ? 1 : 0),
  };
}

export const isDue = (c: CardState, now = new Date()): boolean =>
  !isNew(c) && new Date(c.due).getTime() <= now.getTime();
