# Mapa de unidades — Vocabulario (plan de largo plazo, vivo)

Convierte el [índice](./indice.md) (dimensiones) + la cobertura ([sources](./sources/),
**6 capas**, ~8.150 ítems objetivo) en **temas concretos y ordenados**, agrupados en
unidades por tramo. Es el **plan autoritativo de secuencia**: qué se construye y en qué orden.

**El eje es la FRECUENCIA / UTILIDAD, no el CEFR.** El CEFR mide competencia comunicativa
de una persona, no vocabulario; usarlo como estructura fuerza un marco que no es. Acá el
esqueleto son **tramos de frecuencia/utilidad** (lo más útil primero); el CEFR queda como
**etiqueta de referencia aproximada** por palabra (para orientarse y cruzar con Oxford).

## Las 6 capas de contenido (denominadores del rastreador)

Cada capa tiene su lista fuente y su denominador propio en `npm run coverage`:

| Capa | Qué cubre | Fuente | Objetivo |
|---|---|---|---|
| **Palabra suelta — general** | el léxico general | NGSL | 2.809 |
| **Palabra suelta — académica** | leer papers | NAWL | 960 |
| **Palabra suelta — escala + banda** | escala a ~5.000 + banda CEFR | Oxford 5000 | 4.953 |
| **Phrasal verbs** | multipalabra opaca (get up) | PHaVE | 150 |
| **Expresiones formulaicas / chunks** | idioms y frames (of course, such as) | PHRASE | 500 |
| **Colocaciones académicas** | emparejamientos (make a decision) | ACL | 2.112 |

Los verbos irregulares NO son capa aparte (son palabras NGSL con etiqueta). La **gramática
en modo vocabulario** (Dim 6) tampoco tiene lista propia: se mide dentro de las capas de
palabra/chunk (sus exponentes) — ver la matriz de gramática abajo.

## Principios

- **Granularidad justa:** el mapa fija los *temas* y su orden; qué palabra va en cuál lo
  asigna el rastreador. No pre-asignamos las miles a mano.
- **Estructura: unidad = TRAMO, temas (aspects) = campos/estructuras.** Cada tramo es **UN**
  `unit-N.json` con varios *aspects*. Agregar un tema = sumar un **aspecto + sus átomos** a
  ese archivo, **no** una unidad nueva. Así el curso tiene **5 unidades** (tramos), no cientos.
- **Espiral por tramo:** se construye un tramo completo (todas las dimensiones, incluida la
  gramática), luego el siguiente. Tramo 1-2 van **finos** acá; 3-5, **gruesos** (se refinan al llegar).
- **Utilidad al frente:** dentro de cada tramo, el núcleo de mayor frecuencia va **primero**;
  la gramática esencial (marcadores de tiempo, cuantificadores, preguntas) entra **temprano**
  porque es de altísima frecuencia. Nada esencial se difiere.
- **La frecuencia filtra el contenido:** solo entran palabras/chunks de las listas fuente.
- **Sin silos aburridos:** un tema es unidad solo si tiene miembros frecuentes y útiles; los
  flojos (animales, colores, clima) se **pliegan** en temas mayores. La ficha rica evita el
  "dog = perro" pelado.
- **Deducir > memorizar:** las herramientas de deducción (afijos → raíces) entran apenas hay
  base (Tramo 2) y temprano dentro del tramo — desbloquean miles de palabras.
- **Gramática en modo vocabulario:** las estructuras (tiempos, condicionales, subordinadas,
  irregulares de sust/adj/adv) se enseñan por sus **exponentes léxicos** (palabras señal,
  frames fijos, formas irregulares) como fichas de repaso — no como tablas de paradigmas.
  Ver [tipos-de-unidad](./tipos-de-unidad.md) e [índice §Dim 6](./indice.md).
- **Receptivo ↑ en tramos altos:** Tramos 1-3 receptivo + productivo; Tramo 4-5 (académico/
  especializado) sobre todo **receptivo**; la producción se concentra en el núcleo.
- **Tamaño:** ~25-40 ítems por **tema**; ~14-18 temas por tramo → **~70-85 temas** en total.

Estado: `✅ hecha` · `▶ próxima` · `· planificada`

## Plantilla por tramo (misma para todos)

Orden de utilidad, no por dimensión. Cada tramo teje **seis bandas**:
1. **Núcleo del tramo** — verbos/adjetivos/adverbios de su banda de frecuencia. Al frente.
2. **Deducción** — afijos → raíces → compuestos (arranca en Tramo 2).
3. **Campos de alto valor** — gated por frecuencia, sin silos, ficha rica.
4. **Combinar** — colocaciones (ACL) y phrasal verbs (PHaVE) del tramo.
5. **Precisión** — confusables → polisemia → matices.
6. **Uso + estructura** — registro/conectores/idioms **y la gramática en modo vocabulario**
   (Dim 6) que corresponde a ese tramo.

---

## Tramo 1 · Núcleo esencial — vida cotidiana (`unit-1.json`)

Lo más frecuente y básico (NGSL top ~800 + campos cotidianos + la gramática de altísima
frecuencia). Cada fila es un **tema (aspect)**. *(CEFR ref: ~A1-A2.)*

| # | Tema | topic | capa | ~ítems | Estado |
|---|---|---|---|---|---|
| 1 | Verbos esenciales (be, have, go, get, make, say, know…) | `essentials` | NGSL | 50 | ✅ |
| 2 | Verbos irregulares (por patrón) — pasado y participio | `verb.irregular` | NGSL+morfología | 31 | ✅ |
| 3 | Adjetivos y adverbios esenciales (good, big, new, very, now…) | `adjectives` | NGSL | 35 | ✅ |
| 4 | Phrasal verbs de alta frecuencia (get up, sit down…) | `phrasal` | PHaVE | 24 | ✅ |
| 5 | La familia | `family` | NGSL | 26 | ✅ |
| 6 | La casa y la vida diaria (muebles, ropa, objetos) | `home` | NGSL | ~35 | ▶ **próxima** |
| 7 | Comida y bebida | `food`* | NGSL | ~35 | · |
| 8 | El cuerpo y la salud | `body`* | NGSL | ~30 | · |
| 9 | Gente, trabajo y estudio | `workplace`/`campus` | NGSL | ~30 | · |
| 10 | Tiempo, números y dinero | `time`/`numbers`* | NGSL | ~30 | · |
| 11 | Lugares, ciudad y transporte (+ clima, entorno, animales frecuentes) | `city`/`transport`* | NGSL | ~35 | · |
| 12 | Descripción y sentimientos (personalidad, colores, tamaños) | `describe`*/`feelings`* | NGSL | ~35 | · |
| **13** | **Marcadores de tiempo y frecuencia esenciales** (now, today, tomorrow, always, usually, often, sometimes, never, every day) — *la gramática de los tiempos, en modo vocab* | `time-markers`* | Dim 6.3 | ~25 | · |
| **14** | **Palabras señal: cuantificadores y determinantes básicos** (some, any, no, all, a lot of, much, many, this/that, more) | `quantifiers`* | Dim 6.6 / U0.4 | ~25 | · |
| **15** | **Preguntas esenciales** (what, where, when, who, why, how, how much/many/old/long) + frames | `questions`* | Dim 6.7 | ~20 | · |
| **16** | **Comparación básica + irregulares** (better/best, worse/worst, bigger, more/most, as…as, than) | `comparison`* | Dim 6.2 | ~25 | · |
| **17** | **Chunks funcionales básicos** (have to, be going to, be able to, would like, there is/are, of course, a lot of) | `chunks`* | Dim 6 + PHRASE + Dim 5.7 | ~25 | · |

*`*` = topic a agregar a `TOPIC_TAGS` al crear el tema. **Negrita** = tema de gramática-en-modo-vocabulario.*

## Tramo 2 · Núcleo general (`unit-2.json`) — *CEFR ref: ~A2-B1*

Completa la alta frecuencia general (resto del NGSL, ~801-2809) y suma el **kit de deducción**
y la **gramática de nivel medio** (perfect/pasado por sus marcadores, condicionales básicos,
relativos). *(Finos; se detallan al llegar, pero los temas ya están fijados.)*

| # | Tema | topic / dim | capa |
|---|---|---|---|
| 1-3 | **Núcleo general** — más verbos/adjetivos/adverbios frecuentes (3 temas) | `general` | NGSL |
| 4 | **Deducción I — prefijos** (un-, in-, dis-, re-, over-, under-, pre-) | Dim 1.2 | NGSL |
| 5 | **Deducción II — sufijos** (-er, -tion, -ful, -less, -ly, -ness) + familias de palabras | Dim 1.3/1.4 | NGSL |
| 6 | Sociedad y vida pública · comunicación · medios | `society`* | NGSL |
| 7 | Naturaleza, entorno y clima (ampliado) | `nature`* | NGSL |
| 8 | Educación, tiempo libre y hábitos | `leisure`* | NGSL |
| 9 | **Colocaciones básicas** (make/do, heavy rain, strong coffee) + más phrasal verbs | Dim 1.5 / 5.3 | ACL / PHaVE |
| 10 | **Precisión I** — confusables básicos (make/do, say/tell) + falsos amigos frecuentes | Dim 3.1/3.2 | NGSL |
| 11 | **Marcadores de perfect/pasado** (already, yet, still, just, ever, never, since, for, ago, recently) | Dim 6.3 | PHRASE |
| 12 | **Plurales irregulares cotidianos** (children, men, women, feet, teeth, people, lives, knives) | Dim 6.1 | morfología |
| 13 | **Cuantificación, negación y polaridad** (much/many, (a) few/(a) little, several, any/ever/at all, enough) | Dim 6.6 | NGSL |
| 14 | **Condicionales e hipótesis básicos** (if, unless, if so/if not/if necessary, would/could) | Dim 6.4 | PHRASE |
| 15 | **Subordinación y relativos** (who, which, that, because, since, although, while, so that) | Dim 6.5 | NGSL |
| 16 | **Modales y semi-modales léxicos** (used to, had better, be supposed to, would rather, be about to) | Dim 5.7 | PHRASE |
| 17 | **Uso** — registro básico (casual ↔ neutro) + preguntas incrustadas (I wonder if, do you know…) | Dim 4.1 / 6.7 | PHRASE |

## Tramo 3 · Ampliación general (`unit-3.json`) — *CEFR ref: ~B1-B2*

General menos frecuente (Oxford más allá del NGSL). *(Grueso; temas nombrados, se refinan al llegar.)*
1. **Núcleo de ampliación** (2 temas).
2. **Deducción avanzada:** familias de palabras · más sufijos · raíces grecolatinas (intro) · compuestos.
3. **Combinar:** sistema de partículas (phrasal por partícula, Dim 1.6/5.5) · más colocaciones (ACL).
4. **Campos:** cultura · política · geografía/mundo · abstracto general.
5. **Precisión:** confusables avanzados (say/tell/speak, lend/borrow) · polisemia (run/set/get) ·
   contables engañosos (advice, information, research).
6. **Uso + estructura (Dim 6, tramo medio-alto):**
   - conectores del discurso (however, therefore, furthermore) · fillers · idioms de frecuencia media;
   - **condicionales/hipótesis formales** (as long as, provided that, otherwise, what if, if I were you);
   - **subordinación avanzada** (whereas, whom, whose, once, as soon as, in order to);
   - **marcadores de aspecto avanzados** (so far, by now, no longer, lately, up to now);
   - **existenciales/énfasis/cleft** (it is…that, what I mean is, the thing is, the reason why);
   - **voz pasiva lexicalizada** (be based on, be made of, be known as, be born, get + participio);
   - preposiciones dependientes y verbo+gerundio/infinitivo (Dim 5.1/5.2).

## Tramo 4 · Académico (`unit-4.json`; receptivo domina) — *CEFR ref: ~B2-C1*

Para leer papers (NAWL / AWL). *(Grueso.)*
1. **Núcleo académico** (banda grande, 3-4 temas).
2. **Deducción:** raíces grecolatinas a fondo — el gran atajo del léxico técnico.
3. **Combinar:** **colocaciones académicas (ACL)** — la capa central de este tramo.
4. **Campos:** ciencia y método · economía/sociedad/derecho · tecnología y datos.
5. **Precisión:** polisemia académica · matices/sinónimos.
6. **Uso + estructura (Dim 6, académico):**
   - hedging académico (may, tend to, arguably, it appears that) · idioms;
   - **plurales grecolatinos** (criteria, phenomena, data, analyses, hypotheses, indices, matrices, formulae);
   - **subordinación/condicionales formales** (should you…, were it not for, provided that, insofar as);
   - nominalización y voz pasiva académica (receptivo).

## Tramo 5 · Especialización ⭐ (`unit-5.json`, opcional; receptivo) — *CEFR ref: ~C1+*

Track por campo, curado (no hay lista estándar): matemática/lógica · software · filosofía ·
ajedrez · arte/música/tipografía. + matices finos, idioms avanzados y discurso.

---

## Matriz de gramática en modo vocabulario (Dim 6) — qué va en qué tramo

Responde directo: *"¿en qué tramo conviene cada estructura?"* Se enseña por sus **exponentes
léxicos** (no por tablas). El detalle conceptual profundo (transformaciones, paradigmas
completos) queda para el curso **Gramática**; acá va la capa **léxica/de reconocimiento**.

| Estructura | Exponentes léxicos (lo que se aprende como vocab) | Tramo |
|---|---|---|
| **Morfología irregular — verbos** | be/go/get/take… (base·pasado·participio) | 1 ✅ |
| **Morfología irregular — plurales cotidianos** | children, men, women, feet, teeth, people, lives, knives | 2 |
| **Morfología irregular — plurales grecolatinos** | criteria, data, phenomena, analyses, hypotheses, indices, formulae | 4 |
| **Comparativos/superlativos irregulares + frames** | better/best, worse/worst, more/most; as…as, than, the same as, the more…the more | 1 (básico) → 2 |
| **Marcadores de tiempo/aspecto** | now/today/always/every day (T1); already/yet/since/for/ago/ever/never/just (T2); so far/by now/no longer/lately (T3) | 1 → 3 |
| **Cuantificación · negación · polaridad** | some/any/no/all (T1); much/many/(a)few/(a)little/several/any/ever/at all (T2); neither…nor/hardly/barely (T3) | 1 → 3 |
| **Preguntas y preguntas incrustadas** | what/where/how much/how many (T1); I wonder if, do you know where, could you tell me (T2) | 1 → 2 |
| **Condicionales e hipótesis** | if/unless, if so/if not/if necessary (T2); as long as/provided/otherwise/what if/if I were you (T3); should you…/were it not for (T4) | 2 → 4 |
| **Subordinación y relativos** | who/which/that/because/although/while/so that (T2); whereas/whom/whose/once/as soon as/in order to (T3); insofar as (T4) | 2 → 4 |
| **Existenciales · énfasis · cleft** | there is/are (T2); it is…that, what I mean is, the thing is, the reason why (T3) | 2 → 3 |
| **Voz pasiva lexicalizada** | be made of, be based on, be known as, be born, get + participio | 3 |
| **Chunks modales / semi-modales** | have to, be going to, be able to, would like (T1); used to, had better, be supposed to, would rather (T2-3) | 1 → 3 |
| **Verbo + gerundio/infinitivo · prep. dependientes** | enjoy doing vs want to do; depend on, interested in, good at | 3 (Dim 5.1/5.2) |
| **Artículo cero / prep. en frases fijas** | go to bed, at home, by car, in/on time, at night | 1-2 (Dim 5.8) |

> **Frontera con el curso Gramática (actualizada):** Vocabulario **sí** cubre estas
> estructuras, pero **en modo vocabulario** — sus exponentes léxicos como chunks de repaso,
> para acostumbrarse a la forma. El curso **Gramática** (si se desarrolla) aporta el otro
> ángulo: reglas generales, transformaciones y paradigmas. No hay duplicación: son dos capas
> del mismo fenómeno (léxica acá, sistémica allá). Los **funcionales puros** (the, a, of…)
> no llevan ficha propia; se dan por cubiertos por el uso en los ejemplos.

---

## Reconciliación con la cobertura (importante)

Los conteos por tema son **aproximados** y no suman la banda entera. Cómo cierra:
- **Funcionales** (the, of, and…) → no llevan lexema; cuentan en NGSL pero se saltean al construir.
- Muchas palabras entran como **colocaciones/familia** (metadata), no como lexema propio.
- La gramática (Dim 6) **no infla** el objetivo: sus exponentes ya están en NGSL/PHRASE.
- El **rastreador** dice qué queda pendiente; un tema **"Núcleo restante"** por tramo absorbe
  las frecuentes que ningún tema capturó.
- **El objetivo real lo fija el tracker, no la suma del mapa.** El mapa ordena; el tracker mide.

## Cómo se avanza (loop de construcción)

1. Elegir el próximo **tema** del mapa (empezando por el Tramo 1).
2. Agregar el tema al `unit-N.json` del tramo: un **aspect** + sus átomos (fichas Rica). Si el
   tema es de gramática (Dim 6), los átomos son chunks/frames/formas con su ejemplo.
3. `npm run validate` → `npm run build:audio -- --only=voc1` → reiniciar dev.
4. `npm run coverage` para ver cuánto subió y en qué capa.
5. Marcar ✅ acá.

*Plan vivo: Tramo 1-2 se detallan fino; 3-5 quedan nombrados y se refinan al llegar. El
Tramo 1 fija el ritmo real (tamaño, tiempo, footprint) antes de comprometer el detalle de los altos.*
