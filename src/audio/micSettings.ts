/**
 * micSettings — la preferencia de "corte" del micrófono, compartida por todos los
 * modos con voz (SpeakPanel de los ejercicios y el Banco de práctica).
 *
 * "Corte" es cuánto silencio aguanta el reconocedor antes de cerrar la toma solo:
 *  · leadMs — cuánto espera a que ARRANQUES a hablar (antes de la primera palabra).
 *  · silenceMs — cuánto perdona una pausa DENTRO de la frase, ya empezada.
 *
 * Es una sola preferencia global (localStorage), así se configura una vez y aplica
 * en toda la app. No hay más "sensibilidad" que tocar: la Web Speech API no expone
 * el modelo acústico (ver nota en AudioService).
 */

export type Corte = 'rapido' | 'normal' | 'paciente';

export const CORTES: Record<Corte, { lead: number; silence: number; label: string }> = {
  rapido: { lead: 5000, silence: 1500, label: 'rápido' },
  normal: { lead: 8000, silence: 3000, label: 'normal' },
  paciente: { lead: 12000, silence: 5000, label: 'paciente' },
};

export const CORTE_ORDER: Corte[] = ['rapido', 'normal', 'paciente'];

const KEY = 'oda.mic.corte';

export function getCorte(): Corte {
  try {
    const v = localStorage.getItem(KEY) as Corte | null;
    return v && v in CORTES ? v : 'normal';
  } catch {
    return 'normal';
  }
}

export function setCorte(c: Corte): void {
  try {
    localStorage.setItem(KEY, c);
  } catch {
    /* modo incógnito o cuota: se pierde la preferencia, no la sesión */
  }
}

export function nextCorte(c: Corte): Corte {
  return CORTE_ORDER[(CORTE_ORDER.indexOf(c) + 1) % CORTE_ORDER.length]!;
}
