# Backlog — Oda Language Hub

> Documento vivo. Lo que está hecho, lo que falta, y lo deseable. Para no perdernos.
> El diseño de cada cosa vive en `ARQUITECTURA.md`; acá está el estado y la prioridad.
>
> Convención de estado: ✅ hecho · 🔨 en curso · ⬜ pendiente · 💡 idea/deseable

Última actualización: 2026-08-03.

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

**Inglés I está completo: las 6 unidades** (Bienvenida, Estilo de vida, Gente, Lugares, Textos de
matemática, y Examen oral), jugables de punta a punta. ~585 átomos, **15 mecánicas** cubriendo los
5 niveles de la escalera (percepción → producción), audio neuronal local (Kokoro, sin key) con
voces alternativas e IPA, micrófono, repetición espaciada (FSRS) con persistencia, y guía de
expresiones por unidad. **50 tests**, `validate` y `audit` en verde. **El audio pregenerado
(~206 MB) se versiona en git** para que el deploy sea un checkout (ver §5.2).

**El diseño se probó seis veces:** cada unidad entró sin tocar `src/` (el schema ya preveía los
tags, y el contenido se auto-descubre). Agregar Inglés II/III/IV es el mismo pipeline.

**Multi-materia: landing lista (2026-08).** La entrada es una **landing de cursos** (cards con
progreso + badge "por repasar"; los cursos sin contenido salen "Próximamente"). Registrados:
`en1` (completo), `en2-en4`/`gram1`/`pron1` (scaffold), y **`voc1` (Vocabulario, en construcción)**.
El motor/mecánicas/progreso/audio son *course-agnostic* y **aislados por curso** (sesiones, repaso,
stats y el pool de distractores se acotan al curso activo). Agregar un curso es **solo contenido** —
runbook en [`MANIFIESTO-NIVELES.md`](MANIFIESTO-NIVELES.md) §8.

**Curso de Vocabulario (voc1): fundación completa.** Fuentes reales (NGSL/NAWL/Oxford 5000/PHaVE/
CEFR-J ≈ 5.602 ítems), rastreador de cobertura (`npm run coverage`), schema extendido (ficha Rica +
`cefr`), y **plan por tramos de frecuencia/utilidad**. Dos unidades vivas (La familia, Verbos
esenciales I). Todo el diseño está en [`content/voc1/spec/`](content/voc1/spec/).

Lo que sigue, en una línea: **poder usarlo de verdad — el deploy (§5.1) es lo que falta para
estudiar desde el celular.**

---

## 0. Hecho recientemente (2026-08) — tanda grande de uso real

Todo salió de usar la app en serio. Ya está en `main`, con tests y `validate` en verde.

**UX de ejercicios**
- ✅ **Layout dos-paneles** en todas las mecánicas (estímulo a la izquierda, interacción a la
  derecha, sin scroll) vía clase opt-in `.exlr`. Las "otras voces" quedaron dentro del layout.
- ✅ **Enter comprueba** en los modos de escribir; **↻ Reintentar** en completar/dictado/escribir/armar.
- ✅ **Armá el guion** reescrito: versiones A/B/C, sombra frase por frase, "escucharte" reproduce
  TU grabación (no el modelo), y **cada versión es un ejercicio distinto** (variant, no selector interno).
- ✅ **Role-play**: el log ya no roba el scroll; el micrófono no queda cortado.

**Módulo nuevo**
- ✅ **"Al inglés" (español→inglés)** en dos mecánicas (escribir / decir), sobre el `gloss` de frases
  y palabras. Acepta variantes; sin audio antes de responder.

**Audio / reproductor**
- ✅ **Mini-reproductor en el header**: pausa/continuar, barra de seek, tiempo, replay, stop; sobre el
  último audio, se va al navegar.
- ✅ **Grabar rápido** (🎙 toolbar, transcripción inline) y **Banco de práctica** (🎯 popup: objetivo
  fijo + oírlo + varios intentos con diff y %). Un solo click, auto-corte, botón en rojo.
- ✅ **Aviso de audio degradado** (🔉 + tooltip) cuando se usa la voz del navegador por no poder cargar
  el mp3. **Gotcha de dev**: Vite no sirve mp3 nuevos hasta reiniciar tras `build:audio` (ver [[dev-audio-restart]]).

**Reconocimiento / micrófono**
- ✅ **Tiempo de auto-corte configurable** (rápido/normal/paciente), compartido en toda la app.
- ✅ **Terminar / Cancelar** la grabación a mano (antes no se podía frenar).
- ✅ **Elegir la mejor hipótesis** (`maxAlternatives`) + feedback del ranking ("tu forma quedó 2ª,
  afiná para que suba"). Limitación honesta: Chrome/Edge a veces devuelven una sola.
- ✅ **Error de reconocimiento visible** (antes cancelaba en silencio → parecía "no grabó").
- ✅ **Grafía UK/US** (centre/center, colour/color, realise/realize…) aceptada en el corrector.

**Motor / repaso**
- ✅ **"Estudiar" no se cuelga** cerca del final: el cupo de nuevas estrena ÁTOMOS sin empezar.
- ✅ **"★ Estudiar toda la unidad"**: sesión SRS sobre todos los temas juntos.
- ✅ **Repaso global**: el conteo respeta el filtro de unidades; el filtro no desaparece al desmarcar
  todo; una tanda cubre tarjetas distintas (dedupe por tarjeta).
- ✅ **ASR**: alias o'clock / street / avenue.

**Contenido (relevamiento unidad por unidad vs. el material)**
- ✅ **Caso posesivo 's** (U1, lo pedía el temario) + **reorder** de U3/U4 (los "Put in order" del TP)
  + **vocab de familia** (aunt/uncle/grandfather/grandparents) + **nivelación de los textos 1/3/4 de U5**.
  Números y "lugares turísticos" de U1 **no** se agregaron: el PDF no los trae (no fabricar más allá del material).

**Retirado**
- ❌ **"Tus puntos débiles"** (diagnóstico): señal floja/engañosa. Ver §3.1.

### Segunda tanda (2026-08) — landing, SRS, aislamiento y curso de Vocabulario

**Audio / práctica**
- ✅ **Audio continuo** (nueva mecánica en la vista de modelos): reproduce el texto frase por
  frase, cada una N veces (configurable) antes de seguir; pausa/detener, selector de voz,
  "repetir todo". Para asimilar por escucha.
- ✅ **Versión D** de "What is a square": texto nuevo + audio en 3 voces (Jessica/Michael/Nicole).

**Landing multi-materia**
- ✅ **Vista de inicio = landing de cursos**: card por curso con progreso y badge **"por repasar"**;
  los cursos sin contenido salen **"Próximamente"** (deshabilitados). Cursos nuevos registrados:
  gram1, pron1, voc1.
- ✅ Fix **`ATOM_ID_RE`**: hardcodeaba `en[1-4]` → ahora deriva de `COURSES` (acepta ids de
  cualquier curso nuevo).

**SRS (calidad de aprendizaje)**
- ✅ **Falsos positivos**: si corregís tras fallar (viendo la respuesta), cuenta como repaso, no
  como acierto (Completar/Al oído/echo-type/Al inglés/Armar la frase).
- ✅ **Reaprendizaje en sesión**: lo que fallás vuelve al final de la misma sesión (ronda nueva),
  una vez; el resumen cuenta por ítem (resultado final).

**Aislamiento entre cursos**
- ✅ El pool de las mecánicas (distractores/vecinos) se limita al **curso activo** (antes un
  ejercicio de Vocabulario traía distractores de Inglés). Ver [[aislamiento-cursos]].

**Curso de Vocabulario (voc1)** — ver [`content/voc1/spec/`](content/voc1/spec/)
- ✅ **Fundación**: índice v2 (5 dimensiones + espiral), investigación de cantidades (con fuentes),
  marco de tipos de unidad, plantilla de ficha Rica.
- ✅ **Fuentes reales + rastreador**: NGSL (por frecuencia), NAWL, Oxford 5000 (con CEFR), PHaVE,
  CEFR-J; `scripts/build-coverage.ts` (`npm run coverage`) mide cobertura por lista y por tramo.
- ✅ **Schema extendido** (retrocompatible): `cefr` en atomBase; `register/collocations/family/
  nuance` en lexema. `WordFocusView` muestra la ficha rica.
- ✅ **Plan por tramos de frecuencia/utilidad** (no niveles CEFR: el CEFR es referencia).
- ✅ **Unidades vivas**: La familia (14), Verbos esenciales I (24).

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
| 3.1 | ❌ | ~~**Diagnóstico de errores** ("tus puntos débiles")~~ **RETIRADO (2026-08)** | La señal era floja/engañosa: la gramática repartía la culpa entre todos los tags del átomo y mezclaba ruido del ASR; los fonemas casi no tenían datos (11/274 frases) y se apoyaban en el match del ASR, que no juzga pronunciación. Se quitó (UI + recolección de errors/tags). El SRS ya prioriza lo que estás por olvidar. Un diagnóstico honesto se construiría sobre lapses/estabilidad del SRS, no sobre tags |
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

### 4.4 💡 Reconocimiento con Whisper en el navegador (offline, sin key)

**Motor alternativo de reconocimiento de voz, opt-in.** Hoy usamos la Web Speech API del
navegador (Chrome→Google, Edge→Azure): sin key, buena, pero en la nube, dependiente del
navegador y no offline. Whisper corriendo local en el navegador (WASM/WebGPU, vía
`transformers.js` — p. ej. `Xenova/whisper-tiny.en` o `whisper-base`) daría reconocimiento
**más consistente entre navegadores, offline y sin key**.

- **Costo:** descarga del modelo una vez (~40–200 MB según tamaño) + más cómputo (ideal con
  WebGPU; sin él es más lento). Por eso sería un **"modo alta precisión" opt-in**, no el default.
- **Cómo:** `createRecognizer()` ya está detrás de una interfaz (`Recognizer`), así que se puede
  agregar una implementación Whisper sin tocar los ejercicios. Ojo: Whisper transcribe sobre un
  audio grabado (no streaming en vivo como Web Speech), así que el flujo cambia a grabar→transcribir;
  ya tenemos el `Recorder`, encaja.
- **Sigue sin puntuar pronunciación** (eso es 4.1, Azure). Whisper mejora la transcripción, no evalúa fonemas.
- **Estado:** deseable, sin apuro. Web Speech sigue siendo el default pragmático (cero footprint).
- **Mejora barata previa (sin migrar):** subir `maxAlternatives` en Web Speech y elegir, entre las
  N hipótesis, la que mejor matchea el objetivo → reduce falsos negativos, sin descargas ni key.
  Invisible para el usuario. Candidata a hacerse primero.

---

## 5. Infraestructura y despliegue

| | Estado | Qué |
|---|---|---|
| 5.1 | ⬜ | **Deploy** (GitHub Pages o Netlify): hoy corre solo local. **El audio ya está listo (5.2)**, así que el deploy es un build + publish |
| 5.2 | ✅ | **Hosting de los mp3 — DECIDIDO (2026-08)**: se **versionan en git** (~206 MB, 7061 clips; `public/audio/*` dejó de estar gitignoreado, solo el manifest se versionaba antes). Deploy = checkout, sin Kokoro. Nota: **el 70% del peso son las voces alternativas** — recortarlas baja a ~62 MB si algún día molesta. Plan B si crece: Git LFS. Ver decisión en memoria [[audio-en-git]] |
| 5.3 | ⬜ | **Cargar el contenido por `fetch`** en vez de empaquetarlo en el JS: con 6 unidades el bundle crece |
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
