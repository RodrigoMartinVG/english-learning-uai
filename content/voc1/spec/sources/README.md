# Fuentes del rastreador de cobertura

Listas de frecuencia **reales** que definen QUÉ queremos cubrir. El script
`scripts/build-coverage.ts` las cruza con los lexemas ya construidos en
`content/voc1/unit-*.json` y genera `../cobertura.csv` + un resumen de "cuánto falta".

## Archivos

- **`ngsl.txt`** — New General Service List 1.2 (~2809 palabras). La espina, ~92% de
  cobertura general. Fuente libre: <https://www.newgeneralservicelist.org/> (orden
  alfabético; sin rank en este archivo).
- **`nawl.txt`** — *(pendiente)* New Academic Word List (~963 palabras académicas).
  Bajar de <https://www.newgeneralservicelist.org/nawl-new-academic-word-list> (no está
  inline en la página; hay descarga/Excel y un dataset en Kaggle) y guardarlo acá con el
  mismo formato (palabras separadas por coma o salto de línea). El script lo toma solo.

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
