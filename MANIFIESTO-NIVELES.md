# Manifiesto de niveles — cómo se construye Inglés 1, 2, 3 y 4

Este documento define **cómo se replica un nivel** para que la app quede homogénea a
medida que se agregan Inglés 2, 3 y 4. Complementa `ARQUITECTURA.md` (que explica el
*porqué*); acá está el *cómo*, operativo.

> **Principio rector:** un nivel = un `course` (`en1`..`en4`). **Todo cuelga del campo
> `course`.** El motor no sabe de "niveles": consume átomos etiquetados con su curso. Por
> eso agregar un nivel es **agregar contenido**, casi sin tocar código.

---

## 1. Lo que YA es multi-nivel (no se toca)

Estos pilares son *course-agnostic* y se reusan tal cual para cada nivel — **ahí está la
homogeneidad**:

- **Esquema:** `content/schema.ts` ya declara `COURSES = ['en1','en2','en3','en4']`.
- **Descubrimiento de contenido:** `import.meta.glob('content/*/unit-*.json')` en
  `src/data/content.ts`. Una carpeta nueva `content/en2/` **aparece sola**, sin tocar imports.
- **Progreso:** se guarda por id de átomo (`en2.u1.p.007`) en localStorage. Cada nivel queda
  **aislado automáticamente** por el prefijo del id.
- **Motor de sesión** (`engine/session.ts`), **mecánicas** (`mechanics/*`), **audio**
  (`audio/AudioService.ts`, `scripts/build-audio.ts`), **SRS** (`engine/srs/fsrs.ts`):
  todos operan sobre átomos, sin distinguir nivel. **No se tocan al agregar un nivel.**
- **Voces:** `content/speakers.json` y `content/kokoro-voices.ts` son compartidos. Reusar los
  mismos speakers da **continuidad de voz** entre niveles (recomendado).

## 2. Lo que FALTA (refactor de UI, una sola vez)

Único gap para soportar varios niveles en la app: **elegir el nivel**. Hoy el Home muestra
todos los cursos juntos y el brand dice "· Inglés I" fijo. El refactor (ver §6):

1. **Registro de cursos** con metadatos (nombre visible, orden).
2. **Curso actual** en el estado de la app; el Home, el repaso global y las stats se
   **acotan al curso elegido**.
3. **Selector de nivel** que se **auto-saltea cuando hay un solo curso** (sin cambio de UX
   hoy; "just works" cuando entre Inglés 2).

Es un refactor acotado a `src/app/App.tsx` + un `content/courses.json`. No toca el motor.

---

## 3. Anatomía de un nivel (qué crear)

```
content/
  en2/
    unit-1.json
    unit-2.json
    ...
  speakers.json        ← compartido (reusar)
  kokoro-voices.ts     ← compartido
  schema.ts            ← compartido (ya soporta en2)
```

### 3.1 Un `unit-*.json`

```jsonc
{
  "$schema": "../unit.schema.json",
  "course": "en2",              // el nivel
  "unit": 1,                    // número de unidad
  "title": "…",
  "goals": ["…", "…"],
  "aspects": [ /* etapas/temas */ ],
  "atoms":   [ /* el contenido */ ]
}
```

### 3.2 Aspects (los "temas"/etapas)

Cada aspecto **selecciona** átomos por etiquetas (no los contiene):

```jsonc
{
  "id": "greetings",
  "title": "Saludos y presentación",
  "summary": "…",
  "order": 1,
  "match": { "grammar": [...], "fn": [...], "topic": [...], "textId": [...] }
}
```

- Un átomo entra en un aspecto si comparte **alguna** etiqueta de `match` (o su `textId`).
- Un átomo puede caer en **varios** aspectos (es esperable; la barra de unidad deduplica).
- **Unidad de textos** (como U5): cada aspecto matchea por `textId` → la guía/guiones viven
  por-texto. **Unidad de gramática** (U1–U4): matchea por `grammar/fn/topic`.

### 3.3 Atoms (el contenido)

- **Id:** `enN.uM.KIND.NNN` (ej. `en2.u1.p.007`). El id **codifica curso y unidad** — de ahí
  sale el aislamiento del progreso. No repetir ids.
- **Kinds disponibles:** `phrase`, `qa`, `production`, `exercise`, `dialogue`, `reading`,
  `lexeme`, `contrast`, `listening`. Campos por kind: ver `content/schema.ts` (fuente de
  verdad) y `ARQUITECTURA.md §4`.
- **Etiquetas** (`grammar`, `fn`, `topic`) definen qué mecánicas y aspectos lo toman, y el
  diagnóstico. Usar valores **del enum** (el esquema los valida; ej. `topic` no acepta
  valores libres).
- **`phrase`** es el átomo estrella: `text`, `gloss`, `ipa`, `speaker`, y `alternatives`
  (las formas alternativas de decir lo mismo → alimentan la guía y las voces).
- **`qa`** (preguntas del examen / interacción): `prompt`, `promptVariants`, `replies`.
  Convención de exhaustividad (ver Unidad 6): **~3 formas de preguntar + ~5 de responder**.
- **`production`**: `modelAnswer`, `modelVariants`, `scaffold`, `steps` (`{prompt, segment}`),
  `rubric` (`{text, detect?}`). Con `steps ≥ 2` es **reconstruible** en "Armá el guion". El
  **capstone** de la unidad lleva `chapter` (`MY LIFE: CHAPTER n`).

### 3.4 Speakers y voces

- Reusar `content/speakers.json`. Agregar un speaker nuevo **solo** si el nivel introduce un
  personaje que no existe. Cada speaker mapea a una voz Kokoro (`voice.kokoro`).
- Los "Guiones modelo" ofrecen `MODEL_VOICES` (6 voces) — definido en `kokoro-voices.ts`,
  compartido.

---

## 4. Pipeline para dar de alta un nivel (checklist)

1. **Crear** `content/enN/unit-*.json` con sus `aspects` y `atoms`.
2. **IPA** de las frases: `npm run build:ipa` (completa el campo `ipa` de las `phrase`).
3. **Speakers**: reusar; agregar en `content/speakers.json` solo si hace falta.
4. **Validar contenido**: `npm run validate` (reglas de integridad, §4.5 de ARQUITECTURA) —
   y `npm run check` (typecheck + tests + validate).
5. **Audio**: `npm run build:audio`.
   - **Nunca dos builds a la vez** (corrompe el manifest + funde la CPU). Serial siempre.
   - Es incremental (por hash), **poda huérfanos** y hace cache-busting por hash.
   - Mientras corre, el dev server ignora los `.mp3` (ver `vite.config.ts`), así que la app
     no se recarga en loop.
6. **Metadatos del curso**: agregar la entrada en `content/courses.json` (tras el refactor §6).
7. Listo: el nivel **aparece solo** en el selector; el resto de la app lo consume sin cambios.

## 5. Reglas que mantienen la homogeneidad

- **No** duplicar lógica por nivel. Si algo "necesita saber el curso", se filtra por el campo
  `course`, no se hardcodea `en2`.
- **No** crear mecánicas ni vistas específicas de un nivel. Si un nivel necesita una mecánica
  nueva, se agrega al registro (`mechanics/registry.ts` + `views.tsx`) y queda disponible para
  **todos** los niveles vía su `accepts(atom)`.
- **Textos con copyright** (cuadernillos UAI, artículos): en `material/*.pdf`, **gitignored**.
  Se usan como **base** para contenido propio (resúmenes/paráfrasis), **no** se reproducen
  verbatim en el repo público.
- **Exhaustividad de variantes**: frases con `alternatives`; preguntas con `promptVariants` +
  `replies` (apuntando a lo que la evaluación pesa: gramática + léxico).

## 6. El refactor del selector de nivel (diseño objetivo)

Cuando se decida ejecutarlo (idealmente al arrancar Inglés 2):

1. **`content/courses.json`**: `[{ id:"en1", name:"Inglés 1", order:1 }, { id:"en2", … }]`.
   O derivarlo de los cursos presentes en `units`. Da el nombre visible y el orden.
2. **Estado `course` en `App`**: un curso actual. El Home filtra `units` por curso; el
   "Repaso de hoy" pasa a `scope: { kind:'due', course }`; `statsFor`/`weakSpots` se acotan
   por prefijo `enN.`. El brand ("· Inglés I") se vuelve dinámico.
3. **Selector**: pantalla/landing que lista los cursos. **Si hay uno solo, se saltea** y entra
   directo — sin cambio de UX hasta que exista un segundo nivel.
4. La **pila de navegación** ya existente (atrás real) suma el nivel como raíz.

Con esto, agregar Inglés 2/3/4 es **solo contenido** + una línea en `courses.json`.

---

## 7. Runbook: el día que agreguemos Inglés 2 (paso a paso)

> El refactor de §6 **ya está hecho** (2026-07-21): `content/courses.json` existe con en1–en4,
> el selector se auto-saltea con un solo curso, y todo (Home, repaso, stats) se acota por
> curso. `en2` ya está en `courses.json`; **aparecerá solo en cuanto tenga unidades.**

1. **Fuente.** Conseguir el material de Inglés 2 (cuadernillo/PDF). Va en `material/` (que está
   **gitignored**: copyright). Se usa como **base**, no se copia verbatim.

2. **Crear las unidades.** Una carpeta y un JSON por unidad:
   ```
   content/en2/unit-1.json
   content/en2/unit-2.json
   …
   ```
   Cada archivo con `"course": "en2"`, sus `aspects` (temas, con su `match`) y sus `atoms`
   (ids `en2.uN.KIND.NNN`). Copiar la forma de una unidad de `content/en1/` como plantilla.
   Mantener las convenciones: frases con `alternatives`; preguntas con ~3 `promptVariants` +
   ~5 `replies`; producciones con `steps`/`scaffold`/`rubric`; el capstone con `chapter`.

3. **IPA de las frases** (completa el campo `ipa` de cada `phrase`):
   ```
   npm run build:ipa
   ```

4. **Speakers.** Reusar `content/speakers.json` (continuidad de voz). Agregar uno nuevo solo
   si en2 trae un personaje que no existe.

5. **Validar** (forma + integridad + tests):
   ```
   npm run check        # = typecheck + test + validate
   npm run audit        # calidad del contenido (opcional pero recomendado)
   ```
   Cerrar los errores (y ojalá los avisos) antes de seguir.

6. **Audio** (Kokoro, local). **Un solo build a la vez**, nunca dos:
   ```
   npm run build:audio
   ```
   Es incremental por hash, poda huérfanos y hace cache-busting. Con el dev server abierto no
   pasa nada: ignora los `.mp3` (ver `vite.config.ts`).

7. **Listo.** No hace falta tocar código: `en2` **aparece solo** en el selector de nivel (que
   ya deja de auto-saltearse porque ahora hay dos cursos). El motor, las mecánicas, el
   progreso y el audio lo consumen sin cambios.

**Qué NO hay que hacer:** crear vistas/mecánicas/branches por nivel, hardcodear `en2`, ni
tocar `App.tsx`/motor. Si algo parece necesitarlo, es una señal de que hay que generalizar por
el campo `course`, no ramificar.

### Checklist rápido
- [ ] `material/` con la fuente (gitignored).
- [ ] `content/en2/unit-*.json` escritos (course en2, aspects, atoms con ids `en2.…`).
- [ ] `npm run build:ipa`
- [ ] speakers reusados (o agregado el nuevo).
- [ ] `npm run check` en verde.
- [ ] `npm run build:audio` (serial) → 0 pendientes.
- [ ] Abrir la app: aparece el selector con Inglés 1 e Inglés 2; en2 muestra solo su material.
