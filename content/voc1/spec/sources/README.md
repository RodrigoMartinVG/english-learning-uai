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
- **`oxford5000.csv`** — Oxford 5000 (~4953 palabras) con **banda CEFR** (A1-C1), formato
  `word,cefr`. Fuente: OUP (vía github winterdl). **Doble función:** suma escala (llega a
  ~5.000) y es la **fuente de banda CEFR** para toda la espiral. Solo guardamos
  palabra+nivel (dato factual); las definiciones/ejemplos de Oxford (con copyright) NO se
  copian. Unión NGSL∪NAWL∪Oxford ≈ **5.452 palabras objetivo**.

### Capas de expresiones multipalabra (MWE) — todas activas ✅

Las tres listas de arriba son de **palabras sueltas**. Los phrasal verbs, idioms y
colocaciones son **unidades multipalabra**: NO las captura una lista de frecuencia de
palabras, así que son **denominadores aparte** (cada `.txt` aparece como su propia fila en el
rastreador). Ya están las tres — el curso tiene **6 capas de contenido** en total:

- **`phave.txt`** — ✅ PHaVE List (Garnier & Schmitt 2015): 150 phrasal verbs más
  frecuentes (norbertschmitt.co.uk, Appendix 1). Cubre ~83% de los phrasal verbs. Multi-
  palabra → denominador propio. Sin banda CEFR (tiene su rank 1-150 como proxy).
- **`phrase.txt`** — ✅ PHRASE List (Martinez & Schmitt 2012): **500** formas de superficie
  de las ~505 expresiones formulaicas no transparentes más frecuentes (idioms/chunks). Fuente:
  norbertschmitt.co.uk (Appendix oficial, `.doc`). Los sentidos/glosas entre paréntesis y
  comillas se removieron para el match exacto (p. ej. `going to (future)` → `going to`), así que
  el conteo baja de 505 a 500 formas únicas. Denominador propio.
- **`acl.txt`** — ✅ Academic Collocation List (Ackermann & Chen 2013): **2.112** colocaciones
  académicas (de las 2.469 publicadas) extraídas de eapfoundation.com (páginas alfabética + por
  tipo). Colocaciones adj+sust, sust+sust, verbo+sust, adv+adj, verbo+adv. Para la Dim. 1.5 /
  Tramo 4. Denominador propio.
- *Verbos irregulares:* NO son un denominador aparte — son palabras que **ya están en la
  NGSL** (be, go, get…) con una **etiqueta** de irregularidad. Ver el índice.

## Banda CEFR (para la espiral)

- **Fuente principal:** `oxford5000.csv` (denominador, curado por OUP, A1-C1).
- **Relleno:** `banding/cefrj.csv` (dataset Maximax67, CEFR-J/English Profile, A1-B2). Va en
  `banding/` porque es **solo para bandear**: NO suma al objetivo (evita inflarlo con
  entradas algorítmicas), solo clasifica por nivel las palabras que Oxford no trae.

Distribución objetivo (unión 5.452): A1 ~833 · A2 ~817 · B1 ~794 · B2 ~1405 · C1 ~1294 ·
**sin banda ~309**. Las "sin banda" (ni en Oxford ni en CEFR-J) se pueden bandear luego por
rank de frecuencia del NGSL o a mano al construir cada rebanada.

## Nota sobre palabras funcionales

La NGSL incluye funcionales (*the, a, of, and, to*…). Esas se aprenden en **Gramática**
(no se hace un `lexeme` de "the"); en el rastreador cuentan igual, pero al construir se
saltean o se marcan como cubiertas por otro curso.
