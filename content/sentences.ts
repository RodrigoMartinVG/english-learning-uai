/**
 * sentences.ts — partir un texto en oraciones. COMPARTIDO build-time (TTS) y runtime
 * (para copiar/reconstruir las versiones B/C frase por frase). Deben partir IGUAL,
 * o las claves de audio por-oración no coincidirían.
 *
 * Lo delicado es NO partir donde el punto no cierra una oración:
 *  · abreviaturas: "Mr. Lane", "Mrs. Taylor"
 *  · iniciales / deletreo: "S. C. H. U. L. Z.", "p.m.", "a.m."
 */

const ABBREV = new Set(['mr', 'mrs', 'ms', 'dr', 'st', 'ave', 'jr', 'sr', 'vs', 'etc', 'no']);

/** Divide en oraciones. Si no hay corte real, devuelve el texto entero (un elemento). */
export function splitSentences(text: string): string[] {
  const out: string[] = [];
  let buf = '';

  const tokens = text.match(/\s+|[^\s]+/g) ?? [text];
  for (let i = 0; i < tokens.length; i++) {
    const tok = tokens[i]!;
    buf += tok;

    if (!/[.!?]["')\]]?$/.test(tok)) continue;
    const next = tokens[i + 1];
    if (next !== undefined && !/^\s/.test(next)) continue;

    const word = tok.replace(/[.!?"')\]]+$/, '').replace(/^[("'[]+/, '');
    const isInitial = /^[A-Za-z]$/.test(word);
    const isAbbrev = ABBREV.has(word.toLowerCase());
    if (isInitial || isAbbrev) continue;

    out.push(buf.trim());
    buf = '';
  }
  if (buf.trim()) out.push(buf.trim());
  return out.length ? out : [text.trim()];
}
