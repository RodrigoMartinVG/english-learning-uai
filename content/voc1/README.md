# Vocabulario — `voc1` (scaffold)

Materia de **vocabulario** (un `course` más, misma jerarquía que los niveles de
inglés). Todavía **sin contenido**: en la landing aparece como **"Próximamente"**
hasta que se agregue el primer `unit-*.json`.

El índice temático en discusión está en `borrador-curso-vocabulario.md` (raíz del
repo). Encaja con las mecánicas existentes: **Vocabulario** (`word-focus`,
reconocimiento), **Al inglés · escribir/decir** (`es-to-en`, producción),
**Completar** (`cloze`, colocaciones) y **Pares mínimos** (`contrast`).

## Cómo activarlo

1. Dejá `unit-N.json` acá con `"course": "voc1"` y átomos id `voc1.uM.KIND.NNN`.
   Para vocabulario, el átomo típico es `lexeme` (palabra + gloss + oración de
   ejemplo) y `phrase` (colocación/expresión); nunca una palabra sin su contexto.
2. `npm run build:audio` (+ reiniciar dev server).
3. Aparece solo en la landing (motor *course-agnostic*, por campo `course`).

Registro ya listo en `content/courses.json` (`voc1`) y en `COURSES`
(`content/schema.ts`). Runbook: [`MANIFIESTO-NIVELES.md`](../../MANIFIESTO-NIVELES.md) §8.
