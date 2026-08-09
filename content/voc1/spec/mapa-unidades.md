# Mapa de unidades — Vocabulario (plan de largo plazo, vivo)

Convierte el [índice](./indice.md) (dimensiones) + la cobertura ([sources](./sources/),
5.602 ítems) en **temas concretos y ordenados**, agrupados en unidades por tramo.

**El eje es la FRECUENCIA / UTILIDAD, no el CEFR.** El CEFR mide competencia comunicativa
de una persona, no vocabulario; usarlo como estructura fuerza un marco que no es. Acá el
esqueleto son **tramos de frecuencia/utilidad** (lo más útil primero); el CEFR queda como
**etiqueta de referencia aproximada** por palabra (para orientarse y cruzar con Oxford).

**Principios**
- **Granularidad justa:** el mapa fija los *temas* y su orden; qué palabra va en cuál
  lo asigna el rastreador (`npm run coverage`). No pre-asignamos las 5.602 a mano.
- **Espiral por tramo:** se construye un tramo completo (todas las dimensiones), luego el
  siguiente. Tramo 1 va **fino** acá; 3-5, **grueso** (se refina al llegar).
- **Utilidad al frente:** dentro de cada tramo, el núcleo de mayor frecuencia (verbos,
  adjetivos/adverbios, phrasal comunes) va **primero**, interleaved con los campos. Nada
  esencial se difiere.
- **La frecuencia filtra el contenido:** solo entran palabras de las listas fuente. Ya deja
  afuera lo raro/inútil (no hay "jirafa", sí dog/cat/bird, y pocos).
- **Sin silos aburridos:** un tema es unidad solo si tiene suficientes miembros frecuentes
  y útiles; los flojos (animales, colores, clima) se **pliegan**. La ficha rica (ejemplo +
  colocaciones + familia) evita el "dog = perro" pelado.
- **Deducir > memorizar:** las herramientas de deducción (afijos → raíces) entran apenas hay
  base para aplicarlas (Tramo 2) y temprano dentro del tramo — desbloquean miles de palabras.
- **Un tema = un `topic`** (aspectos). Los temas nuevos se agregan a `TOPIC_TAGS` al crear la
  unidad.
- **Receptivo ↑ en tramos altos:** Tramos 1-3 receptivo + productivo; Tramo 4-5 (académico/
  especializado) sobre todo **receptivo** (leer papers); la producción se concentra en el núcleo.
- **Estructura: unidad = TRAMO, temas (aspects) = campos.** Cada tramo es **UN**
  `unit-N.json` con varios *aspects* (temas). Agregar un campo = sumar un **aspecto + sus
  átomos** a ese archivo, **no** una unidad nueva. Así el curso tiene **~5-7 unidades**
  (tramos), no cientos.
- **Tamaño:** ~25-40 palabras por **tema** (receta Rica); ~10-15 temas por tramo →
  **~60-80 temas** en total.

Estado: `✅ hecha` · `▶ próxima` · `· planificada`

## Plantilla por tramo (misma para todos)

Orden de utilidad, no por dimensión:
1. **Núcleo del tramo** — verbos/adjetivos/adverbios de su banda de frecuencia. Al frente.
2. **Deducción** — afijos → raíces → compuestos.
3. **Campos de alto valor** — gated por frecuencia, sin silos, ficha rica.
4. **Combinar** — colocaciones y phrasal verbs del tramo.
5. **Precisión** — confusables → polisemia → matices.
6. **Uso** — registro → conectores → idioms/hedging → discurso.

---

## Tramo 1 · Núcleo esencial — vida cotidiana (`unit-1.json` · 12 temas)

Lo más frecuente y básico (NGSL top ~800 + los campos cotidianos cuyos miembros centrales
son frecuentes). Cada fila es un **tema (aspect)** dentro de `unit-1.json`. *(CEFR ref: ~A1-A2.)*

| # | Tema | topic | ~ítems | Estado |
|---|---|---|---|---|
| 1 | Verbos esenciales (be, have, go, get, make, say, know… + keep, begin, show, run, write, speak, leave…) | `essentials` | 50 | ✅ hecha |
| 2 | Verbos irregulares (por patrón) — pasado y participio | grammar `verb.irregular` | 31 | ✅ hecha |
| 3 | Adjetivos y adverbios esenciales (good, big, new, very, more, now, here…) | `adjectives`* | ~35 | ▶ **próxima** |
| 4 | Phrasal verbs de alta frecuencia (get up, sit down, come back…) | `phrasal`* | ~20 | · |
| 5 | La familia | `family` | 26 | ✅ hecha |
| 6 | La casa y la vida diaria (muebles, ropa, objetos) | `home` | ~35 | · |
| 7 | Comida y bebida | `food`* | ~35 | · |
| 8 | El cuerpo y la salud | `body`* | ~30 | · |
| 9 | Gente, trabajo y estudio | `workplace`/`campus` | ~30 | · |
| 10 | Tiempo, números y dinero | `time`/`numbers`* | ~30 | · |
| 11 | Lugares, ciudad y transporte (+ clima, entorno, animales frecuentes) | `city`/`transport`* | ~35 | · |
| 12 | Descripción y sentimientos (personalidad, colores, tamaños) | `describe`*/`feelings`* | ~35 | · |

*`*` = topic a agregar a `TOPIC_TAGS`. `essentials` agrupa el núcleo transversal; `phrasal`, los phrasal verbs.*

## Tramo 2 · Núcleo general (~13 temas) — *CEFR ref: ~A2-B1*

Completa la alta frecuencia general (resto del NGSL, ~801-2809).
1. **Núcleo general** — más verbos/adjetivos/adverbios frecuentes (~2-3 u). Al frente.
2. **Deducción (arranca):** prefijos (un-, in-, dis-, re-, over-) + sufijos comunes
   (-er, -tion, -ful, -less, -ly) — el kit para deducir.
3. **Combinar:** colocaciones básicas (make/do); más phrasal verbs.
4. **Campos:** sociedad y vida pública · educación · medios · naturaleza/entorno (ampliado).
5. **Precisión:** falsos amigos frecuentes · confusables básicos (make/do, say/tell).
6. **Uso:** registro básico (casual ↔ neutro) · conversación.

## Tramo 3 · Ampliación general (~13 temas) — *CEFR ref: ~B1-B2*

General menos frecuente (Oxford más allá del NGSL).
1. **Núcleo de ampliación** (~2 u).
2. **Deducción:** familias de palabras · más sufijos · raíces grecolatinas (intro) · compuestos.
3. **Combinar:** sistema de partículas (phrasal por partícula) · más colocaciones.
4. **Campos:** cultura · política · geografía/mundo · abstracto general.
5. **Precisión:** confusables avanzados (say/tell/speak, lend/borrow) · contables engañosos.
6. **Uso + patrones:** conectores del discurso · fillers · verbo+gerundio/infinitivo ·
   preposiciones dependientes (Dim 5).

## Tramo 4 · Académico (~16 temas; receptivo domina) — *CEFR ref: ~B2-C1*

Para leer papers (NAWL / AWL).
1. **Núcleo académico** (banda grande, ~3-4 u).
2. **Deducción:** raíces grecolatinas a fondo — el gran atajo del léxico técnico.
3. **Combinar:** colocaciones académicas (ACL).
4. **Campos:** ciencia y método · economía/sociedad/derecho · tecnología y datos.
5. **Precisión:** polisemia (run/set/get) · matices/sinónimos.
6. **Uso:** idioms · hedging académico (may, tend to, arguably).

## Tramo 5 · Especialización ⭐ (~15 temas, opcional; receptivo) — *CEFR ref: ~C1+*

Track por campo, curado (no hay lista estándar): matemática/lógica · software · filosofía ·
ajedrez · arte/música/tipografía. + matices finos y discurso avanzado.

---

## Reconciliación con la cobertura (importante)

Los conteos por unidad son **aproximados** y no suman la banda entera. Cómo cierra:
- **Funcionales** (the, of, some, modales…) → **Gramática**, no son lexema. (En el NGSL por
  frecuencia son justo los primeros ~50-100: van al otro curso.)
- Muchas palabras entran como **colocaciones/familia** (metadata), no como lexema propio.
- El **rastreador** dice qué queda pendiente; un tema **"Núcleo restante"** por tramo
  absorbe las frecuentes que ningún tema capturó.
- **El objetivo real lo fija el tracker, no la suma del mapa.** El mapa ordena; el tracker mide.

## Cómo se avanza (loop de construcción)

1. Elegir el próximo **tema** del mapa (empezando por el Tramo 1).
2. Agregar el tema al `unit-N.json` del tramo: un **aspect** + sus átomos (fichas Rica).
3. `npm run validate` → `npm run build:audio -- --only=voc1` → reiniciar dev.
4. `npm run coverage` para ver cuánto subió y qué falta.
5. Marcar ✅ acá.

*Plan vivo: el Tramo 1 fija el ritmo real (tamaño, tiempo, footprint) antes de comprometer
el detalle de los tramos altos.*
