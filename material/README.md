# Material oficial — no versionado

Esta carpeta contiene los PDFs oficiales de la cátedra (UAI).

**No están en el repositorio y no deben subirse.** Son material con derechos de la Universidad
Abierta Interamericana; no es nuestro para redistribuir. `.gitignore` excluye **todo** lo que
caiga acá adentro —cualquier formato, a cualquier profundidad— y re-incluye solo los `.md`
nuestros. Si agregás una carpeta, los PDFs de adentro ya quedan cubiertos.

## Organización: una carpeta por curso, más lo transversal

```
material/
├── comun/    ← sirve a VARIOS niveles a la vez
├── en1/      ← Inglés 1
├── en2/      ← Inglés 2 (vacío: esperando el material)
└── …         ← en3/, en4/ y demás cursos, cuando lleguen
```

Los nombres de las carpetas son los **ids de curso** de `content/courses.json` (`en1`, `en2`,
`voc1`…), para que la fuente y el contenido derivado se lean igual: `material/en2/` alimenta a
`content/en2/`. `comun/` es la excepción y existe por un archivo real: el cuadernillo de la
licenciatura cubre los cuatro niveles de inglés de una vez, y duplicarlo en `en1/`…`en4/` sería
mentir sobre qué es.

### `comun/` — transversal a los 4 niveles

```
CUADERNILLO MATEMÁTICA_INGLÉS I II III & IV_UAI_2026.pdf
```

Los textos de matemática en inglés que comparten Inglés I, II, III y IV. Es la fuente de la
**Unidad 5** de en1 (ver `drafts/PLAN-unidad-5.md`) y va a serlo de las unidades equivalentes
de en2/en3/en4.

### `en1/` — Inglés 1

```
N1_Unidad_1.pdf                        Unidad 1 — Bienvenida        (20 págs)
N1_Unidad_2.pdf                        Unidad 2 — Estilo de vida    (14 págs)
N1_Unidad_3.pdf                        Unidad 3 — Gente             (13 págs)
N1_Unidad_4.pdf                        Unidad 4 — Lugares           (16 págs)
Speaking Test  UAI Level 1 (1).pdf     Consignas del final oral → fuente de la Unidad 6
LIC. MATEM_T102304 Inglés I (2026).pdf Programa de la materia (encuadre, no contenido)
```

Los nombres son los del campus virtual, **sin retocar**: así se puede re-descargar un archivo y
soltarlo acá sin pensar. (Sí, el del Speaking Test tiene doble espacio y un `(1)`; es como viene.)

### `en2/` — Inglés 2

Vacía a propósito, con un `.gitkeep` para que la carpeta exista antes que el material. Cuando
llegue el cuadernillo de Inglés 2, va acá tal como venga; si trae unidades sueltas, seguí la
convención de en1 (`N2_Unidad_1.pdf`…). Después, el runbook de **`MANIFIESTO-NIVELES.md` §7**.

## Para qué se usan

Alimentan la curación de contenido. **Se leen una vez, al escribir los átomos; la app en runtime
no los toca nunca** y no hay ningún script que lea rutas de acá: son insumo humano.

El resultado —ya curado y sin derechos de terceros— sí vive en el repo:

- `drafts/unidad-1.reconstruccion.md` — reconstrucción didáctica de la U1
- `drafts/situaciones-comunicacionales.md` — transcripción de los 4 cómics
- `content/en1/unit-*.json` — los átomos, que son obra derivada y reescrita

Es decir: **si no tenés los PDFs, igual podés desarrollar la app.** Solo los necesitás si vas a
curar contenido nuevo o verificar una transcripción contra el original.

## Nota sobre el contenido derivado

Los átomos de `content/` son una reelaboración pedagógica: texto reescrito, erratas corregidas,
diálogos sintéticos, narrativas propias para los listenings (que el material no incluye).
No son una copia del PDF. Aun así, el proyecto es material de estudio sin fines comerciales.
