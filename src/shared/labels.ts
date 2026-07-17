/**
 * labels.ts — nombres legibles para los tags internos.
 *
 * Los tags (`ask.origin`, `be.present.interrogative`, `θ`) son para la máquina.
 * Acá viven las etiquetas que ve el alumno, en un solo lugar: las usan el
 * diagnóstico y la guía de expresiones. Si falta una, se cae al tag crudo.
 */

/** Funciones comunicativas → "qué querés lograr al hablar". */
export const FN_LABEL: Record<string, string> = {
  greet: 'Saludar',
  'introduce-self': 'Presentarte',
  'ask.name': 'Preguntar / decir el nombre',
  'ask.spelling': 'Deletrear',
  'ask.origin': 'Preguntar / decir de dónde sos',
  'ask.age': 'Preguntar / decir la edad',
  'ask.occupation': 'Preguntar / decir la ocupación',
  'ask.marital-status': 'Preguntar / decir el estado civil',
  'ask.address': 'Preguntar / decir la dirección',
  'ask.nationality': 'Preguntar / decir la nacionalidad',
  'ask.existence': 'Preguntar si algo existe (there is / are)',
  'ask.location': 'Preguntar / decir dónde está algo',
  'ask.possession': 'Decir de quién es algo',
  'ask.routine': 'Preguntar / describir rutinas',
  'ask.time': 'Preguntar / decir la hora',
  'ask.frequency': 'Preguntar / decir con qué frecuencia',
  'ask.permission': 'Pedir permiso',
  'ask.price': 'Preguntar el precio',
  'ask.identity': 'Preguntar quién es alguien',
  'describe.place': 'Describir un lugar',
  'describe.person': 'Describir a una persona',
  'describe.routine': 'Describir tu rutina',
  'state.fact': 'Afirmar un hecho',
  confirm: 'Confirmar (Yes, I am)',
  deny: 'Negar (No, it isn’t)',
  correct: 'Corregir',
  thank: 'Agradecer',
  'offer-help': 'Ofrecer ayuda',
  'make-request': 'Pedir algo',
  'propose-plan': 'Proponer un plan',
  'accept-plan': 'Aceptar un plan',
  'give-directions': 'Dar indicaciones',
  'classroom-language': 'Lenguaje de clase',
};

/** Estructuras gramaticales → cómo se llaman "en criollo". */
export const GRAMMAR_LABEL: Record<string, string> = {
  'be.present.affirmative': 'Verbo be — afirmativo',
  'be.present.negative': 'Verbo be — negativo',
  'be.present.interrogative': 'Verbo be — preguntas',
  'be.present.short-answer': 'Respuestas cortas (Yes, I am)',
  'be.contractions': 'Contracciones (I’m, he’s)',
  'pronouns.subject': 'Pronombres (I, you, he…)',
  'possessives.adjectives': 'Posesivos (my, your, his…)',
  demonstratives: 'Demostrativos (this, that…)',
  'articles.indefinite': 'Artículos a / an',
  'articles.definite': 'Artículo the',
  'there-is.affirmative': 'There is / are',
  'there-is.negative': 'There isn’t / aren’t',
  'there-is.interrogative': 'Is there…? / Are there…?',
  'wh-questions': 'Preguntas con Wh-',
  'numbers.cardinal': 'Números',
  nationalities: 'Nacionalidades',
  'spelling.alphabet': 'Deletreo',
  'present-simple.affirmative': 'Presente simple — afirmativo',
  'present-simple.negative': 'Presente simple — negativo',
  'present-simple.interrogative': 'Presente simple — preguntas',
  'present-simple.third-person': 'Tercera persona (-s / -es)',
  'have-has': 'have / has',
  'frequency-adverbs': 'Adverbios de frecuencia',
  'time.at': 'La hora con at',
};

/** Fonemas → el sonido con una palabra de ejemplo. */
export const PHONEME_LABEL: Record<string, string> = {
  'θ': '/θ/ — el sonido de “th” en think',
  'ð': '/ð/ — el “th” de this',
  'tʃ': '/tʃ/ — “ch” de chair',
  'dʒ': '/dʒ/ — “j” de charger',
  'ʃ': '/ʃ/ — “sh” de shell',
  'ŋ': '/ŋ/ — “ng” de morning',
  j: '/j/ — “y” de yellow',
  z: '/z/ — “s” sonora de coins',
  'æ': '/æ/ — la “a” de pan',
  e: '/e/ — la “e” de pen',
  'eɪ': '/eɪ/ — el diptongo de day',
  'aɪ': '/aɪ/ — el diptongo de tie',
  'ɪə': '/ɪə/ — el diptongo de here',
  'eə': '/eə/ — el diptongo de stairs',
  'ɔː': '/ɔː/ — la vocal de wardrobe',
};

export const fnLabel = (tag: string): string => FN_LABEL[tag] ?? tag;
export const grammarLabel = (tag: string): string => GRAMMAR_LABEL[tag] ?? tag;
export const phonemeLabel = (tag: string): string => PHONEME_LABEL[tag] ?? `/${tag}/`;
