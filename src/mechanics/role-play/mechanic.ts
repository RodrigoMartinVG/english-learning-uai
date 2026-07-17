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

  buildRound(target: Atom, pool: Atom[]): RolePlayRound | null {
    if (target.kind !== 'dialogue') return null;

    const byId = new Map(pool.filter((a): a is PhraseAtom => a.kind === 'phrase').map((p) => [p.id, p]));
    const roles = [...new Set(target.turns.map((t) => t.speaker))];
    if (roles.length < 2) return null;

    // El alumno toma el papel de quien MENOS habla primero: entrar respondiendo
    // es más fácil que abrir la conversación en frío.
    const first = target.turns[0]!.speaker;
    const myRole = roles.find((r) => r !== first) ?? roles[1]!;
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
