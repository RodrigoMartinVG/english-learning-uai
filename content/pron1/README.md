# Pronunciación — `pron1` (scaffold)

Carpeta preparada para la materia **Pronunciación** (un `course` más, misma jerarquía
que los niveles de inglés). Todavía **sin contenido**: en la landing aparece como
**"Próximamente"** hasta que se agregue el primer `unit-*.json`.

## Cómo activarla

1. Dejá `unit-N.json` acá con `"course": "pron1"` y átomos id `pron1.uM.KIND.NNN`.
   Encaja muy bien con la mecánica de **pares mínimos** (`contrast`) y con shadowing.
2. Generá su audio: `npm run build:audio` (+ reiniciar dev server). La pronunciación
   se apoya fuerte en el audio pregenerado, así que revisá la cobertura.
3. Aparece sola en la landing (motor *course-agnostic*, por campo `course`).

Registro ya listo en `content/courses.json` (`pron1`) y en `COURSES`
(`content/schema.ts`). Runbook: [`MANIFIESTO-NIVELES.md`](../../MANIFIESTO-NIVELES.md).
