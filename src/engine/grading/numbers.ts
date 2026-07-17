/**
 * numbers.ts — un número es un número, se escriba como se escriba.
 *
 * El material dice "tenth floor" (lo escribimos así para que el TTS pudiera
 * pronunciarlo) y el ASR transcribe "10th floor". El alumno dice exactamente lo
 * correcto y la app lo marca mal. Lo mismo con "93" ↔ "ninety three",
 * "thirty-five" ↔ "35", "third" ↔ "3rd".
 *
 * No es un caso borde: la Unidad 1 tiene edades, direcciones, pisos y horas.
 * Todo se lleva a una forma canónica —dígitos— antes de comparar.
 */

const UNITS: Record<string, number> = {
  zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9,
  ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16,
  seventeen: 17, eighteen: 18, nineteen: 19,
};

const TENS: Record<string, number> = {
  twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90,
};

/** Ordinales que no son "cardinal + sufijo": hay que listarlos. */
const ORDINALS: Record<string, number> = {
  first: 1, second: 2, third: 3, fourth: 4, fifth: 5, sixth: 6, seventh: 7, eighth: 8,
  ninth: 9, tenth: 10, eleventh: 11, twelfth: 12, thirteenth: 13, fourteenth: 14,
  fifteenth: 15, sixteenth: 16, seventeenth: 17, eighteenth: 18, nineteenth: 19,
  twentieth: 20, thirtieth: 30, fortieth: 40, fiftieth: 50, sixtieth: 60,
  seventieth: 70, eightieth: 80, ninetieth: 90, hundredth: 100,
};

/** 1→1st, 2→2nd, 3→3rd, 11..13→th. Igual que lo escribe el ASR. */
export function ordinalSuffix(n: number): string {
  const last2 = n % 100;
  if (last2 >= 11 && last2 <= 13) return `${n}th`;
  switch (n % 10) {
    case 1:
      return `${n}st`;
    case 2:
      return `${n}nd`;
    case 3:
      return `${n}rd`;
    default:
      return `${n}th`;
  }
}

/**
 * Lleva todo número a dígitos: "ninety three" → "93", "tenth" → "10th".
 *
 * Recibe tokens ya separados y en minúscula. Los dígitos que ya vienen escritos
 * ("93", "10th") se dejan como están: son la forma canónica.
 */
export function canonicalNumbers(tokens: string[]): string[] {
  const out: string[] = [];
  let i = 0;

  while (i < tokens.length) {
    const t = tokens[i]!;
    const next = tokens[i + 1];

    // Compuestos: "twenty seven" → 27, "twenty first" → 21st.
    if (t in TENS && next) {
      if (next in UNITS && UNITS[next]! < 10) {
        out.push(String(TENS[t]! + UNITS[next]!));
        i += 2;
        continue;
      }
      if (next in ORDINALS && ORDINALS[next]! < 10) {
        out.push(ordinalSuffix(TENS[t]! + ORDINALS[next]!));
        i += 2;
        continue;
      }
    }

    if (t in ORDINALS) {
      out.push(ordinalSuffix(ORDINALS[t]!));
      i++;
      continue;
    }
    if (t in UNITS) {
      out.push(String(UNITS[t]!));
      i++;
      continue;
    }
    if (t in TENS) {
      out.push(String(TENS[t]!));
      i++;
      continue;
    }

    out.push(t);
    i++;
  }

  return out;
}
