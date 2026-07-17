# Oda Language Hub — Documento de Arquitectura y Diseño

> Estado: **diseño aprobado, pre-implementación**. Este documento reemplaza a `especificacion.txt`
> como fuente de verdad arquitectónica. Nada se codea hasta que esto esté acordado.

## 0. Decisiones fundacionales (ya tomadas)

| Decisión | Elección | Consecuencia |
|---|---|---|
| Framework | React + TypeScript + Vite | Deroga la sección 6.1 de `especificacion.txt` (Lit/Web Components) |
| Audio | Híbrido: pregenerado en build + Web Speech API como fallback | Requiere paso de build y assets versionados |
| Plataforma | Local-first, deploy estático, sin backend | IndexedDB para progreso; sync es una decisión futura, no un rediseño |
| Proveedor TTS | **Kokoro-82M, local y libre**. Azure opcional | Sin credenciales, sin nube, sin límite — ver §5.4 |
| Imágenes | Extracción selectiva (~6 por unidad) | Los cómics de pág. 5 son contenido, no decoración — ver §2.5 |

---

## 1. Visión y alcance real

Una aplicación de entrenamiento auditivo y oral para el material oficial de **Inglés I (UAI)**,
diseñada desde el día uno para absorber Inglés II, III y IV sin refactor.

Tres objetivos, en orden de prioridad:

1. **Aprender el material de la unidad** por oído y por boca, no por lectura pasiva.
2. **Retener** lo aprendido (repetición espaciada real, no rachas ni gamificación vacía).
3. **Rendir el final oral** — la app debe poder simular al examinador.

El objetivo 3 es el que ordena todo lo demás. Cada mecánica debe justificar su existencia
respondiendo: *¿esto me acerca a poder sostener una conversación oral evaluada sobre esta unidad?*

---

## 2. Análisis del material fuente

### 2.1 Las 4 unidades son la misma plantilla

Este es el hallazgo que habilita la escalabilidad. Toda unidad de Inglés I tiene exactamente
estas secciones:

```
Presentación de la unidad (metas de aprendizaje)
Famous Quote
Presentación de situación comunicacional   ← diálogo/cómic
Grammar Tips (lectura y ejercicio)
Lectura sugerida + Audio de lectura sugerida
Ejemplo significativo                       ← texto descriptivo largo
Links (videos externos, diccionarios)
Words and phrases to learn / Word Quiz
Ejercitación (Trabajo Práctico)             ← N consignas
Actividad de cierre: Listening Comprehension N
Actividad de cierre: Composition "My Life: Chapter N"
Grilla de corrección                        ← claves oficiales
```

Inglés II/III/IV casi con certeza reusan esta plantilla (mismo autor, misma cátedra, mismo
diseño didáctico). **El esquema de datos se modela una vez.**

### 2.2 Arco pedagógico de Inglés I

| Unidad | Tema | Gramática | Función comunicativa |
|---|---|---|---|
| 1 | Bienvenida | `be`, posesivos, `there is/are`, demostrativos, `a/an/the` | Presentarse, identificar, deletrear |
| 2 | Estilo de vida | Simple present, adverbios de frecuencia, `have/has`, hora | Describir rutinas |
| 3 | Gente | `have got`, adv. de frecuencia, arrangements | Hablar de familia, coordinar planes |
| 4 | Lugares | `there is/are`, `can`, preposiciones, `some/any`, `how much/many` | Describir espacios, comprar, dar direcciones |

**Composition: My Life** es un hilo acumulativo: Cap. 1 = quién soy, Cap. 2 = mi rutina,
Cap. 3 = mi familia, Cap. 4 = dónde vivo. Al terminar las 4 unidades el alumno tiene un
monólogo autobiográfico completo. **Eso es el final oral.** La app debe tratar los 4 capítulos
como un solo artefacto que crece, no como 4 ejercicios sueltos.

### 2.3 Lo que aporta cada borrador

- `especificacion.txt` → PRD técnico. Vigente en: TTS/STT, normalización, estados de fallo,
  a11y, grammar hints, analytics. Obsoleto en: Lit, dataset plano, SM-2.
- `promt_analiis_material_unidad.md` → **el pipeline de extracción**. Es el activo más valioso
  del repo. Se conserva tal cual y se versiona.
- `Unidad_1_reconstruccion.md` → prueba de que el pipeline funciona. Aporta además:
  erratas del PDF original, ambigüedades de la grilla oficial, y una **ruta de dificultad en
  5 niveles** que adoptamos como currícula.
- `demo.html`, `demo (2).html`, `gemini-code-*.html` → prototipos validados de 5 mecánicas.
  Se conservan como referencia de UX y se descartan como código.

### 2.4 Deuda conocida del material (ya detectada)

La reconstrucción de U1 documenta erratas de OCR (`"Ok find you?"`, `"Ima systems manager"`,
`"Why is Sandy en the UAI"`), respuestas de la grilla que contradicen la consigna (Ejercitación 7:
la clave usa `door`, `printer`, `monitor screen` que no están en el banco de palabras), y
ambigüedades reales (Ejercitación 9h: `an instructor` es tan correcto como `the instructor`).

**Regla de diseño:** el contenido de la app nunca hereda una errata del fuente, pero **sí registra
que existe**. Cada atom lleva `sourceNote` opcional. Cuando la grilla oficial es discutible,
aceptamos ambas respuestas y mostramos una nota. El alumno rinde con la cátedra, no con nosotros:
tiene que saber qué espera la grilla *y* qué es correcto.

### 2.5 Las imágenes: el 95% es decoración, el 5% es contenido crítico

Auditadas las 63 páginas. El banner de 2379×696 se repite en cada página y las 31 imágenes de
la página 2 son el menú de íconos: **decoración pura, se descarta**.

Pero hay un hallazgo grave: **la "Presentación de situación comunicacional" de la página 5 de
cada unidad es un cómic, y su diálogo NO existe en la capa de texto del PDF.** La extracción
automática lo pierde entero. Son los 4 diálogos ancla del curso:

| Unidad | Situación | Gramática que practica |
|---|---|---|
| 1 | Mary y Eric se conocen en el pasillo | `be`, ocupación, `there is` |
| 2 | Cafetería: "Do you work here?" | simple present, rutinas, hora |
| 3 | Oficina: "Have you got your own office?" | `have got`, `how often`, arrangements |
| 4 | Oficina: "There's a coffee machine on that table" | `there is/are`, preposiciones, `can` |

**Mary reaparece en las unidades 1, 3 y 4.** El material tiene un hilo narrativo con personajes
recurrentes que nadie documentó. Esto valida el modelo de `speaker` de §5.1: Mary es un personaje
del curso, no una voz al azar. La app puede — y debe — sostener esa continuidad.

Consecuencia operativa: **estos 4 cómics se transcriben a mano** (vía render de página + lectura
visual, ya validado). Es contenido oficial que ninguna herramienta de texto recupera.

#### Política de imágenes

```typescript
interface ImageRef {
  src: string;
  role: 'source-comic' | 'exercise-data' | 'illustration';
  alt: string;             // obligatorio — el material es 100% inaccesible hoy
  transcribed?: string;    // texto contenido en la imagen, si lo hay
}
```

- `source-comic` → se extrae. 4 en total (pág. 5 de cada unidad). Se muestran como apoyo visual
  del Role-play, pero **el diálogo vive como átomos**, no como imagen.
- `exercise-data` → se extrae solo si el ejercicio es irresoluble sin ella. Verificado: el cuadro
  de la rutina de Peter (U2 Ejercitación 7) y la tabla de direcciones (U4 pág. 7) **sí salieron
  en la capa de texto**, así que se modelan como datos y no necesitan imagen.
- `illustration` → se descarta (fotos del CCK, Bill Skarsgård, banners). La app tiene su propia
  estética; no hereda el PowerPoint.

Render de páginas con PyMuPDF a 130 dpi; recorte manual de los 4 cómics. Es trabajo de una tarde,
una sola vez.

---

## 3. La idea arquitectónica central

> **El contenido no son ejercicios. El contenido son átomos con metadatos.
> Las mecánicas son funciones que consumen átomos.**

Este es el corazón del diseño y lo que separa esta app de un prototipo.

Si autoramos "ejercicios", cada mecánica nueva exige reescribir todo el contenido, y cada unidad
nueva exige reescribir todas las mecánicas. Es O(unidades × mecánicas) de trabajo manual.

Si autoramos **átomos** (una frase con su gramática, su función, su hablante, su audio, sus
variantes) y cada mecánica declara **qué átomos sabe consumir**, entonces:

- Agregar una unidad → escribís átomos, y las 12 mecánicas funcionan solas.
- Agregar una mecánica → escribís un selector, y funciona sobre las 4 unidades ya existentes.

Trabajo manual: O(unidades + mecánicas). **Esta es la razón por la que la app escala a Inglés IV.**

```
             ┌──────────────┐
   PDFs ───► │   PIPELINE   │ ───► content/*.json (átomos validados con Zod)
             └──────────────┘                    │
                                                 ▼
                                     ┌───────────────────────┐
                                     │  SELECTOR ENGINE      │  ¿qué átomos toca hoy?
                                     │  (SRS + currícula)    │
                                     └───────────────────────┘
                                                 │
                     ┌───────────────┬───────────┼───────────┬───────────────┐
                     ▼               ▼           ▼           ▼               ▼
                 Ósmosis       Minimal Pairs  Shadowing  Ping-Pong   Oral Exam Sim
                 (accepts:      (accepts:     (accepts:  (accepts:   (accepts:
                  phrase)        contrast)     phrase)    qa)         production)
```

---

## 4. Modelo de datos

Definido en TypeScript, validado en runtime y en CI con **Zod**. Un archivo JSON por unidad.

### 4.1 Tipos de átomo

```typescript
type AtomKind =
  | 'phrase'      // unidad mínima de audio: una oración pronunciable
  | 'dialogue'    // secuencia de turnos que referencian phrases
  | 'qa'          // pregunta + variantes + respuestas naturales
  | 'lexeme'      // palabra de vocabulario + ejemplo + foco fonético
  | 'contrast'    // par mínimo / homófono (it's vs its, /e/ vs /æ/)
  | 'exercise'    // ejercicio estructural del TP con su clave oficial
  | 'production'  // consigna de producción libre (Composition, describir)
  | 'listening';  // comprensión auditiva narrativa + preguntas
```

### 4.2 Núcleo común

```typescript
interface AtomBase {
  id: string;                 // estable y global: "en1.u1.p.007" — NUNCA se reusa ni reordena
  kind: AtomKind;
  course: 'en1' | 'en2' | 'en3' | 'en4';
  unit: number;

  // Trazabilidad al material oficial — innegociable
  source: {
    origin: 'extracted' | 'synthetic' | 'corrected';
    page?: number;            // página del PDF
    section?: string;         // "Ejercitación 2", "Ejemplo significativo"
    note?: string;            // errata detectada, ambigüedad de la grilla
  };

  // Metadatos que alimentan a los selectores de las mecánicas
  grammar: string[];          // ['be.present.interrogative', 'articles.indefinite']
  fn: string[];               // ['greet', 'ask.name', 'ask.existence']  (función comunicativa)
  topic: string[];            // ['personal_info', 'workplace']
  difficulty: 1 | 2 | 3 | 4 | 5;   // ruta de dificultad de §2.3

  tags?: string[];
}
```

### 4.3 `phrase` — el átomo más importante

```typescript
interface PhraseAtom extends AtomBase {
  kind: 'phrase';
  text: string;               // "Is there a cafeteria inside the enterprise?"
  gloss?: string;             // traducción de apoyo (ES), nunca protagonista
  ipa?: string;               // "/ɪz ðeər ə ˌkæfɪˈtɪəriə/"
  speaker: SpeakerId;         // define la voz — ver §5
  intonation?: 'rising' | 'falling';   // habilita el trainer de entonación
  alternatives?: string[];    // otras formas de decir lo mismo
  replies?: string[];         // respuestas naturales válidas
  audio?: AudioRef;           // inyectado por el build de TTS
  phoneticFocus?: string[];   // ['θ', 'tʃ']  → alimenta Minimal Pairs
}

interface AudioRef {
  src: string;                // "/audio/en1/u1/en1.u1.p.007.mp3"
  durationMs: number;
  hash: string;               // hash del texto+voz → invalida el cache si cambia el texto
}
```

`speaker` es la clave de la "variabilidad fonética" del PRD. El demo actual sortea una voz al
azar en cada render, lo que suena caótico y no enseña nada. Con `speaker`, Mary siempre suena
como Mary. La variabilidad se vuelve **diseño**: el equipo internacional del Diálogo 5 (Pedro
portugués, Anna alemana, Valentina rusa, Mehmet turco) entrena el oído en acentos reales
*con coherencia narrativa*.

### 4.4 Resto de los átomos

```typescript
interface DialogueAtom extends AtomBase {
  kind: 'dialogue';
  title: string;
  situation: string;
  turns: { speaker: SpeakerId; phraseId: string }[];   // referencias, no duplicación
  variants?: string[];        // "otras formas de la misma intención"
}

interface QaAtom extends AtomBase {
  kind: 'qa';
  prompt: string;
  promptVariants: string[];
  replies: string[];
  speaker: SpeakerId;
}

interface LexemeAtom extends AtomBase {
  kind: 'lexeme';
  word: string;
  pos: string;                // 'noun' | 'verb' | 'adjective' | ...
  gloss: string;
  examplePhraseId: string;    // toda palabra vive en una oración. Nunca aislada.
  focus: 'phonetic' | 'spelling' | 'translation' | 'variant';
  variantOf?: { uk: string; us: string };   // lift/elevator, return ticket/round-trip
}

interface ContrastAtom extends AtomBase {
  kind: 'contrast';
  pair: [string, string];     // ["it's", "its"] | ["pen", "pan"] | ["a", "an"]
  type: 'homophone' | 'minimal-pair' | 'article-liaison';
  discriminator: 'syntax' | 'phoneme';   // ¿se distingue por contexto o por sonido?
  examples: { text: string; correct: 0 | 1; phraseId?: string }[];
}

interface ExerciseAtom extends AtomBase {
  kind: 'exercise';
  prompt: string;             // consigna original, textual
  format: 'cloze' | 'reorder' | 'punctuate' | 'match' | 'transform' | 'error-hunt';
  items: {
    stem: string;             // "Mrs. Taylor is ___ engineer."
    accept: string[];         // ["an"]  — todas las respuestas válidas
    officialKey?: string;     // lo que dice la grilla, si difiere de accept
    note?: string;            // "La grilla exige 'the'; 'an' también es correcto"
  }[];
  audioViable: 'native' | 'adapted' | 'text-only';   // ver §6.3
}

interface ProductionAtom extends AtomBase {
  kind: 'production';
  prompt: string;             // consigna original
  wordBank?: string[];
  modelAnswer: string;        // referencia para shadowing de alta dificultad
  chapter?: number;           // "My Life: Chapter N" → hilo acumulativo
  rubric: string[];           // ['usa there is/are', 'incluye 2 negativas']
}

interface ListeningAtom extends AtomBase {
  kind: 'listening';
  narrative: string;          // el texto del audio
  speaker: SpeakerId;
  questions: { q: string; accept: string[] }[];
}
```

### 4.5 Reglas de integridad (validadas en CI)

1. Todo `id` es único, global y **estable de por vida** (el SRS del usuario apunta a esos ids).
2. Todo `examplePhraseId` / `phraseId` resuelve a un átomo existente.
3. Todo `phrase` tiene `speaker` válido y ese speaker existe en `speakers.json`.
4. Todo átomo `synthetic` está marcado como tal. Sin excepción.
5. Todo `exercise` con `officialKey ≠ accept[0]` tiene `note`.

---

## 5. Sistema de voz

### 5.1 Speakers, no voces

```typescript
interface Speaker {
  id: SpeakerId;              // 'mary' | 'eric' | 'receptionist' | 'anna' | 'narrator'
  displayName: string;
  accent: 'en-US' | 'en-GB' | 'en-AU';
  l1?: string;                // 'pt' | 'de' | 'ru' | 'tr' — para acentos no nativos
  gender: string;
  ttsVoice: string;           // id del proveedor: "en-US-AriaNeural"
  fallbackHint: string[];     // pistas para matchear voz local: ["Aria", "Google US"]
  rate: number;               // 0.85–1.0
}
```

### 5.2 Build-time TTS

```
content/en1/unit-1.json  ──┐
speakers.json ─────────────┼─►  scripts/build-audio.ts
                           │      · hash(text + speaker + rate)
                           │      · si el hash existe en el manifest → skip
                           │      · si no → llama al proveedor → mp3
                           │      · escribe public/audio/… + audio-manifest.json
                           └─►  inyecta AudioRef en el contenido servido
```

Incremental por hash: cambiar una frase regenera un archivo, no 400. El manifest se versiona,
los mp3 **no** van a git (van al artefacto de deploy o a Git LFS — decisión de implementación).

### 5.3 Runtime: `AudioService` (singleton)

Contrato único para toda la app. Ninguna mecánica toca `speechSynthesis` directamente.

```typescript
interface AudioService {
  speak(phraseId: string, opts?: { rate?: number }): Promise<void>;
  cancel(): void;             // SIEMPRE antes de un nuevo speak — bug de solapamiento del PRD
  preload(phraseIds: string[]): void;
  state: 'idle' | 'loading' | 'speaking' | 'error';
}
```

Cascada: `mp3 pregenerado` → `Web Speech API con fallbackHint` → `Web Speech API con cualquier
voz en-*` → error visible y honesto ("este audio no está disponible en tu dispositivo").

Cola serializada: un solo audio suena a la vez, siempre. `cancel()` antes de cada `speak()`.

### 5.4 Proveedor: Kokoro, local y libre

**Decisión revisada.** Este documento recomendaba Azure porque su capa gratuita alcanzaba de
sobra. Era cierto, pero "gratis" no es lo mismo que "libre": Azure exige cuenta, tarjeta de
crédito en el alta, una API key que hay que custodiar, y conexión para cada build. Nada de eso
hace falta.

**El proveedor por defecto es [Kokoro-82M](https://huggingface.co/hexgrad/Kokoro-82M)**
(Apache-2.0), corriendo local vía `kokoro-js`/ONNX. Sin key, sin cuenta, sin nube, sin límite
de uso. El modelo (~90 MB en q8) se descarga una vez y después el build funciona offline.

Medido en esta máquina, no estimado:

| | |
|---|---|
| Voces | 28 (20 en-US, 8 en-GB), todas neuronales |
| Carga del modelo | ~8,5 s, una vez por corrida |
| Velocidad | ~0,35–0,58× tiempo real en CPU → las 246 emisiones de la U1 en **~23 min** |
| Peso | mp3 64 kbps mono = **17%** del wav. La U1 entera ≈ 5 MB |
| Control de velocidad | `speed` nativo: 0.75× re-articula de verdad, no es time-stretch |
| Costo | **$0**, para siempre, sin cuota que se agote |

Los 23 minutos se pagan **una sola vez**: el build es incremental por hash, así que después
solo se sintetiza lo que cambió.

#### Lo que se pierde, y es real

Kokoro **solo tiene voces en-US y en-GB**. El acento no nativo del Diálogo 5 —Pedro portugués,
Anna alemana, Valentina rusa, Mehmet turco— **no se renderiza**: suenan como estadounidenses.
El campo `l1` de `speakers.json` queda documentado pero mudo.

Es una pérdida pedagógica genuina: entrenar el oído en acentos variados era un objetivo del PRD.
Pero es una pérdida **recuperable y aislada**: cada speaker declara su voz en cada proveedor
(`voice: { kokoro, azure }`), así que `--provider=azure` restituye los acentos sin tocar una
línea de contenido ni de mecánica. Es exactamente para esto que el proveedor está detrás de una
interfaz.

Orden de prioridades: un curso entero que suena bien y no depende de nadie vale más que cuatro
frases con acento portugués.

#### Alternativas evaluadas

| Opción | Veredicto |
|---|---|
| **Kokoro** (local, Apache-2.0) | **Elegida.** Calidad neuronal, 28 voces, sin credenciales |
| **Web Speech API** en runtime | Es lo que hacían los prototipos. Cero costo pero la voz depende del SO del usuario: la U1 sonaría distinta en cada máquina. Queda solo como fallback (§5.3) |
| **Piper** (local, MIT) | Digno y liviano, con voces multilingües que sí darían acentos. Calidad por debajo de Kokoro. Segundo plan B |
| **Azure Neural** | Opcional. Su capa F0 (500.000 chars/mes) cubre el curso entero varias veces, pero exige cuenta y key. Único camino a los acentos no nativos |
| **`edge-tts`** | **No.** Excelente y sin key, pero es un endpoint no documentado de Edge, sin garantía de estabilidad y en zona gris de términos de uso |

`build-audio.ts` habla con un `TtsProvider`. Cambiar de proveedor es un flag, no un refactor.

### 5.4.1 Azure (opcional): por qué sigue documentado

El volumen real, **medido** con `npm run build:audio -- --dry-run` sobre la Unidad 1 ya modelada
(no estimado: el script cuenta los caracteres que se le mandarían a Azure):

```
Unidad 1:  91 átomos → 246 emisiones →  7.898 chars   = 1,6% del free tier mensual
Inglés I (4 unidades, extrapolado)     ≈ 32.000 chars  ≈ 6%
Inglés I + II + III + IV (extrapolado) ≈ 126.000 chars ≈ 25%
```

La capa gratuita de Azure Speech (F0) cubre **500.000 caracteres de voz neuronal por mes**.
Las 4 materias completas entran en **una cuarta parte** del free tier, y la U1 es la unidad más
larga de todas (20 páginas contra 13-16), así que la extrapolación peca de generosa. Como además
el build es incremental por hash, un mes normal regenera decenas de emisiones y no miles.
El costo proyectado es **$0**, indefinidamente. Esto deja de ser una decisión económica.

> Nota: la primera estimación de este documento decía ~14.000 chars/unidad, casi el doble de lo
> real. El error venía de contar átomos como emisiones y suponer frases más largas. Se corrige
> con el dato medido; la conclusión no cambia, pero el margen es mayor del que se creía.

Una emisión no es un átomo: un `phrase` con dos alternativas y variante lenta son cuatro
emisiones; un `dialogue` son cero (reusa las de sus `phrase`). De ahí 91 → 246.

Azure aporta una sola cosa que Kokoro no puede dar: **acento no nativo real**. Se logra dándole
texto en inglés a una voz `pt-BR` / `de-DE` / `ru-RU` / `tr-TR`; el motor lo lee con la fonología
de ese idioma. Es una aproximación —no un modelo de interlengua— pero es lo más cerca que se
llega sin grabar hablantes reales.

Con `--provider=azure`, el volumen medido de la U1 (7.898 chars) es el **1,6%** de los 500.000
mensuales del free tier F0. Las 4 materias entrarían en ~25%.

Se usa así, y solo si querés los acentos:

```bash
cp .env.example .env          # completar AZURE_SPEECH_KEY y AZURE_SPEECH_REGION
npm run build:audio -- --provider=azure
```

### 5.5 Velocidades: no multiplicar los assets

El PRD pide velocidades variables. **No se pre-generan variantes por velocidad**: eso triplicaría
los assets para un beneficio marginal.

- Por defecto: `HTMLAudioElement.playbackRate` en runtime. `preservesPitch` está activo por
  defecto, así que 0.75×–1.0× suena natural sin bajar el tono.
- Excepción: los átomos marcados `slowVariant: true` (frases largas de shadowing, `production`
  model answers) **sí** se pre-renderizan en una segunda pasada con SSML `<prosody rate="slow">`.
  Un TTS lento de verdad re-articula las palabras; el time-stretch solo las estira. Para
  entrenar el oído en frases difíciles, la diferencia importa.

### 5.6 Listening Comprehension: los audios oficiales no existen

Los 4 PDFs referencian las pistas por un link externo que **no está en el material**. Se verificó:
el PDF trae únicamente las preguntas y las respuestas de la grilla, nunca la narrativa.

Por lo tanto el campo `narrative` de todo `ListeningAtom` es **contenido escrito por nosotros**,
marcado `origin: 'synthetic'` sin excepción, con una sola restricción dura: debe ser consistente
con las respuestas oficiales de la grilla. Ejemplo, U1: la narrativa debe hacer verdadero que
*"Her name is Anna"*, *"She is from a small town"* y *"No, there isn't [a job for her]"*.

Es una ganancia disfrazada de pérdida: podemos escribir la narrativa con el léxico exacto de la
unidad y con el speaker que queramos, en vez de heredar una pista de calidad desconocida.

---

## 6. Mecánicas

### 6.1 Registro de mecánicas

```typescript
interface Mechanic {
  id: string;
  name: string;
  skill: 'perception' | 'comprehension' | 'retrieval' | 'production' | 'interaction';
  level: 1 | 2 | 3 | 4 | 5;               // ruta de dificultad
  accepts: (atom: Atom, ctx: Ctx) => boolean;   // el selector
  minAtoms: number;
  buildRound: (atoms: Atom[], ctx: Ctx) => Round;
  grade: (round: Round, input: UserInput) => Result;
}
```

Agregar una mecánica = agregar un objeto a este registro. Nada más.

### 6.2 Catálogo

Nivel 1 — **Percepción** (¿oigo la diferencia?)
1. **Minimal Pairs** — `contrast`. `it's/its`, `they're/their`, `/e/ vs /æ/`, `a/an`.
   Dos botones, un audio. Sub-segundo. Entrena discriminación fonémica pura.
2. **Article Liaison** — `contrast` type `article-liaison`. `/ə/` vs `/ən/` a velocidad.
   Nace de Ejercitación 9 (U1).

Nivel 2 — **Comprensión** (¿qué significa lo que oigo?)
3. **Ósmosis** — `phrase`. Audio ciego → 4 opciones de texto. Distractores de **otra**
   `topic` pero **misma** `grammar` (más fino que el demo actual, que solo filtraba por
   categoría). Tras acertar: panel de expansión con `alternatives` y `replies`.
4. **Audio Matching** — `phrase[]` de misma `topic`. Columna audio ↔ columna texto.
   Fase 1 preguntas, fase 2 respuestas. Memoria de trabajo.
5. **Listening Comprehension** — `listening`. Las 4 pistas oficiales + preguntas.

Nivel 3 — **Recuperación** (¿puedo producir la forma correcta?)
6. **Cloze auditivo** — `exercise` format `cloze`. Se oye el diálogo con un hueco;
   se elige/dice la pieza. Nace de Ejercitación 1, 2, 3 (U1), 1, 2, 9 (U2).
7. **Syntax Builder** — `exercise` format `reorder`. Bloques de audio arrastrables.
   Nace de Ejercitación 5 (U1), 3 (U3), 4 (U4).
8. **Error Hunt** — `exercise` format `error-hunt`. Se oye una frase mal; hay que detectar
   y corregir. Nace de Ejercitación 8 (U2), 4 (U3). El material **ya trae** los errores.
9. **Intonation Trainer** — `phrase` con `intonation`. Yes/no ascendente vs Wh- descendente.
   Es la conversión honesta de Ejercitación 4 (U1), que en papel es solo ortografía.

Nivel 4 — **Producción** (¿puedo decirlo?)
10. **Shadowing Lab** — `phrase`. Oír → repetir → transcribir → comparar. Ver §6.4.
11. **Ping-Pong** — `qa`. La app pregunta, el alumno responde por voz, contrarreloj.
    Fluidez de recuperación bajo presión temporal.
12. **Spelling Drill** — `lexeme` focus `spelling`. Deletreo. **Input por teclado, no por ASR**
    — el material lo pide (Karel Schulz) pero el ASR falla sistemáticamente con letras sueltas.
    La reconstrucción de U1 ya lo advierte.

Nivel 5 — **Interacción** (¿puedo sostener una conversación?)
13. **Role-play** — `dialogue`. El alumno toma un rol; la app hace el otro. Turnos por voz.
14. **Oral Exam Simulator** — `production`. **La mecánica destino.** Ver §6.5.

### 6.3 El campo `audioViable`

Tres valores, tres destinos:
- `native` → la mecánica auditiva es fiel al ejercicio (Ejercitación 2, 3, 6 de U1).
- `adapted` → el ejercicio es visual pero se transforma (Ejercitación 4 → Intonation Trainer).
- `text-only` → es inherentemente escrito (puntuación, mayúsculas, apóstrofes).
  **No lo forzamos a audio.** Se presenta como dictado/tipeo. Honestidad pedagógica sobre
  consistencia de UI.

### 6.4 Evaluación de habla — con honestidad técnica

**Lo que la Web Speech API puede hacer:** devolver una transcripción y una confianza global.

**Lo que NO puede hacer:** puntuar pronunciación a nivel fonema. No existe scoring de `/θ/`
en el navegador. Cualquier "85% de pronunciación" construido sobre `SpeechRecognition` es
**inventado**, y un alumno que confía en un número inventado se entrena mal.

Por lo tanto, el veredicto de una mecánica de habla se compone de tres señales reales:

1. **Match estructural** — transcripción normalizada vs objetivo. Con la regex del PRD
   (`toLowerCase().replace(/[^\w\s]|_/g,"").replace(/\s+/g," ").trim()`), más diff a nivel de
   palabra: no un booleano, sino *qué palabra falló*. Eso es feedback accionable.
2. **Grammar hints** — `SpeechRecognitionList` cargada con el léxico de la unidad. Mejora
   el reconocimiento drásticamente y es la propiedad infrautilizada que señala el PRD.
3. **Auto-cotejo A/B** — se graba la voz del alumno (`MediaRecorder`) y se reproduce
   inmediatamente contra el audio de referencia del speaker. El oído humano del propio alumno
   es, hoy, el mejor evaluador de prosodia disponible sin backend. Es la técnica que usan los
   intérpretes profesionales, y es gratis.

Si más adelante se quiere scoring fonémico real (Azure Pronunciation Assessment), entra como
un `PronunciationProvider` detrás de una interfaz. El diseño lo deja abierto sin prometerlo.

### 6.5 Oral Exam Simulator

La mecánica que justifica el proyecto.

- Toma los `production` atoms de las 4 unidades (los 4 capítulos de *My Life*).
- El examinador (voz `narrator`, acento configurable) hace preguntas sin guion visible.
- Sin texto en pantalla. Sin ayudas. Timer.
- Post-sesión: transcripción completa, cobertura de `rubric` (¿usó *there is/are*? ¿adverbios
  de frecuencia? ¿*have got*?), inventario de gramática detectada vs esperada, y la grabación
  para escucharse.
- Modo *warm-up*: mismas preguntas, con banco de palabras visible y sin timer.

---

## 7. Motor de repetición espaciada

**FSRS, no SM-2.** El PRD proponía SM-2 (1987). FSRS es el estado del arte actual, tiene
implementación TypeScript madura (`ts-fsrs`), y modela mejor la curva de olvido real. El costo
de adoptarlo ahora es cero; migrar después cuesta el historial.

### Granularidad: la tarjeta es `(atomId, skill)`

Un alumno puede **reconocer** `"Is there a cafeteria?"` de oído y ser incapaz de **producirla**.
Son dos memorias distintas y se olvidan a ritmos distintos. Una tarjeta por par átomo-habilidad:

```typescript
interface Card {
  atomId: string;
  skill: 'perception' | 'comprehension' | 'retrieval' | 'production';
  fsrs: FSRSState;            // due, stability, difficulty, reps, lapses
}
```

`kind: 'phrase'` genera hasta 4 tarjetas; `kind: 'contrast'` genera 1 (perception).

### Selector de sesión

```
1. Tarjetas vencidas (due <= hoy), priorizadas por retrievability más baja
2. Si faltan → material nuevo de la unidad activa, en orden de difficulty 1→5
3. Se agrupan por mecánica compatible (accepts) para no marear con cambios de contexto
4. Se intercala: nunca dos rondas seguidas de la misma mecánica
5. Interleaving por topic — está probado que supera al blocking para retención
```

### Registro de errores

Cada fallo guarda `{ atomId, skill, mechanic, userInput, timestamp }`. De ahí sale el
diagnóstico real: *"fallás `/θ/` en el 70% de los intentos"*, *"confundís they're/their por
contexto sintáctico, no por sonido"*. Eso es analytics útil, no una racha de días.

---

## 8. Estructura del proyecto

```
/
├── content/                       # ← fuente de verdad del contenido
│   ├── schema.ts                  #   Zod: la ley
│   ├── speakers.json
│   └── en1/
│       ├── unit-1.json … unit-4.json
├── material/                      # ← intocable: PDFs oficiales
│   ├── N1_Unidad_1.pdf … N1_Unidad_4.pdf
├── drafts/                        # ← artefactos humanos intermedios
│   ├── PROMPT_EXTRACCION.md       #   (ex promt_analiis_material_unidad.md)
│   ├── unidad-1.reconstruccion.md #   (ya existe, listo)
│   └── _archive/                  #   demos html, especificacion.txt
├── scripts/
│   ├── extract-pdf.ts             # PDF → texto + imágenes
│   ├── validate-content.ts        # Zod + integridad referencial → CI
│   └── build-audio.ts             # TTS incremental por hash
├── public/audio/                  # generado, no versionado
└── src/
    ├── app/                       # shell, router, providers
    ├── engine/
    │   ├── srs/                   # FSRS, cards, scheduler
    │   ├── session/               # selector, interleaving
    │   └── grading/               # normalize, diff, rubric
    ├── audio/
    │   ├── AudioService.ts        # TTS + cola + fallback
    │   ├── Recognition.ts         # ASR + grammar hints + timeout
    │   └── Recorder.ts            # MediaRecorder para A/B
    ├── mechanics/                 # una carpeta por mecánica
    │   ├── registry.ts
    │   ├── osmosis/ minimal-pairs/ shadowing/ ping-pong/ …
    ├── data/
    │   ├── content.ts             # loader + índices por grammar/topic/fn
    │   └── db.ts                  # Dexie/IndexedDB: progreso, cards, errores
    └── ui/                        # design system (§9)
```

**Separación clave:** `content/` y `src/` no se conocen. El contenido no importa código; el
código no hardcodea contenido. Un colaborador puede escribir la Unidad 5 sin abrir `src/`.

---

## 9. Dirección estética

### Principio: la estética debe servir a la atención, no competir con ella

Una app de entrenamiento auditivo tiene una restricción brutal que las apps normales no tienen:
**mientras suena el audio, la pantalla no debe pedir nada.** Cada animación durante un estímulo
auditivo compite con el canal que estamos entrenando. La mitad del diseño es saber cuándo
no dibujar.

### Propuesta: "Estudio de audio nocturno"

Un instrumento, no un juguete. La referencia mental es un sintetizador o una consola de
mezcla: superficie oscura, un acento vivo, la forma de onda como protagonista.

- **Base**: gris azulado profundo (`#0B0E14`), superficies elevadas por luminosidad (nunca
  por sombras duras). Modo claro disponible pero secundario — se estudia de noche.
- **Acento**: uno solo, saturado, para el foco activo. Verde/rojo reservados **exclusivamente**
  para veredictos. Si el acento también es el color de éxito, el ojo pierde la señal.
- **Waveform**: el canvas de los demos es un acierto y se conserva. Es el único elemento que
  se mueve durante el audio, y se mueve porque *representa* el audio. No es decoración.
- **Tipografía**: sans variable (Inter/Geist) + mono para IPA y deletreo. El IPA en mono
  no es capricho: alinea los símbolos y los hace comparables.
- **Movimiento**: 120–200ms, easing de salida. Feedback inmediato al input, quietud durante el
  estímulo. `prefers-reduced-motion` respetado en serio.
- **Sin gamificación de vanidad**: nada de rachas, corazones ni confeti. La métrica es
  *"cuántas frases sostenés en producción sin ayuda"*. Un alumno adulto de una licenciatura
  no necesita una mascota.

### Design tokens

CSS custom properties en `:root` (el PRD ya lo pedía y es correcto), consumidas por React.
Sin CSS-in-JS runtime: penaliza el tiempo hasta el primer audio.

```css
:root {
  --bg: #0B0E14;  --surface: #141924;  --surface-hi: #1E2532;
  --text: #E6EAF2; --text-dim: #8B94A7;
  --accent: #5B8CFF;                  /* foco activo — NUNCA veredicto */
  --success: #3DD68C; --error: #FF6B6B;   /* SOLO veredictos */
  --focus-ring: 2px solid var(--accent);
}
```

### Accesibilidad (no opcional)

- Touch targets ≥ 48×48px, en especial el micrófono.
- `aria-label` en todo botón de audio/mic; `aria-live` para veredictos.
- Toda mecánica auditiva tiene ruta de teclado completa.
- Contraste AA mínimo sobre `--bg`.
- **El audio nunca es el único canal de información**: siempre hay una forma de ver el texto
  (aunque cueste puntos). Un alumno hipoacúsico debe poder usar la app.

---

## 10. Estados de fallo (contrato de UX)

El PRD tiene razón: en apps de voz, el hardware y los permisos fallan. Estados de primera clase,
no `catch` silenciosos:

| Situación | Comportamiento |
|---|---|
| Mic denegado | Modal con instrucciones **por navegador** + la mecánica sigue en modo selección |
| Mic no soportado | Detección al arranque, banner honesto, mecánicas de habla ocultas |
| ASR no arranca | Botón en estado "Iniciando…", nunca falsamente inerte |
| Silencio prolongado | Timeout 7s → corta y ofrece reintentar (evita mic colgado en ruido) |
| Audio pregenerado 404 | Fallback a Web Speech, log silencioso, sin romper la sesión |
| Sin voces `en-*` | Advertencia clara: la app necesita audio para funcionar |
| Doble click en Play | `cancel()` + debounce. Nunca dos voces solapadas |

---

## 11. Roadmap

**Fase 0 — Cimientos de contenido** *(sin UI)*
Reorganizar el repo (§8). Escribir `schema.ts`. Convertir `unidad-1.reconstruccion.md` a
`unit-1.json`. `validate-content.ts` en verde. **Salida: la Unidad 1 existe como datos.**

**Fase 1 — Canal de audio**
`speakers.json`, `build-audio.ts`, `AudioService` con fallback. **Salida: cualquier átomo suena,
igual en toda máquina.**

**Fase 2 — Vertical slice**
Shell + router + design tokens + **una** mecánica end-to-end (Ósmosis) + Dexie. **Salida: se
puede estudiar de verdad, con una sola mecánica. Punto de validación del diseño entero.**

**Fase 3 — Motor SRS**
FSRS, cards por `(atom, skill)`, selector, interleaving. **Salida: la app decide qué mostrar.**

**Fase 4 — Catálogo de mecánicas**
Las 13 restantes contra el registro. Cada una es aditiva y aislada.

**Fase 5 — Unidades 2, 3, 4**
Solo contenido. Si en esta fase hay que tocar `src/`, el diseño falló — y ese es exactamente
el test que importa.

**Fase 6 — Oral Exam Simulator + PWA**
La mecánica destino, y el modo offline instalable.

---

## 12. Riesgos

| Riesgo | Mitigación |
|---|---|
| **La curación de contenido es el cuello de botella real, no el código** | Fase 0 primero. El pipeline LLM produce borradores; un humano cura. 1 unidad ≈ 200-300 átomos |
| Costo/límites del proveedor TTS | Build incremental por hash; Piper (local, gratis) como plan B |
| ASR poco fiable con acento rioplatense | Grammar hints + el veredicto nunca depende solo del ASR (§6.4) |
| Sobre-ingeniería antes de tener contenido | Fase 2 es un slice vertical deliberado: 1 mecánica funcionando > 14 a medias |
| Inglés II rompe la plantilla | El schema tiene `tags` y `topic` abiertos; los campos rígidos son los del arco A1, comunes a todo curso inicial |
| Ids inestables destruyen el SRS | Regla dura: los ids nunca se reusan ni se reordenan. Validado en CI |

---

## 14. Arquitectura de sesiones (la capa que faltaba)

> Añadida tras la Fase 2. El slice vertical funcionaba y aun así la dinámica se sentía pobre.
> El diagnóstico, con números: **52 de 91 átomos eran inalcanzables** (ninguna mecánica los
> consumía) y **una mecánica era un destino, no un paso**. Tocabas "Ósmosis" y entrabas a rondas
> aleatorias infinitas: sin meta, sin largo, sin progresión, sin cierre. Un juguete, no una clase.

### 14.1 El error: mecánica ≠ sesión

El §6 modeló bien las mecánicas y el §7 el SRS, pero entre "hay 91 átomos" y "el alumno practica
20 minutos" faltaba una capa. Sin ella, cada mecánica tiene que inventarse su propio ciclo de
vida, su propio criterio de fin y su propia idea de progreso — y ninguna puede saber qué viene
después, porque no hay un después.

```
Course → Unit → Aspect        ← QUÉ estudiar (contenido curado)
                   ×
                 Mode         ← CÓMO entrenarlo (forma)
                   ↓
                Session       ← meta + largo + escalera + cierre
                   ↓
                Step = (Mechanic, Atom[])
```

**Las mecánicas pasan a ser pasos, no destinos.** Es lo que vuelve consistente el crecimiento:
la Unidad 2 no necesita código nuevo, necesita declarar sus aspectos.

### 14.2 Aspect: la unidad de estudio

Un tag no es un tema. Medido en la U1: `be.present.affirmative` está en **46** átomos —es aire,
está en todos lados— y `be.present.negative` en **1**. Exponer 17 tags como si fueran 17 temas
sería confundir el mecanismo de selección con la interfaz.

Los aspectos se **curan a mano por unidad**, siguiendo las secciones de Grammar Tips del propio
material. Es ~30 min por unidad y compra una progresión didáctica real.

```typescript
interface Aspect {
  id: string;            // 'be' | 'articles' | 'there-is'
  title: string;         // "El verbo be: formas y contracciones"
  summary: string;       // una línea, para la tarjeta
  order: number;         // el orden en que el material los enseña
  /** Un átomo pertenece al aspecto si solapa en CUALQUIERA de estas dimensiones. */
  match: { grammar?: GrammarTag[]; fn?: FunctionTag[]; topic?: TopicTag[] };
  source?: { page?: number; section?: string };
}
```

**Regla de integridad nueva:** todo átomo pertenece al menos a un aspecto. Un átomo huérfano es
invisible en la navegación — existe, tiene audio, y nadie puede llegar a él. El validador lo
reporta. Es la misma clase de bug que los 52 inalcanzables, y ahora se detecta solo.

Los aspectos **se solapan a propósito**: `"What's your name?"` está en *Saludos*, en *Verbo be* y
en *Datos personales*. Un mismo átomo entrenado desde tres ángulos distintos es interleaving
gratis, no duplicación.

### 14.3 Mode: cómo se entrena

| Modo | Para qué | Selección | Escalera |
|---|---|---|---|
| **Descubrir** | Primer contacto con un aspecto | Átomos nuevos del aspecto | Sube 1→5: percepción → comprensión → recuperación → producción |
| **Entrenar** | Machacar antes del parcial | Todo el aspecto, vencido o no | Fija en un nivel |
| **Repasar** | El día a día | Tarjetas vencidas (FSRS), mezcladas entre aspectos y unidades | Mixta, interleaved |
| **Examen** | Simulacro de final oral | `production` acumulados | Solo nivel 5 |

**Descubrir** y **Repasar** son los dos modos que importan: uno construye, el otro sostiene.
*Entrenar* existe porque un alumno real tiene parciales, y *Examen* porque hay un final oral.

### 14.4 Session: meta, largo y cierre

**Largo fijo: 12 ítems.** No por tiempo (corta a mitad de una grabación) ni "hasta saldar lo
vencido" (un lunes con 140 tarjetas se abandona). Un largo fijo hace que el final sea predecible
y visible —"7 de 12"— y que retomar sea barato.

```typescript
interface SessionSpec {
  scope:
    | { kind: 'aspect'; course: Course; unit: number; aspectId: string }
    | { kind: 'unit'; course: Course; unit: number }
    | { kind: 'due' };                    // lo que el SRS mandó a repasar
  mode: 'discover' | 'drill' | 'review' | 'exam';
  length: number;                         // 12
}

interface Step {
  mechanicId: string;
  atomIds: string[];                      // los que consume ese paso
  skill: Skill;                           // qué tarjeta actualiza al resolverse
}

interface Session {
  spec: SessionSpec;
  title: string;
  steps: Step[];
}
```

El builder:

```
1. Reunir el pool según scope
2. Ordenar por la escalera (difficulty asc) si el modo la usa
3. Por cada átomo, elegir mecánicas compatibles (accepts) del nivel que toca
4. Interleaving: nunca dos pasos seguidos de la misma mecánica si hay alternativa
5. Cortar en `length`
```

Un átomo que ninguna mecánica acepta **no desaparece en silencio**: el builder lo cuenta y la
sesión lo reporta. Es el mismo principio que §5.6 y §14.2 — el contenido inalcanzable es un bug,
y un bug que no se ve es peor.

### 14.5 Navegación: "Hoy" + libre

Híbrido, y el orden importa:

```
Home
├── HOY  ─── una sesión ya armada por el SRS (repasar + lo nuevo que toca)
└── Unidades
    └── Unidad 1 · Bienvenida
        ├── progreso por aspecto
        └── Aspecto → [Descubrir] [Entrenar]
```

**Hoy** es la puerta por defecto: sin parálisis de elección, y es lo que sostiene la retención
entre unidades — el problema real de cursar la Unidad 4 mientras se olvida la 1. **Libre** existe
porque el lunes hay parcial de `there is/are` y el alumno tiene derecho a machacar eso y nada más.

### 14.6 Consecuencia: qué falta construir

Con esta capa, el catálogo de mecánicas del §6.2 deja de ser una lista de deseos y pasa a ser
**la cobertura del contenido**. Cada tipo de átomo sin mecánica es contenido muerto:

| Tipo | Átomos U1 | Mecánica que lo rescata | Nivel |
|---|---|---|---|
| `phrase` | 42 | Ósmosis ✅, Audio Matching, Shadowing | 2, 2, 4 |
| `lexeme` | 18 | Word Focus, Spelling Drill | 1, 4 |
| `qa` | 12 | Ping-Pong, Ósmosis de respuestas | 4, 2 |
| `exercise` | 9 | Cloze auditivo, Syntax Builder, Error Hunt | 3 |
| `contrast` | 5 | Minimal Pairs | 1 |
| `dialogue` | 2 | Role-play | 5 |
| `production` | 2 | Oral Exam Simulator | 5 |
| `listening` | 1 | Listening Comprehension | 2 |

También queda visible un desbalance del contenido: **72 átomos en niveles 1-2 contra 7 en niveles
4-5**. La escalera tiene base ancha y punta fina — justo la parte que lleva al final oral. Se
corrige agregando átomos de producción, no código.

---

## 13. Preguntas abiertas

Resueltas: proveedor TTS (§5.4, Azure free tier, $0), audios de listening (§5.6, se escriben y
se sintetizan), imágenes (§2.5, extracción selectiva de 4 cómics).

Pendientes, ninguna bloqueante:

1. **Deploy**: GitHub Pages vs Netlify. Ambos sirven; Netlify simplifica el build de audio.
   Decidible en Fase 2.
2. **Hosting de los mp3**: ~4-6 MB por curso. Git LFS vs generarlos en CI y publicarlos como
   artefacto de deploy. Decidible en Fase 1.
3. **El hilo narrativo de Mary** (§2.5): el material lo insinúa sin explotarlo. ¿La app lo hace
   explícito — una historia que progresa por unidades — o se mantiene neutral? Es una decisión
   de producto, no técnica, y se puede tomar tarde.
