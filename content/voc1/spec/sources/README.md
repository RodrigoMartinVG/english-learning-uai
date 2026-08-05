# Fuentes del rastreador de cobertura

Listas de frecuencia **reales** que definen QUÉ queremos cubrir. El script
`scripts/build-coverage.ts` las cruza con los lexemas ya construidos en
`content/voc1/unit-*.json` y genera `../cobertura.csv` + un resumen de "cuánto falta".

## Archivos

- **`ngsl.txt`** — New General Service List 1.2 (~2809 palabras). La espina, ~92% de
  cobertura general. Fuente libre: <https://www.newgeneralservicelist.org/> (orden
  alfabético; sin rank en este archivo).
- **`nawl.txt`** — New Academic Word List (~960 palabras académicas). Fuente:
  eapfoundation.com/vocab/academic/nawl. Complementa a la NGSL (no la solapa): +~10% de
  cobertura académica. **La capa para leer papers.**

### Fuentes que faltan agregar (expresiones multipalabra — ver por qué en PLANTILLA/índice)

Las listas de arriba son de **palabras sueltas**. Los phrasal verbs, idioms y colocaciones
son **unidades multipalabra**: NO las captura una lista de frecuencia de palabras, así que
son **denominadores aparte** (cada `.txt` nuevo aparece solo en el rastreador):

- **`phave.txt`** — PHaVE List (Garnier & Schmitt 2015): 150 phrasal verbs más frecuentes.
  Está en el paper/PDF (fetch dio 403); bajarlo a mano. Cubre ~83% de los phrasal verbs.
- **`phrase.txt`** — PHRASE List (Martinez & Schmitt 2012): ~505 expresiones formulaicas
  frecuentes (idioms/chunks).
- **`acl.txt`** — Academic Collocation List (Ackermann & Chen 2013): ~2.500 colocaciones
  académicas. Para la Dim. 1.5 / patrones.
- *Verbos irregulares:* NO son un denominador aparte — son palabras que **ya están en la
  NGSL** (be, go, get…) con una **etiqueta** de irregularidad. Ver el índice.

## Pendiente: banda CEFR (para la espiral)

Estos archivos son la lista *plana*. Para la **espiral por nivel** hace falta la banda
CEFR de cada palabra. Opciones (a resolver al construir cada rebanada):
- **Rank de frecuencia** del NGSL como proxy (rank 1-~750 ≈ A1-A2, ~750-1500 ≈ B1,
  1500-2809 ≈ B2). Requiere bajar el NGSL "por rank" (este .txt es alfabético).
- **CEFR-J Wordlist** (libre, A1-B2) o **English Vocabulary Profile** (Cambridge, CEFR por
  *sentido*) / **Oxford 3000/5000** para banda por palabra.

Cuando tengamos la banda, se agrega una columna `cefr` al rastreador y el build puede
reportar cobertura **por nivel** (cuántas A1 faltan, etc.).

## Nota sobre palabras funcionales

La NGSL incluye funcionales (*the, a, of, and, to*…). Esas se aprenden en **Gramática**
(no se hace un `lexeme` de "the"); en el rastreador cuentan igual, pero al construir se
saltean o se marcan como cubiertas por otro curso.
