# Mapa de unidades — Vocabulario (plan de largo plazo, vivo)

Este mapa convierte el [índice](./indice.md) (dimensiones) + la cobertura
([sources](./sources/), 5.602 ítems banda-CEFR) en **unidades concretas y ordenadas**.

**Principios**
- **Granularidad justa:** el mapa fija los *temas/unidades* y su orden; qué palabra
  exacta va en cuál lo asigna el rastreador (`npm run coverage`). No pre-asignamos las
  5.602 palabras a mano.
- **Espiral por nivel:** se construye A1 completo (todas las dimensiones), luego A2, etc.
  A1 va **fino** acá; A2→C1, **grueso** (se refina al llegar).
- **Orden por UTILIDAD dentro del nivel:** el núcleo de mayor frecuencia/ROI —**verbos
  esenciales, adjetivos/adverbios esenciales, phrasal verbs comunes**— va **al FRENTE**,
  nunca al final; se **interleava** con los campos temáticos. (Un curso de vocabulario que
  deja los verbos para la unidad 15 está mal ordenado.)
- **La frecuencia filtra el contenido:** solo entran palabras de las listas fuente
  (NGSL/NAWL/Oxford/PHaVE). Eso ya deja afuera lo raro/inútil: no hay "jirafa" ni
  "erizo" — solo los animales frecuentes (dog, cat, bird…), y pocos.
- **Evitar silos aburridos:** un tema merece unidad solo si tiene **suficientes miembros
  frecuentes y útiles**. Los flojos (animales, colores sueltos, clima) **no son unidad
  propia**: se **pliegan** en una unidad más amplia (naturaleza/entorno, descripción) o se
  omiten. Y la **ficha rica** (ejemplo + colocaciones + familia) hace que ninguna palabra
  sea "dog = perro" pelado: siempre en contexto.
- **Un tema = un `topic`** para que el sistema de aspectos lo agrupe. Los temas nuevos que
  no existan en `TOPIC_TAGS` (content/schema.ts) se agregan al crear la unidad (enum).
- **Tamaño meta:** ~25-40 palabras/unidad (receta Rica). Con el enfoque magro
  (núcleo al frente + temas de alto valor, sin silos), el total estimado del curso baja a
  **~60-80 unidades** A1-C1 (no ~110).
- **MWE y sistema** (phrasal verbs, colocaciones, confusables, patrones) son unidades
  **transversales**: entran en su nivel, reusando palabras del núcleo.
- **Deducir > memorizar:** las herramientas de deducción (afijos → raíces) entran apenas
  hay base para aplicarlas (A2) y **temprano dentro del nivel** — desbloquean miles de
  palabras, así que no se difieren.
- **Receptivo ↑ en niveles altos:** A1-B1 es receptivo + productivo; en B2-C1 lo
  académico/especializado es sobre todo **receptivo** (leer papers), y la producción se
  concentra en el núcleo general.

Estado: `✅ hecha` · `▶ próxima` · `· planificada`

## Plantilla por nivel (misma para A1-C1)

Cada nivel se recorre en este **orden de utilidad** (no por dimensión):

1. **Núcleo del nivel** — verbos/adjetivos/adverbios de su banda de frecuencia. **Al frente.**
2. **Deducción** — afijos → raíces → compuestos (apenas hay base; temprano).
3. **Campos de alto valor** — gated por frecuencia, sin silos, ficha rica.
4. **Combinar** — colocaciones y phrasal verbs del nivel.
5. **Precisión** — confusables → polisemia → matices.
6. **Uso** — registro → conectores → idioms/hedging → discurso.

*Nada esencial se difiere; los silos se pliegan. Cada nivel toca TODAS las dimensiones
(espiral), consistente con la matriz del [índice](./indice.md).*

---

## A1 — fundacional (~12 unidades)

Orden de construcción = orden de utilidad. **Núcleo al frente (1-4)**, después los campos
de alto valor. Silos flojos **plegados** (no son unidad propia): los pocos animales
frecuentes (dog, cat, bird…) van en "entorno"; colores/tamaños en "descripción"; el clima
en "lugares/entorno"; la ropa cabe en "vida diaria".

| # | Unidad | topic | ~ítems | Dim | Estado |
|---|---|---|---|---|---|
| 1 | Verbos esenciales I (be, have, do, go, get, make, take, come, give, say) | `essentials`* | ~25 | 0 | ▶ **próxima** |
| 2 | Verbos esenciales II (want, like, know, see, need, use, find, think, tell, ask…) | `essentials`* | ~30 | 0 | · |
| 3 | Adjetivos y adverbios esenciales (good, bad, big, new, old, very, more, now, here…) | `essentials`* | ~35 | 0 | · |
| 4 | Phrasal verbs de alta frecuencia (get up, sit down, come back…) | `phrasal`* (PHaVE) | ~20 | 1 | · |
| 5 | La familia | `family` | 14 | 2 | ✅ hecha |
| 6 | La casa y la vida diaria (muebles, ropa, objetos) | `home` | ~35 | 2 | · |
| 7 | Comida y bebida | `food`* | ~35 | 2 | · |
| 8 | El cuerpo y la salud | `body`* | ~30 | 2 | · |
| 9 | Gente, trabajo y estudio | `workplace` / `campus` | ~30 | 2 | · |
| 10 | Tiempo, números y dinero | `time` / `numbers`* | ~30 | 0/2 | · |
| 11 | Lugares, ciudad y transporte (+ clima, entorno, animales frecuentes) | `city` / `transport`* | ~35 | 2 | · |
| 12 | Descripción y sentimientos (personalidad, colores, tamaños) | `describe`* / `feelings`* | ~35 | 2/3 | · |

*`*` = topic a agregar a `TOPIC_TAGS` al crear la unidad. `essentials` agrupa el núcleo
transversal (verbos/adjetivos que no son de un tema); `phrasal` agrupa los phrasal verbs.*

---

## A2 — ampliación (~817 · ~11 unidades)

1. **Núcleo A2** — verbos y adjetivos/adverbios de la banda A2 (~2 u). **Front.**
2. **Deducción (empieza acá):** **Prefijos** (un-, in-, dis-, re-, over-, pre-) + **sufijos
   comunes** (-er, -tion, -ful, -less, -ly) — el kit para deducir miles de palabras.
3. **Combinar:** **Colocaciones básicas** (make/do, adj+sust); más phrasal verbs.
4. **Campos de alto valor:** Trabajo y profesiones · Salud/cuerpo (ampliado) · Viajes ·
   Tecnología cotidiana · Compras y dinero (ampliado) · Relaciones y emociones.
   *(Deportes/medio-ambiente NO son unidad: sus pocas palabras frecuentes se pliegan.)*
5. **Precisión:** Falsos amigos frecuentes · confusables básicos (make/do, say/tell).
6. **Uso:** Registro básico (casual ↔ neutro).

## B1 — cierre del general (~794 · ~13 unidades)

1. **Núcleo B1** (~2 u). **Front.**
2. **Deducción:** **Familias de palabras** (transitar categorías) · más **sufijos** ·
   **raíces grecolatinas (intro)** · **compuestos**.
3. **Combinar:** **Sistema de partículas** (phrasal verbs por partícula) · más colocaciones.
4. **Campos:** Educación · Medios y sociedad · Cultura/ocio (gated).
5. **Precisión:** Confusables avanzados (say/tell/speak, lend/borrow, rob/steal) ·
   contables engañosos.
6. **Uso + patrones:** Conectores del discurso · fillers/suavizadores · **verbo+gerundio/
   infinitivo** · **preposiciones dependientes** (Dim 5).

## B2 — académico (~1405 · ~16 unidades; receptivo domina)

1. **Núcleo B2** (banda grande, ~3-4 u). **Front.**
2. **Deducción:** **Raíces grecolatinas (a fondo)** — el gran atajo para el léxico técnico.
3. **Combinar:** **Colocaciones académicas** (ACL).
4. **Campos (alto valor para papers):** Ciencia y método · Economía/sociedad/derecho ·
   Tecnología y datos.
5. **Precisión:** **Polisemia** (run/set/get) · **matices/sinónimos**.
6. **Uso:** **Idioms** · **hedging académico** (may, tend to, arguably).

## C1 — precisión + especialización (~1294 · ~17 u, varias opcionales)

1. **Núcleo C1** (~2-3 u). **Front.**
2. **Precisión fina:** matices/sinónimos avanzados · connotación.
3. **Uso:** discurso avanzado · idioms avanzados.
4. **Track de especialización ⭐** (opcional, Dim 2C): matemática/lógica · software ·
   filosofía · ajedrez · arte/música/tipografía. Sobre todo **receptivo**.

---

## Reconciliación con la cobertura (importante)

Los conteos por unidad son **aproximados** y NO suman la banda entera (p. ej. A1 ~833,
pero las 12 unidades ≈ 360 lexemas). Por qué, y cómo cierra:
- **~190 A1 son funcionales** (the, of, some, modales…) → van a **Gramática**, no son lexema.
- Muchas palabras entran como **colocaciones/familia** en la ficha (metadata), no como
  lexema propio → cuentan para el aprendizaje sin ser una fila del tracker.
- El **rastreador** (`npm run coverage`) dice qué queda **pendiente por banda**; una unidad
  **"Núcleo restante"** por nivel absorbe las frecuentes que ningún tema capturó.
- **El objetivo real lo fija el tracker, no la suma del mapa.** El mapa ordena; el tracker
  mide.

## Cómo se avanza (loop de construcción)

1. Elegir la próxima unidad del mapa (empezando por A1).
2. Redactar su rebanada en el spec (fichas Rica), o directo a `unit-N.json`.
3. `npm run validate` → `npm run build:audio -- --only=voc1` → reiniciar dev.
4. `npm run coverage` para ver cuánto subió y qué falta.
5. Marcar la unidad ✅ acá.

*El mapa se ajusta con lo aprendido: A1 fija el ritmo real (tamaño, tiempo, footprint)
antes de comprometer el detalle de B2/C1.*
