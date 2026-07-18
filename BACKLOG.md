# Backlog — Oda Language Hub

> Documento vivo. Lo que está hecho, lo que falta, y lo deseable. Para no perdernos.
> El diseño de cada cosa vive en `ARQUITECTURA.md`; acá está el estado y la prioridad.
>
> Convención de estado: ✅ hecho · 🔨 en curso · ⬜ pendiente · 💡 idea/deseable

Última actualización: 2026-07-17.

---

## Dónde estamos (resumen)

**Inglés I está completo: las 4 unidades** (Bienvenida, Estilo de vida, Gente, Lugares), jugables de punta a punta. La Unidad 1: 91 átomos, 13 aspectos, **12 mecánicas**
cubriendo los 5 niveles de la escalera (percepción → producción), audio neuronal local (Kokoro,
sin key), micrófono, repetición espaciada (FSRS) con persistencia, y diagnóstico de errores.

Lo que sigue, en una línea: **cerrar la deuda de la Unidad 1 y probar el diseño con la Unidad 2.**

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
- **Dos arreglos posibles:** (a) DSP local — subir el tono de la última parte de las frases
  `rising` (sin key, pero riesgo de sonar artificial; hay que escucharlo antes de aplicarlo);
  (b) Azure — regenerar solo esas ~27 frases con Azure, que hace bien la entonación (necesita key).
- **Estado:** anotado, no bloquea. Decidir DSP vs Azure más adelante.

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
