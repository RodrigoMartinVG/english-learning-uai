# Plan — Unidad 5: apropiarse de un texto

> Estado: **diseño para revisar** (antes de codear). Igual que hicimos con la
> arquitectura general y con la U2, esto se aprueba primero.
>
> Material oficial: `CUADERNILLO ... INGLÉS I II III & IV_UAI_2026.pdf`, los 4
> textos de Inglés I (págs. 3-13). Empezamos por el **Texto 2** ("What is a
> square?", Hannah Darken / plus.maths.org), que es el que mejor conocés.

---

## 1. Qué es distinto en esta unidad

Las Unidades 1-4 enseñan **estructuras** (verbo *to be*, presente simple, *can*…):
el átomo es una frase, y el alumno la percibe, la ordena, la produce. La Unidad 5
no enseña una estructura nueva: el alumno **elige un texto real y se lo apropia**
hasta poder hablar de él con soltura — explicarlo, exponerlo, responder preguntas,
improvisar.

El objeto de estudio ya no es una frase suelta: es **el texto y sus ideas**.

Detalle que lo une con lo anterior y que no es casual: cada texto trae una
*After-Reading Task* que apunta a la gramática de la unidad respectiva. El Texto 2
de Inglés I pide *"Find 5 example sentences which use the Verb To Be"*. O sea:
estos textos **coronan** la gramática de las U1-4 aplicándola a contenido real.
No es un giro que rompe con lo hecho; es la cima.

---

## 2. La escalera de apropiación (la pedagogía)

Misma filosofía que la escalera de las U1-4 (de guiado a libre), pero orientada al
texto. Seis capas; cada una retira un poco de andamiaje:

| # | Capa | Qué hace el alumno | Se apoya en (mecánica/vista) |
|---|------|--------------------|------------------------------|
| 1 | **Encuentro** | Lee el texto completo con sus figuras. Lo escucha leído, párrafo a párrafo. | **Reader** (vista nueva) + voces alternativas + shadowing inline |
| 2 | **Vocabulario y conceptos** | Se encuentra con los términos clave (*curvature, geodesic, sphere, pseudosphere, digon, right angle*): definición + la oración del texto + audio + IPA. | `lexeme` (existe) |
| 3 | **Comprensión** | Responde qué dice el texto (factual → idea central de cada sección). Ordena las secciones para ver el esqueleto del argumento. | `qa` + `exercise` (reorder/match) (existen) |
| 4 | **Reformulación** | Lo dice con sus palabras: completa un resumen hablado, parafrasea una oración clave, explica un concepto en voz alta. El texto empieza a ocultarse. | `production` + Cloze (existen) |
| 5 | **Diálogo** | Responde preguntas por voz, de lo factual a lo interpretativo (*"¿por qué los lados parecen curvos pero son rectos?"*, *"¿qué te sorprendió?"*). | Ping-Pong / `qa` (existen) |
| 6 | **Exposición** | Da una exposición oral de 1-2 min con un andamiaje (esquema + arranques de frase) que se retira; después improvisa respuestas a preguntas inesperadas. | Examen Oral / `production` (existen) |

**Los cuatro ángulos de apropiación** (la "innovación" de trabajarlo desde
distintas perspectivas) no son capas aparte: son cómo se *colorea* cada capa.
El mismo texto trabajado desde el ángulo…

- **lingüístico** — la gramática que usa (la propia consigna pide oraciones con *to be*),
- **conceptual** — las ideas matemáticas (curvatura, geodésica, qué hace a un "cuadrado"),
- **estructural** — cómo se construye el argumento (definición → curvatura → formas en la esfera → pseudoesfera → conclusión),
- **personal** — tu mirada: si estás de acuerdo, qué te sorprendió, cómo se lo explicarías a un amigo.

El andamiaje se retira a medida que subís: en la capa 1 el texto está a la vista;
en la 4 se oculta; en la 6 exponés solo con un esquema que también podés quitar.

---

## 3. El modelo de datos

### 3.1 La estructura del archivo

Una sola `unit-5.json` (curso `en1`, unit 5). Los **4 textos son 4 aspectos**
(el alumno elige uno y trabaja su escalera). Encaja con lo que ya existe: la home
muestra "Unidad 5 · 4 temas", y cada tema es un texto.

Para agrupar los átomos de un texto necesito una dimensión nueva de selección: hoy
`atomInAspect` matchea por `grammar`/`fn`/`topic`, y "a qué texto pertenece" no es
ninguna de esas. Propongo la extensión mínima, espejo del patrón que ya existe:

- Nuevo campo **opcional** en los átomos: `text?: 'square' | 'why2' | 'four-years' | 'until-18'`
  (id corto y validado del texto al que pertenece).
- Nuevo selector **opcional** en el `match` del aspecto: `match.text?: string[]`.
- `atomInAspect` gana una rama `text` (4 líneas).

Es aditivo: no toca nada de las U1-4 (no usan `text`).

### 3.2 El átomo nuevo: `reading` (el texto como recurso)

Es la pieza central y lo único realmente nuevo. Modela el texto tal cual, con sus
figuras, como recurso siempre disponible.

```ts
readingAtomSchema = {
  ...atomBase,                     // id (en1.u5.rd.001), course, unit, grammar/fn/topic, difficulty
  kind: 'reading',
  text: 'square',                  // el texto al que pertenece (y su propia membresía)
  title: 'What is a square?',
  author: 'Hannah Darken',         // atribución visible en la vista
  source: { title: 'plus.maths.org', url: 'https://plus.maths.org/content/what-square' },
  speaker: 'narrator',             // voz para el read-aloud
  sections: [
    {
      heading?: 'Curvature of surfaces',
      blocks: [
        { kind: 'para', text: 'A square is a shape with four straight sides…' },
        { kind: 'list', items: ['A plane has zero curvature…', 'A sphere has positive…'] },
        { kind: 'figure', image: <imageRef>, caption?: 'An honest square…' },
      ],
    },
    // …
  ],
  afterReadingTask?: 'Find 5 example sentences which use the Verb To Be.',
}
```

- **Audio:** cada bloque `para` publica una pista con clave derivada
  (`en1.u5.rd.001.sec.0.b.1`), igual que hoy `contrast`/`exercise` publican bajo
  claves derivadas. Así el Reader reproduce párrafo por párrafo y el shadowing
  funciona sobre cada uno.
- **Figuras:** `image` es el `imageRefSchema` que YA existe (`/img/...`, `role`,
  `alt` obligatorio). Las extraigo del PDF (ver §4).
- **No es una tarjeta de SRS ni pasa por una mecánica:** es un recurso. Se lee y se
  escucha; las mecánicas lo ignoran (`accepts` = false). El SRS sigue puntuando las
  capas 2-6, que sí son práctica.

### 3.3 Lo que se reusa tal cual

- **`lexeme`** (glosario): `examplePhraseId` apunta a una frase del texto. Por eso
  extraigo ~6-8 **oraciones clave como `phrase`** (que además son las candidatas de
  la *After-Reading Task* de *to be*, y sirven de shadowing). Doble uso, cero
  estructura nueva.
- **`qa`** (comprensión y diálogo, capas 3 y 5): `speaker` = examiner, `replySpeaker`
  = student. `promptVariants` = la misma pregunta reformulada. **Las respuestas se
  enriquecen — ver §3.5.**
- **`exercise`** (capas 3 y 4): `reorder` para ordenar secciones/ideas; `match` para
  concepto↔definición; `cloze` para el resumen con huecos.
- **`production`** (capas 4 y 6): `modelAnswer` + `modelVariants` (ya existe, lo
  agregamos para la guía de expresiones) + `rubric` (lo consume el Examen Oral).
  Para la exposición con esqueleto, un campo opcional nuevo `scaffold?: string[]`
  (los arranques de frase / bullets del outline). Es aditivo y opcional.

### 3.5 Las respuestas como puente al texto (modos de respuesta)

El corazón pedagógico de la unidad. Una pregunta sobre el texto no tiene *una*
respuesta correcta: tiene varias formas de responderla, y **cada forma es una manera
distinta de relacionarse con el texto**. El alumno no memoriza una respuesta; ve el
mismo contenido respondido desde varios ángulos y así se apropia de él.

Cada pregunta (comprensión, capa 3; diálogo, capa 5) trae un conjunto de respuestas
modelo, y cada una lleva un **modo** que declara *cómo* se apoya en el texto:

| modo | qué hace | ángulo que encarna |
|------|----------|--------------------|
| `quote` | se apoya en el texto, citando la parte relevante | estructural / textual |
| `paraphrase` | dice lo mismo con palabras propias | lingüístico |
| `connect` | relaciona esa idea con otra parte del texto o un concepto | conceptual |
| `personal` | aporta tu mirada: qué sorprende, si estás de acuerdo, cómo lo explicarías | personal |

Ejemplo (Texto 2) — pregunta: *"Can a triangle have three right angles?"*

- **quote:** *"The text says: 'On the sphere… they add up to 270.' So yes — on a sphere a triangle can have three 90-degree angles."*
- **paraphrase:** *"Yes. On a curved surface the angles of a triangle add up to more than 180 degrees, so all three can be right angles."*
- **connect:** *"This happens because the sphere has positive curvature — the same idea of Gaussian curvature the text introduces earlier."*
- **personal:** *"What surprised me is that this triangle looks impossible on paper, but on a globe it's just walking along the equator and two longitudes."*

No hace falta que toda pregunta tenga los 4 modos: las factuales quizás solo `quote`
+ `paraphrase`; las interpretativas suman `connect` + `personal`. La app puede
mostrarlas etiquetadas ("apoyándote en el texto" / "con tus palabras" / "conectando"
/ "tu mirada") para que el alumno vea el abanico y elija con cuál practicar.

**Cómo se modela:** las respuestas dejan de ser `string[]` planas y pasan a
`{ text, mode }[]`. En `qa` reemplaza (o convive con) `replies`; para el Examen Oral,
`production.modelVariants` gana la misma etiqueta de modo. Es la enriquecedora, y la
que hay que decidir con cuidado (ver §3.4 y §6).

### 3.4 Resumen de cambios al schema

| Cambio | Tipo | Alcance |
|--------|------|---------|
| `KIND_CODE.reading = 'rd'` + `rd` en `ATOM_ID_RE` | aditivo | 2 líneas |
| `readingAtomSchema` + sumarlo al `discriminatedUnion` | nuevo | ~30 líneas |
| `text?` en `atomBase`, `match.text?` en aspecto, rama en `atomInAspect` | aditivo | ~6 líneas |
| `scaffold?: string[]` en `productionAtomSchema` | aditivo opcional | 1 línea |
| **Respuestas con modo** (`answerModes`): `{text, mode}[]` en `qa` y en `production.modelVariants` (§3.5) | cambio de forma | ver nota |

**Nota sobre las respuestas con modo:** es el único cambio que toca una forma
existente (`qa.replies` es hoy `string[]`). Dos caminos:
(a) *agregar* un campo nuevo `answers: {text, mode}[]` y dejar `replies` como está
(las U1-4 no lo tocan; la U5 usa el nuevo) — **más seguro, lo recomiendo**;
(b) migrar `replies` a objetos en todo el proyecto — más limpio pero toca las U1-4.
Nada de esto rompe las U1-4 si vamos por (a): todo lo nuevo es opcional o un kind aparte.

---

## 4. Cambios fuera del schema (src/ y pipeline)

1. **Extracción (paso 1 del build):** sacar del PDF (págs. 6-8) las ~5 figuras del
   Texto 2 → `public/img/en1-u5/square-*.png`, con `alt` descriptivo. Componer el
   texto en secciones/bloques dentro del `reading`.
2. **`Reader` (vista nueva):** renderiza un `reading` — secciones, figuras, botón de
   play por párrafo, voces alternativas, grabar para shadowear. Es lo único nuevo de UI
   de peso.
3. **`content.ts`:** `reading` publica claves derivadas → tratarlo como
   `contrast`/`exercise` en `OWNS_AUDIO`/cobertura (que no cuente el `reading` como
   "falta audio").
4. **`build-audio.ts`:** generar una pista por bloque `para` del `reading` (claves
   `.sec.i.b.j`), segundo pase de voces alternativas como ya hace.
5. **`UnitView`:** cuando la unidad tiene textos (aspectos con `reading`), el tema
   abre el Reader arriba + la escalera de prácticas debajo. Reusa SessionPlayer y las
   mecánicas para las capas 2-6.
6. **`build-ipa.ts`:** IPA de las frases clave extraídas (ya funciona por frase).

---

## 5. Plan de construcción (después de aprobar esto)

1. Schema: `reading`, `text`, `scaffold` (+ tests de validación).
2. Extraer figuras + componer el `reading` del Texto 2.
3. `Reader` + integración en `UnitView`; `content.ts`/pipeline de audio.
4. Contenido del Texto 2, capa por capa (glosario → comprensión → reformulación →
   diálogo → exposición), con `validate`/`audit`/`test` en verde.
5. Audio + IPA del Texto 2.
6. **Revisión con vos del Texto 2** (lo conocés mejor: preguntas, profundidad de la
   exposición, qué conceptos son los centrales).
7. Replicar el molde a los Textos 1, 3 y 4.

---

## 6. Lo que necesito que me guíes (Texto 2)

Cuando revises, estas son las decisiones donde tu conocimiento del texto manda:

- **Conceptos centrales del glosario:** ¿los 6 que listé (*curvature, geodesic,
  sphere, pseudosphere, digon, right angle*) o agregás/quitás alguno?
- **Profundidad de la exposición (capa 6):** ¿alcanza una exposición de 1-2 min que
  recorra definición → curvatura → ejemplos en superficies curvas → conclusión, o
  querés que el alumno llegue a defender/discutir (nivel más alto)?
- **Preguntas del diálogo (capa 5):** ¿cuáles son las 4-5 preguntas que un examen
  real haría sobre este texto? (las factuales las derivo yo; las interpretativas
  quiero afinarlas con vos).
- **Modos de respuesta (§3.5):** ¿te cierran los 4 modos (quote/paraphrase/connect/
  personal) como las formas de responder que enriquecen la comprensión, o querés
  otro reparto? Yo redacto las respuestas de cada modo y vos las ajustás.
- **Las 5 oraciones con *to be*** de la After-Reading Task: ¿las elijo yo del texto o
  tenés preferidas?
```
