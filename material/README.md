# Material oficial — no versionado

Esta carpeta contiene los PDFs oficiales de la cátedra de **Inglés I (UAI)**.

**No están en el repositorio y no deben subirse.** Son material con derechos de la Universidad
Abierta Interamericana; no es nuestro para redistribuir. `.gitignore` excluye `material/*.pdf`
justamente por eso.

## Qué va acá

Descargá los PDFs del campus virtual de la materia y guardalos con estos nombres exactos
(los scripts los buscan así):

```
material/N1_Unidad_1.pdf     Unidad 1 — Bienvenida        (20 págs)
material/N1_Unidad_2.pdf     Unidad 2 — Estilo de vida    (14 págs)
material/N1_Unidad_3.pdf     Unidad 3 — Gente             (13 págs)
material/N1_Unidad_4.pdf     Unidad 4 — Lugares           (16 págs)
```

## Para qué se usan

Alimentan el pipeline de extracción (`scripts/extract-pdf.ts`). **Se leen una vez, al curar
el contenido; la app en runtime no los toca nunca.**

El resultado de esa extracción —ya curado y sin derechos de terceros— sí vive en el repo:

- `drafts/unidad-1.reconstruccion.md` — reconstrucción didáctica de la U1
- `drafts/situaciones-comunicacionales.md` — transcripción de los 4 cómics
- `content/en1/unit-*.json` — los átomos, que son obra derivada y reescrita

Es decir: **si no tenés los PDFs, igual podés desarrollar la app.** Solo los necesitás si vas a
curar contenido nuevo o verificar una transcripción contra el original.

## Nota sobre el contenido derivado

Los átomos de `content/` son una reelaboración pedagógica: texto reescrito, erratas corregidas,
diálogos sintéticos, narrativas propias para los listenings (que el material no incluye).
No son una copia del PDF. Aun así, el proyecto es material de estudio sin fines comerciales.
