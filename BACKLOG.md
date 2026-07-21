# Backlog — Oda Language Hub

> Documento vivo. Lo que está hecho, lo que falta, y lo deseable. Para no perdernos.
> El diseño de cada cosa vive en `ARQUITECTURA.md`; acá está el estado y la prioridad.
>
> Convención de estado: ✅ hecho · 🔨 en curso · ⬜ pendiente · 💡 idea/deseable

Última actualización: 2026-07-18.

---

## Unidad 5 — Textos (en curso)

Tipo de unidad **nuevo**: no enseña una estructura, hace que el alumno **se apropie de un
texto** hasta poder exponerlo. Diseño en `drafts/PLAN-unidad-5.md` (aprobado). Una unidad con
los 4 textos de Inglés I adentro; cada texto es un aspecto (se agrupan por `textId`).

- ✅ **Schema**: átomo `reading` (texto con figuras), campo `textId` (4ª dimensión de selección),
  `scaffold` en production, y **respuestas con modo** (`answers: {text, mode}[]` — quote /
  paraphrase / connect / personal) en `qa`. Aditivo: no toca las U1-4. +8 tests (46 en total).
- ✅ **Reader** (`ReaderView`): el texto tal cual, con sus figuras extraídas del PDF, atribución
  al autor/fuente, y audio por párrafo. `ModedAnswers` muestra el abanico de respuestas por modo
  en Ping-Pong; el Examen Oral muestra el `scaffold` de la exposición en modo ensayo.
- ✅ **Mecánica nueva "Reconstruir el guion"** (mecánica 13): responder una secuencia de preguntas
  guía arma el script modelo pedazo a pedazo. Toggle ensayo (revelar) / examen (por voz), como el
  Examen Oral. Es el escalón entre Ping-Pong y el Examen Oral. Se modela con `steps` en `production`
  y aplica a TODAS las unidades: los 4 "My Life" + los 5 scripts descriptivos (U1-4) y las 5
  exposiciones del Texto 2 (14 scripts con pasos en total).
- ✅ **Los 4 textos de Inglés I, completos** (147 átomos en la Unidad 5, 4 aspectos):
  - Texto 1 *Why 2 Is the Best Number* (entrevista, Scientific American) — refuerza Present Simple.
  - Texto 2 *What is a square?* (geometría, plus.maths.org, con figuras) — refuerza verbo To Be.
  - Texto 3 *Do Students Need Four Years of High School Math?* (Education Week) — refuerza Can.
  - Texto 4 *Should people learn maths until age 18?* (plus.maths.org) — refuerza el presente negativo.
  - Cada uno: lectura como recurso (Texto 2 con figuras del PDF; 1/3/4 como resumen fiel y atribuido,
    porque son de periódicos comerciales y el repo es público), vocabulario, preguntas con modos y
    ángulos, cloze, y exposiciones con reconstrucción. `validate`/`audit`/`test` en verde.
- 🔨 **Audio**: 1446 pistas nuevas (los 4 textos + steps + voces alternativas) sintetizando con Kokoro.

---

## Dónde estamos (resumen)

**Inglés I está completo: las 4 unidades** (Bienvenida, Estilo de vida, Gente, Lugares), jugables
de punta a punta. ~316 átomos, **13 mecánicas** cubriendo los 5 niveles de la escalera
(percepción → producción), audio neuronal local (Kokoro, sin key) con voces alternativas e IPA,
micrófono, repetición espaciada (FSRS) con persistencia, diagnóstico de errores, y guía de
expresiones por unidad. 38 tests, `validate` y `audit` en verde.

**El diseño se probó cuatro veces:** cada unidad entró sin tocar `src/` (el schema ya preveía los
tags, y el contenido se auto-descubre). Agregar Inglés II/III/IV es el mismo pipeline.

**Multi-nivel: base lista (2026-07-21).** La app ya soporta varios niveles: `content/courses.json`
(en1–en4), **selector de nivel** que se auto-saltea con un solo curso (hoy entrás directo a
Inglés 1, sin cambio de UX), y Home / repaso global / stats **acotados por curso**. El motor,
mecánicas, progreso y audio son *course-agnostic* y se reusan tal cual. **Agregar Inglés 2 es solo
contenido** — el paso a paso está en [`MANIFIESTO-NIVELES.md`](MANIFIESTO-NIVELES.md) §7.

Lo que sigue, en una línea: **poder usarlo de verdad — el deploy (§5.1) es lo que falta para
estudiar desde el celular.**

---

## 1. Antes de la Unidad 2 (deuda a cerrar)

| | Estado | Qué | Por qué importa |
|---|---|---|---|
| 1.1 | 🔨 | **Balance de dificultad**: niveles 4-5 vs 1-2 | Mejorado con los diálogos (16→41 en niveles 3-4), pero el audit todavía lo marca. Se cierra con más producción |
| 1.2 | ✅ | **Atomizar los diálogos de la reconstrucción** (los 3: objetos de clase, equipo internacional, Kate/Robert) | Hecho. 25 frases, 3 diálogos, 3 voces nuevas (Rosa, Valentina, Robert). El perfil de Messi queda (ya cubierto por qa atoms) |
| 1.3 | ✅ | **Fusionar "Números y edad"** en "Datos personales" | Hecho |
| 1.4 | ✅ | **IPA en las frases** | Hecho: `npm run build:ipa` con el fonemizador de Kokoro (el IPA coincide con el audio). 67/67 frases. Shadowing lo muestra. **Desbloquea la pronunciación fina (§4.1)** |
| 1.5 | ✅ | **Tests del motor** (`npm test`): grading, FSRS, session, content-logic | Hecho: 33 tests con el runner de Node, sin dependencias. Cubren los bugs que encontramos usando la app |

---

## 2. La prueba de fuego: Unidad 2

| | Estado | Qué |
|---|---|---|
| 2.0 | ✅ | **Plan de implementación** en `drafts/PLAN-unidad-2.md` (verificado: el schema ya tiene los tags de la U2, no hay que tocarlo) |
| 2.1 | ✅ | **Escribir `content/en1/unit-2.json`** — 73 átomos, 9 aspectos, las 9 ejercitaciones del TP, cómic, Venus, Peter, listening, composición (Estilo de vida: simple present, rutinas, frecuencia, hora) siguiendo el pipeline de `drafts/` |
| 2.2 | ✅ | **Cómic de la cafetería** atomizado (Role-play desde ambos papeles) |
| 2.3 | ✅ | Audio, IPA, `audit`, `validate`, `test` — todo verde |

> **El test del diseño: PASÓ.** La U2 apareció sola (home, temas, guía de expresiones, mecánicas).
> La única línea de `src/` tocada fue hacer que `content.ts` auto-descubra las unidades con
> `import.meta.glob` — una mejora, no un parche: **las unidades 3-4 ahora son cero código.**

---

## 3. Mejoras pedagógicas (deseables)

| | Estado | Qué | Impacto |
|---|---|---|---|
| 3.1 | ✅ | **Diagnóstico de errores** ("tus puntos débiles" por gramática y fonema) | El de mayor impacto. Hecho |
| 3.2 | 💡 | **Drills por fonema**: una mecánica que agrupe "todas tus palabras con /θ/" | Ataca la debilidad fonética específica (clave para acento rioplatense) |
| 3.3 | 💡 | **Hilo "My Life" como artefacto acumulativo**: los 4 capítulos como *tu* monólogo de final, que crece por unidad | Da sentido de progreso hacia el examen real |
| 3.4 | 💡 | **Modo historia con Mary** (personaje recurrente en U1/U3/U4): una espina narrativa entre unidades | Engancha más que ejercicios sueltos |
| 3.5 | 💡 | **Radar de habilidades** (percepción/comprensión/recuperación/producción) | El SRS ya tiene los datos por habilidad |
| 3.6 | 💡 | **FSRS con 4 notas** (fácil/difícil), no 2 | Solo si al usar se siente que falta matiz. Hoy es a propósito 2 (acierto/fallo) |

---

## 4. Features grandes (deseables, con costo real)

### 4.1 💡 Reconocedor de pronunciación fino (sílaba por sílaba, coloreado) — **con Azure**

**Decidido: se hace con Azure Pronunciation Assessment.** Feature *separada y avanzada*: cuando
una palabra no sale en el reconocedor general (texto), se entra a una pantalla fina que puntúa
**por sílaba y por fonema** y las pinta verde/amarillo/rojo. Ver la discusión completa en el
historial; resumen técnico:

- **Por qué Azure y no local:** el reconocedor general (Web Speech) es a nivel texto, no puede
  puntuar fonemas. Azure Pronunciation Assessment devuelve puntaje 0-100 por sílaba/fonema +
  tipo de error, y el coloreo sale directo. El camino local (wav2vec2 en el navegador) es pesado
  y falla con acento marcado —justo el caso rioplatense—, así que daría rojos falsos que frustran.
- **Costo:** key de Azure + red, **solo para esta pantalla** (el resto de la app sigue sin key).
  Entra en la capa gratuita de Azure Speech (verificar límite mensual).
- **Cómo:** interfaz `PronunciationAssessor` (como `TtsProvider`), implementación Azure por
  defecto. Pantalla: palabra partida en sílabas → tocás una para oír ese pedazo → grabás →
  se colorea → repetís sonido por sonido.
- **Depende de 1.4** (IPA / silabificación del objetivo). ✅ El IPA por frase ya existe; falta la silabificación por palabra (la puede hacer Azure al alinear).
- **Estado:** pendiente deseable. No bloquea nada.

### 4.3 💡 Entonación de preguntas de sí/no (limitación de Kokoro)

**Confirmado con medición.** Kokoro no sube el tono en las preguntas de sí/no ("Are you free
now?", "Have you got…?"), donde el inglés debe subir. Las preguntas con Wh- sí bajan, y eso es
correcto. Kokoro no tiene control de prosodia (a diferencia de Azure/SSML).

- Ya tenemos la data: ~27 frases marcadas `intonation: 'rising'` en las 3 unidades.
- Medido (af_heart): "Are you free now?" termina en 195Hz contra 214Hz en el medio → baja en vez
  de subir.
- **Explorado y DESCARTADO (2026-07-19):** se probó a fondo el arreglo local sin key —
  PSOLA (Praat), vocoder WORLD con contorno modelado + alargamiento final, e **injerto de
  prosodia** (voz de Kokoro + contorno de F0 donado por Piper). También se comparó **migrar a
  Piper** (que sí sube las sí/no de fábrica). Conclusión del usuario, con A/B lado a lado:
  **Kokoro es netamente superior en naturalidad**, y *cualquier* reprocesamiento de su señal
  (WORLD/PSOLA/injerto) la degrada de forma audible. Piper solo gana en la entonación de algunas
  preguntas. → Se descartan DSP, injerto y migración.
- **También probado y DESCARTADO (2026-07-19):** las 3 soluciones de entrada de `kokoro_improve.md`
  —A (manipular fonemas + `generate_from_ids`), B (trucos de texto: coma táctica, vocal alargada,
  «?!»), C (blending de voces)— sobre 5 preguntas. **Ninguna sube la pregunta** (verificado a oído).
  Kokoro no expone control de prosodia y su vocabulario de fonemas no tiene tokens de tono: no hay
  dónde inyectar la curva. `generate_from_ids` funciona, pero el modelo no responde a marcadores de
  acento/longitud con una subida.
- **Decisión (opción 1):** dejar las preguntas sí/no **planas** (Kokoro crudo), preservando la
  calidad de voz en toda la app. La entonación no rising es una imperfección menor y no bloquea.
- **Mejora opcional futura:** **Azure solo para esas ~35 frases** — nace como pregunta, alta
  calidad, sin post-proceso. Requiere key. Es la única vía que sube la entonación sin sacrificar
  calidad. Queda como deseable, sin apuro. Nota clave: las **wh-** ya bajan bien en Kokoro; solo
  las **sí/no** necesitarían Azure.

### 4.2 💡 Escuchar la misma frase en más acentos (no nativos)

Hoy las voces alternativas son US/GB (límite de Kokoro). Acentos no nativos (Pedro portugués,
Valentina rusa) necesitarían Azure. Deseable, no urgente.

---

## 5. Infraestructura y despliegue

| | Estado | Qué |
|---|---|---|
| 5.1 | ⬜ | **Deploy** (GitHub Pages o Netlify): hoy corre solo local |
| 5.2 | ⬜ | **Hosting de los mp3**: ~15 MB. Git LFS vs generar en CI y publicar como artefacto |
| 5.3 | ⬜ | **Cargar el contenido por `fetch`** en vez de empaquetarlo en el JS: con 4 unidades el bundle crece |
| 5.4 | 💡 | **PWA instalable** + Service Worker: estudiar offline en el celular (el audio ya es local) |
| 5.5 | 💡 | **Sync multi-dispositivo** (backend): hoy el progreso vive en localStorage de un navegador |

---

## 6. Herramientas del pipeline (ya existen)

- ✅ `npm run validate` — forma (Zod) + integridad referencial
- ✅ `npm run build:ipa` — IPA de cada frase con el fonemizador de Kokoro (coincide con el audio)
- ✅ `npm run audit` — calidad del contenido (dificultad, aspectos flacos, IPA, ejercicios chicos)
- ✅ `npm run build:audio` — TTS incremental por hash (Kokoro; Azure con `--provider=azure`)
- ✅ `npm run audio:review` — página para revisar voces de a puñado
- ✅ `npm run flags` — procesa audios marcados como robóticos → plan de reemplazo

---

## Cómo usar este backlog

- Al terminar algo, marcarlo ✅ y mover la fecha de "última actualización".
- Antes de empezar una tanda, mirar §1 y §2: eso es lo que desbloquea todo lo demás.
- Las ideas 💡 no tienen orden entre sí; se eligen por ganas y contexto.
