# Inglés 4 — `en4` (scaffold)

Carpeta preparada para el **nivel 4 de inglés**. Todavía **sin contenido**: aparece
como **"Próximamente"** en la landing hasta que se agregue el primer `unit-*.json`.

## Cómo activarlo

1. Dejá `unit-N.json` acá con `"course": "en4"` y átomos id `en4.uM.KIND.NNN`.
2. `npm run build:audio` (+ reiniciar dev server).
3. Aparece solo en la landing (glob de `src/data/content.ts`, sin tocar código).

Registro ya listo en `content/courses.json` y `COURSES` (`content/schema.ts`).
Runbook: [`MANIFIESTO-NIVELES.md`](../../MANIFIESTO-NIVELES.md).
