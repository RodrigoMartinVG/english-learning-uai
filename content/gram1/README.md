# Gramática inglesa — `gram1` (scaffold)

Carpeta preparada para la materia **Gramática inglesa** (misma jerarquía que un nivel
de inglés: es un `course` más). Todavía **sin contenido**: en la landing aparece como
**"Próximamente"** hasta que se agregue el primer `unit-*.json`.

## Cómo activarla

1. Dejá `unit-N.json` acá con `"course": "gram1"` y átomos id `gram1.uM.KIND.NNN`.
   Las "unidades" acá pueden ser bloques temáticos (tiempos verbales, condicionales…)
   en vez de las unidades del libro de inglés.
2. Generá su audio: `npm run build:audio` (+ reiniciar dev server).
3. Aparece sola en la landing — el motor es *course-agnostic*, consume los átomos por
   su campo `course` sin distinguir la materia.

Registro ya listo en `content/courses.json` (`gram1`) y en `COURSES`
(`content/schema.ts`). Para sumar más niveles de gramática: `gram2`, `gram3`, … con el
mismo patrón. Runbook: [`MANIFIESTO-NIVELES.md`](../../MANIFIESTO-NIVELES.md).
