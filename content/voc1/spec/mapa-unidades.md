# Mapa de unidades — Vocabulario (plan de largo plazo, vivo)

Este mapa convierte el [índice](./indice.md) (dimensiones) + la cobertura
([sources](./sources/), 5.602 ítems banda-CEFR) en **unidades concretas y ordenadas**.

**Principios**
- **Granularidad justa:** el mapa fija los *temas/unidades* y su orden; qué palabra
  exacta va en cuál lo asigna el rastreador (`npm run coverage`). No pre-asignamos las
  5.602 palabras a mano.
- **Espiral por nivel:** se construye A1 completo (todas las dimensiones), luego A2, etc.
  A1 va **fino** acá; A2→C1, **grueso** (se refina al llegar).
- **Un tema = un `topic`** para que el sistema de aspectos lo agrupe. Los temas nuevos que
  no existan en `TOPIC_TAGS` (content/schema.ts) se agregan al crear la unidad (enum).
- **Tamaño meta:** ~25-40 palabras/unidad (receta Rica). Total estimado del curso:
  ~90-110 unidades a lo largo de A1-C1.
- **MWE y sistema** (phrasal verbs, colocaciones, confusables, patrones) son unidades
  **transversales**: entran en su nivel, reusando palabras del núcleo.

Estado: `✅ hecha` · `▶ próxima` · `· planificada`

---

## A1 — fundacional, concreto, alta frecuencia (~833 palabras + MWE)

### Campos semánticos (Dim 2A)
| # | Unidad | topic | ~palabras | Estado |
|---|---|---|---|---|
| 1 | La familia | `family` | 14 | ✅ hecha |
| 2 | La casa y los muebles | `home` | ~30 | ▶ próxima |
| 3 | Comida y bebida | `food`* | ~35 | · |
| 4 | El cuerpo y la salud (básico) | `body`* | ~30 | · |
| 5 | La ropa | `clothes`* | ~20 | · |
| 6 | Colores, formas y tamaños | `describe`* | ~20 | · |
| 7 | Números, hora, fechas y dinero | `time` / `numbers`* | ~30 | · |
| 8 | La ciudad y los lugares | `city` | ~25 | · |
| 9 | Transporte y viajes (básico) | `transport`* | ~20 | · |
| 10 | Animales y naturaleza (básico) | `nature`* | ~25 | · |
| 11 | Escuela y trabajo (básico) | `workplace` / `campus` | ~25 | · |
| 12 | Rutina diaria y tiempo libre | `routine` / `leisure` | ~30 | · |
| 13 | El clima | `weather`* | ~15 | · |
| 14 | Sentimientos y personalidad (básico) | `feelings`* | ~25 | · |

### Núcleo y sistema A1 (transversal, Dim 0/1)
| # | Unidad | Fuente | ~ítems | Estado |
|---|---|---|---|---|
| 15 | Verbos esenciales A1 | núcleo (be, have, go, get…) | ~40 | · |
| 16 | Adjetivos y adverbios esenciales A1 | núcleo | ~40 | · |
| 17 | Phrasal verbs de alta frecuencia | PHaVE (get up, sit down…) | ~20 | · |

*`*` = topic a agregar a `TOPIC_TAGS` al crear la unidad.*

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
