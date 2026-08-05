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

Estado: `✅ hecha` · `▶ próxima` · `· planificada`

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

## A2 — ampliación + primeros abstractos (~817)

Campos: **Trabajo y profesiones**, **Salud y cuerpo (ampliado)**, **Viajes y turismo**,
**Tecnología cotidiana**, **Compras y dinero (ampliado)**, **Emociones y relaciones**,
**Deportes**, **Medio ambiente**. Sistema/precisión: **Prefijos negativos**,
**Colocaciones básicas** (make/do), **Falsos amigos frecuentes**. (~10-12 unidades)

## B1 — cierre del general (~794)

Campos: **Educación**, **Medios y sociedad**, **Cultura**. Sistema: **Familias de
palabras**, **Sufijos**, **Sistema de partículas** (phrasal verbs), **Compuestos**.
Precisión: **Confusables** (say/tell, lend/borrow). Uso: **Conectores del discurso**.
Patrones: **verbo+gerundio/infinitivo**, **preposiciones dependientes** (Dim 5).
(~12-14 unidades)

## B2 — académico y abstracto (~1405)

Campos: **Ciencia y método**, **Economía/sociedad/derecho**, **Tecnología y datos**.
Sistema: **Raíces grecolatinas**. Precisión: **Polisemia**, **Matices/sinónimos**.
Uso: **Idioms**, **Hedging académico**. **Colocaciones académicas** (ACL). (~15-18 unidades)

## C1 — precisión + especialización (~1294)

Académico avanzado + **track ⭐ opcional** (Dim 2C): matemática/lógica, software,
filosofía, ajedrez, arte/música/tipografía. Matices finos, discurso avanzado.
(~15-20 unidades, varias opcionales)

---

## Cómo se avanza (loop de construcción)

1. Elegir la próxima unidad del mapa (empezando por A1).
2. Redactar su rebanada en el spec (fichas Rica), o directo a `unit-N.json`.
3. `npm run validate` → `npm run build:audio -- --only=voc1` → reiniciar dev.
4. `npm run coverage` para ver cuánto subió y qué falta.
5. Marcar la unidad ✅ acá.

*El mapa se ajusta con lo aprendido: A1 fija el ritmo real (tamaño, tiempo, footprint)
antes de comprometer el detalle de B2/C1.*
