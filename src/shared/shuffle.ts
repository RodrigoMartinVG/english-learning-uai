/**
 * shuffle.ts — barajado justo (Fisher-Yates), en un solo lugar.
 *
 * Estaba copiado en 6 archivos. Una copia con un `<` en vez de `<=` sesga el
 * resultado sin que se note; tenerlo una vez y testeado lo evita.
 */

/** Devuelve una copia barajada. No muta el original. */
export function shuffle<T>(arr: readonly T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

/** Un elemento al azar, o undefined si está vacío. */
export function pick<T>(arr: readonly T[]): T | undefined {
  return arr.length ? arr[Math.floor(Math.random() * arr.length)] : undefined;
}
