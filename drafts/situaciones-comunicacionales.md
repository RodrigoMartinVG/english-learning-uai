# Situaciones comunicacionales — transcripción de los cómics (pág. 5 de cada unidad)

> **Por qué existe este archivo.** El diálogo ancla de cada unidad está dibujado como cómic y
> **no existe en la capa de texto del PDF**. Ninguna extracción automática lo recupera. Esta es
> la transcripción manual, hecha renderizando la página a 130 dpi y leyéndola visualmente.
> Es contenido oficial extraído, no sintético.
>
> **Estado:** los textos de los globos son literales y confiables. El **orden de los turnos** y la
> **atribución de hablante** son una reconstrucción a partir de la disposición de los globos, y
> están marcados donde hay ambigüedad. Verificar contra el PDF antes de congelar en `content/`.

## Hallazgo transversal: Mary es un personaje recurrente

**Mary aparece en las unidades 1, 3 y 4** (en la U4 la nombran explícitamente: *"You have got a
beautiful office Mary"*). El material tiene un hilo narrativo que ninguna sección documenta.
En U1 es systems manager y recién conoce a Eric; en U3 y U4 ya tiene oficina propia y un colega
sénior. Ver §2.5 y §13.3 de `ARQUITECTURA.md`.

---

## Unidad 1 — "Bienvenida": primer encuentro en el pasillo

- **Hablantes**: Mary (systems manager), Eric (developer)
- **Función**: saludar, presentarse, preguntar ocupación, preguntar por existencia de un lugar
- **Gramática**: `be` (afirmativo/interrogativo), `there is`, artículo `a`

| # | Hablante | Línea |
|---|---|---|
| 1 | Mary | Hi! |
| 2 | Mary | How are you? |
| 3 | Eric | Hi. |
| 4 | Eric | Ok. And you? |
| 5 | Mary | Fine. |
| 6 | Eric | What´s your name? |
| 7 | Mary | My name is Mary. And yours? |
| 8 | Eric | Eric. What´s your occupation? |
| 9 | Mary | I´m a systems manager |
| 10 | Eric | Oh, I'm a developer. |
| 11 | Mary | Is there a cafeteria inside the enterprise? |
| 12 | Eric | Yes, there is a cafeteria on the 10th floor. |
| 13 | Mary | Fantastic, Thank you. |
| 14 | Eric | You `re welcome. |

**Correcciones confirmadas.** El cómic dice **"Ok. And you?"** — la reconstrucción de U1 acertó
al corregir el `"Ok find you?"` que aparecía por OCR. Ídem `"I´m a systems manager"` (el
`"Ima systems manager"` era ruido de extracción). El original usa acento agudo (´) en lugar de
apóstrofe (') de forma inconsistente, y escribe `You \`re welcome` con backtick: **normalizar a
apóstrofe recto en `content/`**.

Nota: el original escribe `10th floor` en cifras; la reconstrucción lo expandió a *"tenth floor"*.
Para TTS conviene `tenth` — dejar `text: "...on the tenth floor."` con `sourceNote`.

---

## Unidad 2 — "Estilo de vida": la cafetería

- **Hablantes**: A (mujer, sentada), B (hombre, se acerca) — el material no los nombra
- **Función**: pedir permiso, preguntar por trabajo y rutina, hablar de horarios
- **Gramática**: simple present (afirmativo, negativo, interrogativo con `do`/`does`), `at` + hora

| # | Hablante | Línea |
|---|---|---|
| 1 | B | Can I sit here? |
| 2 | A | Yes, please. |
| 3 | B | Do you work here? |
| 4 | A | Yes, I do. What about you? |
| 5 | B | I work here too |
| 6 | A | What do you do? |
| 7 | B | I design programs |
| 8 | A | What time do you start working ? |
| 9 | B | At 8 o'clock |
| 10 | A | Do you always start at 8 o'clock? |
| 11 | B | No. I sometimes start at 7 o'clock? |
| 12 | A | And does the cafeteria open at 7 o'clock? |
| 13 | B | No, it doesn't. It opens at 8 o'clock |
| 14 | B | I usually wait one hour to have my coffee |

**⚠ Verificar:** la atribución A/B en los turnos 3–7 y el reparto de los globos del panel 4
(turnos 12–14) son inferencia por disposición espacial. Los textos son literales.

**Erratas del original:** turno 11 termina en `?` siendo una afirmación → corregir a punto.
Turno 8 tiene espacio antes del `?`.

**Valor pedagógico:** este cómic es la fuente natural de `Do you...? / Yes, I do`,
`What do you do?`, `does` en tercera persona y adverbios de frecuencia (`always`, `sometimes`,
`usually`) — es decir, **toda la Unidad 2 en un solo diálogo**.

---

## Unidad 3 — "Gente": la oficina propia

- **Hablantes**: Mary y un colega sénior (hombre, no nombrado)
- **Función**: mostrar un espacio, hablar de posesión, preguntar frecuencia, coordinar un plan
- **Gramática**: `have got`, `how often`, `there is`, arrangements (`How about + -ing`)

| # | Hablante | Línea |
|---|---|---|
| 1 | Colega | Ok. Here we are. This is my office. There is a PC, a desk and a comfortable chair. |
| 2 | Mary | Oh. It's nice. |
| 3 | Mary | Have got your own office? |
| 4 | Colega | Yes, I have. |
| 5 | Mary | How often do you work there? Great |
| 6 | Colega | I usually work there. But I work at home once a week. |
| 7 | Mary | Are you free now? |
| 8 | Colega | Yes! |
| 9 | Mary | How about going to my office? |
| 10 | Colega | Great! |

**⚠ Errata importante del original:** el turno 3 dice literalmente **"Have got your own office?"**,
omitiendo el sujeto. La forma correcta —y la que enseña la propia unidad— es
**"Have you got your own office?"**. Corregir en `content/` con `origin: 'corrected'` + `sourceNote`.

**⚠ Verificar:** el `Great` del turno 5 parece pertenecer a otro globo; la disposición sugiere
que cierra el turno anterior. Los turnos 7–9 son un intercambio corto de atribución incierta.

---

## Unidad 4 — "Lugares": la oficina de Mary y el museo

- **Hablantes**: Mary y el mismo colega sénior de la U3
- **Función**: describir un espacio, proponer una salida, preguntar horarios y transporte
- **Gramática**: `there is/are`, preposiciones de lugar, `can`, `would you like to`, `what time`

| # | Hablante | Línea |
|---|---|---|
| 1 | Colega | Wow. You have got a beautiful office Mary. There's a coffee machine on that table, a plant next to the window, and a very nice lamp behind the armchair. I love it. |
| 2 | Mary | Thank you! I love it too. And we can see the Museum opposite our building. Look! |
| 3 | Colega | Would you like to go to the Museum? |
| 4 | Mary | Yes. What time does it open? |
| 5 | Colega | It opens at 11 and closes at 10. |
| 6 | Mary | Great then. We can go there after work. |
| 7 | Mary | Yes. There's a cafeteria next to the Museum. It's nice. |
| 8 | Colega | Perfect. Are there buses late at night? |
| 9 | Mary | Yes. |
| 10 | Colega | Great then. |

**⚠ Verificar:** los turnos 7–10 (paneles 4 y 5). El turno 7 empieza con *"Yes."* respondiendo a
algo que no está en un globo visible — puede haber un globo cortado en el render. Revisar el PDF.

**Valor pedagógico:** el turno 1 es un **modelo perfecto de la consigna de producción de la
unidad** ("Describe the place where you live"): encadena `there's` + 3 preposiciones distintas
(`on`, `next to`, `behind`) en una sola oración natural. Candidato directo a `production.modelAnswer`
y a shadowing de nivel 5.

---

## Qué hacer con esto

1. **Verificar** los puntos marcados ⚠ contra los PDFs (`material/N1_Unidad_*.pdf`, pág. 5).
2. Convertir cada línea en un `PhraseAtom` con `speaker`, `grammar`, `fn`, `difficulty`.
3. Agrupar los turnos en un `DialogueAtom` por unidad (`turns: [{speaker, phraseId}]`).
4. Recortar los 4 cómics a PNG → `public/img/` como `ImageRef` con `role: 'source-comic'`,
   `alt` descriptivo y `transcribed` con el diálogo.
5. Los 4 diálogos alimentan directamente la mecánica **Role-play** (nivel 5) y son la mejor
   fuente de `qa` atoms del curso: son preguntas reales en contexto real.
