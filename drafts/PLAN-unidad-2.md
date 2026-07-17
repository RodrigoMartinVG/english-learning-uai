# Plan de implementación — Unidad 2 "Estilo de vida"

> Objetivo: que la Unidad 2 quede tan exhaustiva como la 1, siguiendo el mismo
> pipeline. Y usarla como **prueba de fuego del diseño**: si entra sin tocar
> `src/`, la arquitectura está probada. Ver `BACKLOG.md` §2.

## 0. La prueba del diseño (leer primero)

Ya verificado: **el schema no necesita cambios.** Los tags de gramática, función y
tema de la Unidad 2 (`present-simple.*`, `have-has`, `frequency-adverbs`,
`time.at`, `time.telling`, `ask.routine`, `describe.routine`, `routine`, `time`,
`leisure`) ya existen en `content/schema.ts` — se dejaron previstos al diseñar.

Los speakers del cómic de la U2 también existen: `cafe-woman`, `cafe-man`.

**Predicción:** la Unidad 2 se hace escribiendo `content/en1/unit-2.json` y corriendo
el pipeline, sin tocar `src/`. Si aparece la necesidad de tocar código, ESO es el
hallazgo valioso — hay que anotarlo y entender por qué el diseño no lo previó.

## 1. Contenido de la Unidad 2 (mapa del material)

| Sección del PDF | Qué es | Tipo de átomo |
|---|---|---|
| Pág. 5 — Situación comunicacional | Cómic de la cafetería (Do you work here? / rutinas) | `dialogue` + `phrase` |
| Pág. 6-8 — Grammar Tips | Simple present, have/has, adverbios de frecuencia, hora | (define los `aspect`) |
| Pág. 8 — Ejemplo significativo | Rutina de Venus Williams (texto descriptivo largo) | `phrase`(s) o `production` modelo |
| Pág. 9 — Words and phrases | What time does it start?, Have breakfast, Go running… | `phrase` / `lexeme` |
| Pág. 10-12 — Ejercitación (9 consignas) | Ver desglose abajo | `exercise` |
| Pág. 13 — Listening Comprehension 2 | get up 7 / watch TV 4 / go to bed 9 | `listening` |
| Pág. 13 — Composition: My Life Ch. 2 | Escribir tu rutina diaria | `production` (chapter 2) |
| Pág. 14 — Grilla de corrección | Claves oficiales | (alimenta `accept`/`officialKey`) |

### Desglose de la Ejercitación (Trabajo Práctico)

| # | Consigna | format | Mecánica que lo consume |
|---|---|---|---|
| 1 | Complete con la forma correcta del verbo (smoke/meet/close/teach/go/like) | `cloze` | Completar (Cloze auditivo) |
| 2 | Complete con have / has | `cloze` | Completar |
| 3 | Write sentences (3ª persona: he reads, she lives…) | `transform` | Formular la pregunta / transformar |
| 4 | Match questions and answers | `match` | *(sin mecánica de match aún — ver §5)* |
| 5 | Rewrite con adverbio de frecuencia (posición) | `transform` | Formular / transformar |
| 6 | Rewrite usando el adverbio dado | `transform` | idem |
| 7 | Talk about Peter's routine (párrafo con el cuadro) | `production` | Examen oral / Shadowing |
| 8 | Find the mistakes and correct them | `error-hunt` | *(sin mecánica de error-hunt aún — ver §5)* |
| 9 | Put into the negative | `cloze`/`transform` | Completar |

## 2. Aspectos a curar (siguiendo los Grammar Tips)

Orden según el material introduce los temas:

1. **La cafetería** (situación comunicacional) — greet, ask.routine, ask.time
2. **Simple present: afirmativo** — la forma base, tercera persona con -s/-es
3. **Simple present: negativo** — don't / doesn't
4. **Simple present: interrogativo** — do / does + respuestas cortas
5. **Have / has** — posesión
6. **Adverbios de frecuencia** — always…never, y su POSICIÓN (antes del verbo, después de be)
7. **La hora y el tiempo** — at + hora, telling the time
8. **Rutinas diarias** — get up, have breakfast, leave home, go to work… (vocabulario)
9. **Trabajos** — jobs (si el material los trata como vocabulario)

> Regla de §14.2: todo átomo debe caer en al menos un aspecto (el validador lo exige).

## 3. Speakers

- Cómic cafetería: `cafe-woman`, `cafe-man` (ya existen, ya tienen voz Kokoro).
- Venus (ejemplo significativo): agregar speaker `venus` (o usar `narrator`).
- Peter (Ejercitación 7): puede ser `narrator` o un speaker propio.
- Si un ejercicio es diálogo entre dos, reutilizar voces existentes o agregar.

## 4. Pipeline (los pasos, en orden)

1. **Transcribir el cómic** de la pág. 5 → ya está en `drafts/situaciones-comunicacionales.md` (verificar contra el PDF).
2. **Escribir `content/en1/unit-2.json`**: aspectos + átomos, siguiendo el molde de `unit-1.json`.
   - Ids: `en1.u2.p.001…`, `en1.u2.d.001…`, etc.
   - Marcar `origin`: `extracted` (del material) / `synthetic` (diálogos, narrativas de listening) / `corrected` (erratas).
   - Las narrativas de listening son SIEMPRE `synthetic` (el link del audio no está — §5.6).
3. `npm run validate` → forma + integridad (aspectos, referencias, ids).
4. `npm run build:ipa` → IPA de las frases nuevas.
5. `npm run build:audio` → audio + voces alternativas (incremental, solo lo nuevo).
6. `npm run audit` → balance de dificultad, aspectos flacos.
7. `npm test` → que nada del motor se rompió.
8. Levantar la app: la Unidad 2 debería aparecer sola en la home (el código itera `units`).

## 5. Lo que PODRÍA requerir código (y por qué)

Dos formatos de ejercicio de la U2 no tienen mecánica todavía:

- **`match`** (Ejercitación 4: emparejar preguntas y respuestas). Hoy no hay una
  mecánica de emparejamiento. Opciones: (a) crear la mecánica "Audio Matching"
  (estaba en el diseño §6.2 como mecánica 4, nunca se construyó), o (b) modelar
  esos pares como `qa` atoms (que Ping-Pong y Ósmosis ya consumen) en vez de
  `exercise` format match.
- **`error-hunt`** (Ejercitación 8: encontrar y corregir el error). El formato
  existe en el schema pero ninguna mecánica lo consume. Crear "Error Hunt"
  (diseño §6.2, mecánica 8).

**Decisión pendiente:** si preferimos que la U2 NO toque `src/`, modelamos la
Ejercitación 4 como `qa` (opción b) y dejamos la 8 para una tanda de mecánicas.
Si queremos cobertura total del TP, construimos Audio Matching y Error Hunt —
pero eso es trabajo de mecánica, no de unidad, y se puede hacer después.

> Esto NO invalida el diseño: son mecánicas faltantes del catálogo (§6.2), no
> cambios al modelo. El modelo aguanta; el catálogo todavía no está completo.

## 6. Definición de "terminado" (paridad con la Unidad 1)

- [ ] Cómic transcrito y atomizado (dialogue + phrases).
- [ ] Las 9 consignas del TP modeladas (como exercise, qa o production según corresponda).
- [ ] Ejemplo significativo (Venus) y Composition Ch. 2 como `production`.
- [ ] Listening Comprehension 2 con narrativa sintética consistente con la grilla.
- [ ] Vocabulario de rutinas como `lexeme` con oración de ejemplo.
- [ ] ~8-12 aspectos curados; ningún átomo huérfano.
- [ ] `validate`, `audit`, `test` en verde; audio + IPA generados.
- [ ] Balance de dificultad razonable (producción de nivel 4-5 presente).
- [ ] La app la muestra y es jugable de punta a punta sin tocar `src/`.

## 7. Estimación

El grueso es curación de contenido (como la U1): ~1 sesión de trabajo para el
JSON, + generación de audio (~30-40 min de máquina, desatendida). Las dos
mecánicas faltantes (match, error-hunt), si se deciden hacer, son otra tanda
aparte y benefician también a las unidades 3 y 4.
