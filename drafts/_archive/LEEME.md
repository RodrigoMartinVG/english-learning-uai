# Archivo histórico

**Nada de esta carpeta es fuente de verdad.** Se conserva por trazabilidad: documenta de dónde
vinieron las decisiones de `ARQUITECTURA.md`. No la consultes para implementar; consultá
`ARQUITECTURA.md`.

## `especificacion.txt` — el PRD original

El documento fundacional. **Superado por `ARQUITECTURA.md`**, pero varias de sus ideas
sobrevivieron y son suyas:

- La cascada de fallback de voces y el filtro de voces naturales.
- El bug de solapamiento: `speechSynthesis.cancel()` antes de cada `speak()`.
- La regex de normalización para comparar transcripción vs objetivo.
- **`SpeechRecognitionList` (grammar hints)** — la propiedad infrautilizada que mejora
  drásticamente el reconocimiento. Gran aporte.
- El timeout de silencio para no dejar el micrófono colgado.
- Sacar los datos del código a JSON externo, y la jerarquía `Nivel > Categoría > Frase`.
- A11y: `aria-label` en botones de audio/mic, touch targets de 48px.

**En qué quedó obsoleto:**

| Decía | Ahora | Por qué |
|---|---|---|
| Lit + Web Components (§6.1) | React + TypeScript | Decisión del autor; ecosistema y mantenibilidad |
| SM-2 o Leitner (§2) | FSRS | SM-2 es de 1987; FSRS modela mejor el olvido y tiene lib TS madura |
| `LanguageItem` plano con `srsData` embebido (§3.3) | Átomos tipados + tarjetas `(atomId, skill)` separadas | El progreso no vive en el contenido: reconocer y producir son memorias distintas |
| Voz al azar por botón (§4, Módulo 2) | `speaker` fijo por personaje | La variabilidad debe ser diseño, no lotería. Mary siempre suena como Mary |
| Scoring de pronunciación | Diff por palabra + grammar hints + auto-cotejo A/B | La Web Speech API no puntúa fonemas. Ver `ARQUITECTURA.md` §6.4 |

## Los prototipos HTML

Validaron 5 mecánicas y su UX. **Se conservan como referencia visual, se descartan como código.**

- `prototipo-1-osmosis-matching-shadowing.html` — el más completo. Ósmosis, Audio Matching y
  Shadowing Lab. El canvas de waveform es un acierto y sobrevive al rediseño.
- `prototipo-2-variante.html` — variante anterior del anterior. Sin `PREFERRED_NAMES`.
- `prototipo-3-pingpong-syntax.html` — Ping-Pong contrarreloj y Syntax Builder. Aporta la
  mecánica de timer.

Su `DATABASE` es el ancestro directo del modelo de átomos: ya tenía `id`, `category`, `text`,
`alternatives` y `replies`. El diseño actual lo extiende, no lo contradice.
