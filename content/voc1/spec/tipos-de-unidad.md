# Tipos de unidad de vocabulario (y cómo se relacionan con las listas y los niveles)

Pregunta clave: ¿dónde entran los **verbos irregulares, phrasal verbs, idioms** y los
**tiempos verbales** respecto a las listas de frecuencia (NGSL, NAWL) y a los niveles?

Respuesta: **no son todos el mismo tipo de cosa.** Hay tres tipos de unidad, y cada uno se
rastrea distinto.

## Los tres tipos

| Tipo | Qué es | Fuente / lista | ¿Denominador propio? | Dónde vive |
|---|---|---|---|---|
| **1. Palabra suelta** | una palabra/familia | **NGSL, NAWL**, CEFR-J | **Sí** — la espina | Dim 0 (núcleo), Dim 2 (campos) |
| **2. Multipalabra (MWE)** | combinación con sentido propio | **PHaVE** (phrasal), **PHRASE** (idioms), **ACL** (colocaciones) | **Sí** — lista aparte | Dim 1 (colocaciones, phrasal), Dim 4 (idioms) |
| **3. Patrón gramatical** | cómo se combinan/comportan | *ninguna lista de palabras* | **No** | Gramática, o Dim 5 (si depende de la palabra) |

## Caso por caso

- **Verbos irregulares** → *tipo 1, con etiqueta.* `be, have, go, get, make…` **ya están en
  la NGSL**. Lo "irregular" es una **propiedad** de la palabra (su morfología
  go/went/gone), no un ítem nuevo. → En el rastreador es una **columna/flag**
  `irregular`, no una lista aparte. La "unidad de irregulares" (U0.6/U1.7) es una **vista**
  de esas palabras NGSL agrupadas por patrón.

- **Phrasal verbs** → *tipo 2.* `get up`, `turn on` están hechos de palabras del núcleo
  (get, up), pero el **significado no se deduce de las partes** → una lista de palabras
  sueltas NO los cuenta. Necesitan su denominador: **PHaVE** (150 más frecuentes).

- **Idioms / expresiones formulaicas** → *tipo 2, extremo.* Totalmente opacos
  (`kick the bucket`). Denominador: **PHRASE List** (~505).

- **Colocaciones** → *tipo 2, semi-transparente.* `make a decision`: las palabras están en
  la NGSL, lo que se aprende es el **emparejamiento**. Denominador: **ACL** (académicas) o
  diccionarios de colocaciones.

  > Gradiente de composicionalidad: **colocación** (semi-clara) → **phrasal verb** (opaco)
  > → **idiom** (totalmente opaco). A más opaco, más obligatorio tratarlo como ítem propio.

- **Tiempos verbales (perfect, compound, continuous)** → *tipo 3.* **No son vocabulario**:
  no aparecen en ninguna lista de palabras. Van al **curso Gramática**, por su propia banda
  CEFR (present perfect ~B1). Lo único léxico es su **insumo**: los participios de los
  irregulares, que están en la NGSL.

- **Patrones que dependen de la palabra** (verbo+preposición, verbo+gerundio) → *tipo 3
  pero léxico:* viven en **Dim 5** (lexicogramática), como etiqueta sobre la palabra.

## Cómo se relacionan con los NIVELES (la espiral)

**Todo ítem —palabra suelta o MWE— entra en la espiral por su TRAMO de frecuencia** (el CEFR
es referencia). No se ordena por tipo, se ordena por frecuencia/tramo:

- `get up` (phrasal, PHaVE, frecuente) → A1-A2, junto al núcleo A1.
- un idiom raro → C1.
- un verbo irregular → el nivel de **su palabra** (go = A1); el *sistema* de patrones, ~A2-B1.
- un tiempo compuesto → Gramática, ~B1, en paralelo.

## Implicación para el rastreador (que ya existe)

`scripts/build-coverage.ts` ya soporta **múltiples listas**: cada `.txt` en `sources/` es
un **denominador separado**. Entonces la foto de cobertura es multi-capa:

```
NGSL   x / 2809   (palabras generales)
NAWL   x / 960    (palabras académicas)
PHaVE  x / 150    (phrasal verbs)        ← agregar
PHRASE x / 505    (idioms/chunks)        ← agregar
ACL    x / ~2500  (colocaciones acad.)   ← agregar
```

- **Irregulares** NO suma una fila: es una etiqueta sobre palabras NGSL.
- **Tiempos** NO se rastrean acá: son del curso Gramática.
- Con la frecuencia/banda por ítem, el build reporta cobertura **por tramo** en cada capa.
