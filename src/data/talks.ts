/**
 * talks.ts — la lógica de las exposiciones "con el diagrama" (content/talks.ts).
 *
 * Resuelve cada señalamiento (una frase ancla del texto) a una posición dentro de
 * una oración: oración N, a tal fracción de su largo. En la vista, esa fracción se
 * cruza con el avance real del audio de la oración, así que el láser llega cuando
 * la voz llega, en cualquier voz y velocidad.
 *
 * Es lógica pura (sin React, sin audio): se puede testear de una.
 */

import type { Atom } from '../../content/schema.ts';
import { talks, WHOLE_DIAGRAM, type Run, type Talk, type TalkDiagram, type TalkCue } from '../../content/talks.ts';

export interface ResolvedCue {
  /** Índice de la oración donde cae la frase ancla. */
  sentence: number;
  /** Dónde arranca la frase dentro de la oración: 0 = al principio, 1 = al final. */
  frac: number;
  spot: string | null;
}

/**
 * Ubica cada señalamiento en las oraciones de la versión (las MISMAS que parte
 * versionChunks, para que el audio por oración coincida). Busca cada frase después
 * de la anterior, así una frase repetida en el texto se toma en su lugar.
 * Tira si alguna no aparece: el texto cambió y el señalamiento quedó viejo.
 */
export function resolveCues(sentences: readonly string[], cues: readonly TalkCue[]): ResolvedCue[] {
  const text = sentences.join(' ');
  const starts: number[] = [];
  let acc = 0;
  for (const s of sentences) {
    starts.push(acc);
    acc += s.length + 1;
  }
  let pos = 0;
  return cues.map((c) => {
    const i = text.indexOf(c.at, pos);
    if (i < 0) throw new Error(`el señalamiento "${c.at}" no aparece en el texto (o está fuera de orden)`);
    pos = i + c.at.length;
    let k = starts.length - 1;
    while (k > 0 && starts[k]! > i) k--;
    return { sentence: k, frac: (i - starts[k]!) / sentences[k]!.length, spot: c.spot };
  });
}

/** Qué se señala en la oración `sentence`, cuando la voz va por `frac` de ella. */
export function spotAt(cues: readonly ResolvedCue[], sentence: number, frac: number): string | null {
  let spot: string | null = null;
  for (const c of cues) {
    if (c.sentence < sentence || (c.sentence === sentence && c.frac <= frac)) spot = c.spot;
    else break;
  }
  return spot;
}

/** Todos los puntos señalables del diagrama (para verificar los señalamientos). */
export function diagramSpots(d: TalkDiagram): string[] {
  const out: string[] = [WHOLE_DIAGRAM];
  const run = (r: Run) => {
    if (typeof r !== 'string') out.push(r[0]);
  };
  [d.title, d.author, d.purpose].forEach(run);
  for (const b of d.boxes) {
    out.push(b.spot);
    if (b.kind === 'list') b.lines.forEach((l) => l.runs.forEach(run));
    else if (b.kind === 'columns')
      b.columns.forEach((c) => {
        out.push(c.spot);
        c.lines.forEach((l) => l.runs.forEach(run));
      });
    else {
      b.head.forEach(run);
      b.rows.forEach((r) => r.forEach(run));
    }
  }
  return out;
}

/** La exposición con diagrama de esta versión, si tiene. `versionIdx` como en
 *  versionChunks: 0 = Versión A, 1… = las variantes. */
export function talkFor(atom: Atom, versionIdx: number): Talk | undefined {
  if (atom.kind !== 'production' || versionIdx === 0) return undefined;
  const label = atom.modelVariantLabels?.[versionIdx - 1];
  return label ? talks.find((t) => t.atomId === atom.id && t.version === label) : undefined;
}
