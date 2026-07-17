/**
 * Syntax Builder — armar la frase ordenando palabras.
 * Ver ARQUITECTURA.md §6.2 (mecánica 7). Llena el nivel 3, que estaba vacío.
 *
 * Es audio-first, y eso es lo que la vuelve una mecánica de ESTA app y no un
 * juego de palabras genérico: primero se escucha la frase, después se arma. Se
 * entrena a sostener la cadena sonora en memoria mientras se la parsea.
 *
 * El material la pide sin nombrarla: la Ejercitación 5 de la U1 es literalmente
 * esto ("'s name his what?" → "What's his name?"), y la reconstrucción didáctica
 * ya proponía "ordenamiento auditivo de bloques de sonido (audio drag & drop)".
 *
 * Consume dos fuentes:
 *  · `exercise` con format 'reorder' → los ítems del propio TP. Auténticos.
 *  · `phrase` de 4 a 10 palabras → scramble generado. Con 42 frases, el peldaño
 *    tiene material de sobra sin escribir contenido nuevo.
 */

import type { Atom } from '../../../content/schema.ts';
import type { Mechanic } from '../types.ts';

export interface SyntaxRound {
  /** Clave del manifest, para escuchar la referencia. */
  audioKey: string;
  speakerId: string;
  /** Todas las formas que damos por buenas. */
  targets: string[];
  /** Las fichas a ordenar: tokens de targets[0], mezclados. */
  chips: string[];
  /** Del TP o generada. La UI lo dice: no es lo mismo para el alumno. */
  origin: 'material' | 'generated';
}

const MIN_WORDS = 4;
const MAX_WORDS = 10;

/** Fichas sin puntuación: "name?" como ficha es ruido visual y una trampa. */
export const toChips = (text: string): string[] =>
  text
    .replace(/[.?!,;:]/g, '')
    .split(/\s+/)
    .filter(Boolean);

const shuffle = <T,>(arr: T[]): T[] => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
};

/** Mezcla garantizando que no salga ya ordenado: si sale armada, no hay ejercicio. */
function scramble(chips: string[]): string[] {
  if (chips.length < 2) return chips;
  for (let i = 0; i < 12; i++) {
    const s = shuffle(chips);
    if (s.some((w, k) => w !== chips[k])) return s;
  }
  return [...chips].reverse();
}

const wordCount = (t: string) => toChips(t).length;

export const syntaxBuilder: Mechanic<SyntaxRound> = {
  id: 'syntax-builder',
  name: 'Armar la frase',
  skill: 'retrieval',
  level: 3,
  blurb: 'Escuchá la frase y reconstruila ordenando las palabras.',

  accepts(atom: Atom): boolean {
    if (atom.kind === 'exercise') {
      return (
        atom.format === 'reorder' &&
        atom.items.some((i) => {
          const n = wordCount(i.answer?.accept[0] ?? '');
          return n >= MIN_WORDS && n <= MAX_WORDS;
        })
      );
    }
    if (atom.kind === 'phrase') {
      const n = wordCount(atom.text);
      return n >= MIN_WORDS && n <= MAX_WORDS;
    }
    return false;
  },

  buildRound(target: Atom): SyntaxRound | null {
    if (target.kind === 'phrase') {
      return {
        audioKey: target.id,
        speakerId: target.speaker,
        targets: [target.text],
        chips: scramble(toChips(target.text)),
        origin: 'generated',
      };
    }

    if (target.kind === 'exercise' && target.format === 'reorder') {
      const usable = target.items
        .map((item, i) => ({ item, i }))
        .filter(({ item }) => {
          const n = wordCount(item.answer?.accept[0] ?? '');
          return n >= MIN_WORDS && n <= MAX_WORDS;
        });
      const pick = usable[Math.floor(Math.random() * usable.length)];
      if (!pick?.item.answer) return null;

      /**
       * Las fichas salen de la RESPUESTA, no del stem desordenado del material.
       * El stem trae piezas que no se pueden ensamblar ("'s name his what?": ese
       * "'s" suelto no es una palabra). Lo que importa del ejercicio es el tipo,
       * no su desorden particular.
       */
      return {
        audioKey: `${target.id}.item.${pick.i}`,
        speakerId: pick.item.speaker ?? 'narrator',
        targets: pick.item.answer.accept,
        chips: scramble(toChips(pick.item.answer.accept[0]!)),
        origin: 'material',
      };
    }

    return null;
  },
};
