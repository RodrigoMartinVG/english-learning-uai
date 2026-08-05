# Inglés 2 — `en2` (scaffold)

Carpeta preparada para el **nivel 2 de inglés**. Todavía **sin contenido**: en la
landing aparece como **"Próximamente"** (card deshabilitada) hasta que se agregue el
primer `unit-*.json` acá.

## Cómo activarlo

1. Dejá uno o más `unit-N.json` en esta carpeta (ej. `unit-1.json`), con
   `"course": "en2"` y átomos con id `en2.uM.KIND.NNN`.
2. Generá su audio: `npm run build:audio` (y reiniciá el dev server).
3. Listo: aparece solo en la landing (el glob de `src/data/content.ts` la levanta;
   cero cambios de código).

El registro del curso (nombre visible, orden) ya está en `content/courses.json`, y su
id `en2` en `COURSES` (`content/schema.ts`).

Ver el runbook completo en [`MANIFIESTO-NIVELES.md`](../../MANIFIESTO-NIVELES.md).
