/**
 * Role-play — sostener una conversación. Ver ARQUITECTURA.md §6.2 (mecánica 13).
 *
 * Nivel 5: el alumno toma un papel del diálogo y la app hace el otro. Turno a
 * turno, por voz. Es el escalón anterior al final oral: ya no es repetir una
 * frase suelta, es responder en contexto y a tiempo.
 *
 * Rescata los 2 átomos `dialogue`, que son los diálogos ancla del material —
 * los cómics de la página 5, que ni siquiera existían en la capa de texto del PDF.
 */

import type { Atom, DialogueAtom, PhraseAtom } from '../../../content/schema.ts';
import type { Mechanic } from '../types.ts';

export interface RolePlayTurn {
  speaker: string;
  phrase: PhraseAtom;
  /** true si le toca hablar al alumno. */
  mine: boolean;
}

export interface RolePlayRound {
  dialogue: DialogueAtom;
  /** El papel que toma el alumno. */
  myRole: string;
  partner: string;
  turns: RolePlayTurn[];
  neighbourhood: string[];
}

export const rolePlay: Mechanic<RolePlayRound> = {
  id: 'role-play',
  name: 'Role-play',
  skill: 'production',
  level: 5,
  blurb: 'Tomá un papel del diálogo. La app hace el otro, por voz.',

  accepts(atom: Atom): boolean {
    return atom.kind === 'dialogue' && atom.turns.length >= 2;
  },

  /**
   * Un papel, una variante. Los dos se practican, en momentos distintos.
   *
   * No es simetría por prolijidad: cada papel produce gramática distinta. En el
   * diálogo de la recepción, solo la recepcionista formula preguntas y solo Karel
   * da respuestas cortas y dice números. Quien haga siempre de Karel nunca va a
   * preguntar nada.
   *
   * Primero el que responde y después el que abre: entrar contestando es más
   * fácil que arrancar la conversación en frío.
   */
  variants(atom: Atom): string[] {
    if (atom.kind !== 'dialogue') return [];
    const roles = [...new Set(atom.turns.map((t) => t.speaker))];
    const first = atom.turns[0]!.speaker;
    return [...roles.filter((r) => r !== first), ...roles.filter((r) => r === first)];
  },

  buildRound(target: Atom, pool: Atom[], variant?: string): RolePlayRound | null {
    if (target.kind !== 'dialogue') return null;

    const byId = new Map(pool.filter((a): a is PhraseAtom => a.kind === 'phrase').map((p) => [p.id, p]));
    const roles = [...new Set(target.turns.map((t) => t.speaker))];
    if (roles.length < 2) return null;

    const first = target.turns[0]!.speaker;
    const myRole = variant && roles.includes(variant) ? variant : (roles.find((r) => r !== first) ?? roles[1]!);
    const partner = roles.find((r) => r !== myRole) ?? first;

    const turns: RolePlayTurn[] = [];
    for (const t of target.turns) {
      const phrase = byId.get(t.phraseId);
      if (!phrase) return null; // el validador ya garantiza que no pase
      turns.push({ speaker: t.speaker, phrase, mine: t.speaker === myRole });
    }
    if (!turns.some((t) => t.mine)) return null;

    return {
      dialogue: target,
      myRole,
      partner,
      turns,
      neighbourhood: turns.map((t) => t.phrase.text),
    };
  },
};
