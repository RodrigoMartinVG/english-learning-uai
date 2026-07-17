/**
 * DiagnosticsView — "tus puntos débiles".
 *
 * Convierte los errores acumulados en aprendizaje dirigido: en vez de "22
 * errores", muestra QUÉ fallás —una estructura, un sonido— con su tasa real, y
 * ofrece practicar exactamente eso. Ver ARQUITECTURA.md §7 (registro de errores).
 *
 * Es la diferencia entre un contador y un diagnóstico.
 */

import { weakSpots, weakestAtoms, type WeakSpot } from '../data/progress.ts';
import { atoms, units } from '../data/content.ts';
import { buildSession, DEFAULT_LENGTH, type Session } from '../engine/session.ts';

/** Etiquetas legibles para las estructuras gramaticales. */
const GRAMMAR_LABEL: Record<string, string> = {
  'be.present.affirmative': 'Verbo be — afirmativo',
  'be.present.negative': 'Verbo be — negativo',
  'be.present.interrogative': 'Verbo be — preguntas',
  'be.present.short-answer': 'Respuestas cortas (Yes, I am)',
  'be.contractions': 'Contracciones (I\'m, he\'s)',
  'pronouns.subject': 'Pronombres (I, you, he…)',
  'possessives.adjectives': 'Posesivos (my, your, his…)',
  'demonstratives': 'Demostrativos (this, that…)',
  'articles.indefinite': 'Artículos a / an',
  'articles.definite': 'Artículo the',
  'there-is.affirmative': 'There is / are',
  'there-is.negative': 'There isn\'t / aren\'t',
  'there-is.interrogative': 'Is there…? / Are there…?',
  'wh-questions': 'Preguntas con Wh-',
  'numbers.cardinal': 'Números',
  'nationalities': 'Nacionalidades',
  'spelling.alphabet': 'Deletreo',
};

/** El sonido, con una palabra de ejemplo para que se entienda cuál es. */
const PHONEME_LABEL: Record<string, string> = {
  θ: '/θ/ — el sonido de “th” en think',
  ð: '/ð/ — el “th” de this',
  tʃ: '/tʃ/ — “ch” de chair',
  dʒ: '/dʒ/ — “j” de charger',
  ʃ: '/ʃ/ — “sh” de shell',
  ŋ: '/ŋ/ — “ng” de morning',
  j: '/j/ — “y” de yellow',
  z: '/z/ — “s” sonora de coins',
  æ: '/æ/ — la “a” de pan',
  e: '/e/ — la “e” de pen',
  eɪ: '/eɪ/ — el diptongo de day',
  aɪ: '/aɪ/ — el diptongo de tie',
  ɪə: '/ɪə/ — el diptongo de here',
  eə: '/eə/ — el diptongo de stairs',
  ɔː: '/ɔː/ — la vocal de wardrobe',
};

const label = (w: WeakSpot) =>
  w.kind === 'grammar' ? (GRAMMAR_LABEL[w.tag] ?? w.tag) : (PHONEME_LABEL[w.tag] ?? `/${w.tag}/`);

export function DiagnosticsView({
  onBack,
  onStart,
}: {
  onBack: () => void;
  onStart: (s: Session) => void;
}) {
  const spots = weakSpots();

  const practice = () => {
    const ids = weakestAtoms(DEFAULT_LENGTH);
    if (!ids.length) return;
    onStart(
      buildSession(
        { scope: { kind: 'atoms', atomIds: ids }, mode: 'review', length: DEFAULT_LENGTH },
        atoms,
        units.flatMap((u) => u.aspects),
        'Tus puntos débiles'
      )
    );
  };

  return (
    <div className="diag">
      <p className="home__eyebrow">Diagnóstico</p>
      <h1>Tus puntos débiles</h1>

      {spots.length === 0 ? (
        <p className="diag__empty">
          Todavía no hay suficientes datos. Hacé algunas sesiones y acá va a aparecer dónde te
          conviene poner el foco: qué estructuras y qué sonidos se te resisten.
        </p>
      ) : (
        <>
          <p className="diag__intro">
            Ordenado por cuánto fallás. Esto sale de tus propios errores, no de una lista genérica.
          </p>
          <ul className="diag__list">
            {spots.map((w) => (
              <li key={`${w.kind}:${w.tag}`} className="diag__row">
                <span className={'diag__badge diag__badge--' + w.kind}>
                  {w.kind === 'phoneme' ? 'sonido' : 'gramática'}
                </span>
                <span className="diag__label">{label(w)}</span>
                <span className="diag__rate">
                  <span className="diag__bar">
                    <span style={{ width: `${Math.round(w.rate * 100)}%` }} />
                  </span>
                  {Math.round(w.rate * 100)}%
                  <em>
                    {w.fails}/{w.attempts}
                  </em>
                </span>
              </li>
            ))}
          </ul>
          <button className="btn btn--primary btn--wide" onClick={practice}>
            Practicar lo que más fallás →
          </button>
        </>
      )}

      <button className="btn btn--wide" onClick={onBack}>
        ← Volver
      </button>
    </div>
  );
}
