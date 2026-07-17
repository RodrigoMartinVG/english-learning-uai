/**
 * sentences.ts — partir un texto en oraciones para pausar entre ellas.
 *
 * Kokoro pausa en un punto casi lo mismo que en una coma, así que varias
 * oraciones seguidas suenan pegadas y apuradas ("Hi. OK. And you?"). La solución
 * es generar cada oración por separado e insertar un silencio real entre ellas.
 *
 * Lo delicado es NO partir donde el punto no cierra una oración:
 *  · abreviaturas: "Mr. Lane", "Mrs. Taylor"
 *  · iniciales / deletreo: "S. C. H. U. L. Z." (Karel), "p.m.", "a.m."
 * La regla: no se corta si lo que precede al punto es una sola letra o una
 * abreviatura conocida. Eso cubre los tres casos de un saque.
 */

const ABBREV = new Set(['mr', 'mrs', 'ms', 'dr', 'st', 'ave', 'jr', 'sr', 'vs', 'etc', 'no']);

/** Divide en oraciones. Si no hay corte real, devuelve el texto entero (un elemento). */
export function splitSentences(text: string): string[] {
  const out: string[] = [];
  let buf = '';

  // Recorre carácter a carácter para poder mirar el contexto de cada punto.
  const tokens = text.match(/\s+|[^\s]+/g) ?? [text];
  for (let i = 0; i < tokens.length; i++) {
    const tok = tokens[i]!;
    buf += tok;

    // ¿Este token termina una oración? Debe cerrar con . ! o ? y venir un espacio.
    if (!/[.!?]["')\]]?$/.test(tok)) continue;
    const next = tokens[i + 1];
    if (next !== undefined && !/^\s/.test(next)) continue; // no había espacio: sigue

    // La "palabra" antes del signo, sin el signo.
    const word = tok.replace(/[.!?"')\]]+$/, '').replace(/^[("'[]+/, '');
    const isInitial = /^[A-Za-z]$/.test(word); // "S", "p", "m"
    const isAbbrev = ABBREV.has(word.toLowerCase());
    if (isInitial || isAbbrev) continue; // no cierra oración

    out.push(buf.trim());
    buf = '';
  }
  if (buf.trim()) out.push(buf.trim());
  return out.length ? out : [text.trim()];
}
