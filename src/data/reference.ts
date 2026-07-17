/**
 * reference.ts — la "Guía de expresiones" y los "Scripts modelo" de una unidad.
 *
 * DERIVADO de los átomos que ya existen (§ decisión del usuario): agrupa por
 * función comunicativa las formas de decir cada cosa que ya viven en el
 * contenido (texto de la frase + `alternatives`, prompt de qa + `promptVariants`,
 * `replies`). Enriquecer = agregar alternatives a los átomos, lo que mejora
 * también la práctica. Sin duplicar contenido.
 *
 * Es lógica pura (sin React, sin audio): se puede testear de una.
 */

import type { Atom } from '../../content/schema.ts';
import { fnLabel } from '../shared/labels.ts';

export interface Expression {
  text: string;
  /** Clave de audio si la conocemos (para reproducir la referencia). */
  audioKey?: string;
  speakerId?: string;
}

export interface ObjectiveGroup {
  fn: string;
  label: string;
  /** Formas de decir/preguntar (la iniciativa del hablante). */
  says: Expression[];
  /** Respuestas naturales, cuando la función es de pregunta-respuesta. */
  replies: string[];
}

const normKey = (s: string) => s.toLowerCase().replace(/[^\w]/g, '');

/**
 * Arma la guía: un grupo por función comunicativa, con sus expresiones sin
 * repetir. El orden de las funciones sigue el primer átomo que las introduce,
 * para que la guía se lea en el orden en que la unidad enseña.
 */
export function expressionGuide(atoms: Atom[]): ObjectiveGroup[] {
  const groups = new Map<string, { says: Map<string, Expression>; replies: Set<string>; order: number }>();
  let seq = 0;

  const ensure = (fn: string) => {
    let g = groups.get(fn);
    if (!g) {
      g = { says: new Map(), replies: new Set(), order: seq++ };
      groups.set(fn, g);
    }
    return g;
  };

  const addSay = (fn: string, e: Expression) => {
    const g = ensure(fn);
    const k = normKey(e.text);
    // No pisar una expresión que ya tiene audio con una que no lo tiene.
    if (!g.says.has(k) || (e.audioKey && !g.says.get(k)!.audioKey)) g.says.set(k, e);
  };

  for (const atom of atoms) {
    if (atom.kind === 'phrase') {
      for (const fn of atom.fn) {
        addSay(fn, { text: atom.text, audioKey: atom.id, speakerId: atom.speaker });
        atom.alternatives?.forEach((alt, i) =>
          addSay(fn, { text: alt, audioKey: `${atom.id}.alt.${i}`, speakerId: atom.speaker })
        );
      }
      // Las replies de una frase son respuestas a su función.
      if (atom.replies?.length) for (const fn of atom.fn) atom.replies.forEach((r) => ensure(fn).replies.add(r));
    } else if (atom.kind === 'qa') {
      for (const fn of atom.fn) {
        addSay(fn, { text: atom.prompt, audioKey: atom.id, speakerId: atom.speaker });
        atom.promptVariants.forEach((v, i) => addSay(fn, { text: v, audioKey: `${atom.id}.alt.${i}`, speakerId: atom.speaker }));
        atom.replies.forEach((r, i) => {
          ensure(fn).replies.add(r);
          // La reply también tiene audio propio en qa.
          void i;
        });
      }
    }
  }

  return [...groups.entries()]
    .sort((a, b) => a[1].order - b[1].order)
    .map(([fn, g]) => ({
      fn,
      label: fnLabel(fn),
      says: [...g.says.values()],
      replies: [...g.replies],
    }))
    // Un objetivo con una sola forma de decirlo no es "alternativas": se omite.
    .filter((g) => g.says.length >= 2 || g.replies.length >= 2);
}

export interface ModelScript {
  id: string;
  title: string;
  prompt: string;
  /** modelAnswer + modelVariants: las versiones alternativas del mismo texto. */
  versions: { text: string; audioKey?: string }[];
  speakerId: string;
}

/** Los scripts largos: producción con su modelo y sus versiones alternativas. */
export function modelScripts(atoms: Atom[]): ModelScript[] {
  return atoms
    .filter((a) => a.kind === 'production')
    .map((a) => {
      const p = a as Extract<Atom, { kind: 'production' }>;
      const versions = [
        { text: p.modelAnswer, audioKey: `${p.id}.model` },
        ...(p.modelVariants ?? []).map((t) => ({ text: t })),
      ];
      return { id: p.id, title: scriptTitle(p.prompt), prompt: p.prompt, versions, speakerId: p.speaker };
    });
}

/** Un título corto a partir de la consigna (que suele ser larga). */
function scriptTitle(prompt: string): string {
  if (/introduce yourself/i.test(prompt)) return 'Presentarte';
  if (/describe the room/i.test(prompt)) return 'Describir tu cuarto / oficina';
  if (/daily routine|my life/i.test(prompt)) return 'Tu rutina diaria';
  return prompt.split(/[.:]/)[0]!.slice(0, 48);
}
