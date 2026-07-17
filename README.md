# Oda Language Hub

App de entrenamiento auditivo y oral sobre el material oficial de **Inglés I (UAI)**, diseñada
para escalar a Inglés II, III y IV sin refactor.

> **Estado: Fase 0 — cimientos de contenido.** Todavía no hay aplicación. Primero existen los
> datos, después la UI. Ver el roadmap en `ARQUITECTURA.md` §11.

## Por dónde empezar

**Leé `ARQUITECTURA.md`.** Es la fuente de verdad del diseño. Todo lo demás deriva de ahí.
**`BACKLOG.md`** tiene el estado: qué está hecho, qué falta y qué es deseable.

La idea central, en una línea: *el contenido no son ejercicios, son átomos con metadatos, y las
mecánicas son funciones que los consumen.* Por eso agregar una unidad no toca código, y agregar
una mecánica no toca contenido.

## Estructura

```
ARQUITECTURA.md      ← fuente de verdad del diseño. Empezá acá.
material/            ← PDFs oficiales de la cátedra. INTOCABLES. Solo lectura.
drafts/              ← artefactos humanos intermedios (curación de contenido)
  PROMPT_EXTRACCION.md            · el prompt que convierte un PDF en reconstrucción
  unidad-1.reconstruccion.md      · salida curada de ese prompt para la U1
  situaciones-comunicacionales.md · transcripción de los 4 cómics (contenido no textual)
  _archive/                       · borradores superados. Ver aviso adentro.
content/             ← fuente de verdad del CONTENIDO (JSON validado con Zod)
  schema.ts            · la ley
  speakers.json        · los personajes y sus voces
  en1/unit-*.json      · los átomos de cada unidad
scripts/             ← pipeline: extraer PDF, validar contenido, generar audio
src/                 ← la aplicación (React + TS + Vite)
public/              ← assets estáticos (audio generado, imágenes del material)
```

**Regla de oro:** `content/` y `src/` no se conocen. El contenido no importa código; el código no
hardcodea contenido. Alguien puede escribir la Unidad 5 sin abrir `src/`.

## El pipeline de contenido

```
material/*.pdf
   │  scripts/extract-pdf.ts  (+ lectura visual de los cómics)
   ▼
drafts/*.reconstruccion.md     ← humano-editable, se cura a mano
   │  curación manual
   ▼
content/en1/unit-N.json        ← átomos validados
   │  scripts/validate-content.ts   (Zod + integridad referencial)
   │  scripts/build-audio.ts        (TTS incremental por hash)
   ▼
la app
```

El cuello de botella real de este proyecto es la curación de contenido, no el código.

## Comandos

```bash
npm run check                     # typecheck + validación de contenido. Corré esto siempre.
npm run validate                  # solo el contenido: forma (Zod) + integridad referencial
npm run typecheck                 # solo los tipos

npm run build:audio -- --dry-run  # qué audio falta y cuánto cuesta, sin sintetizar
npm run build:audio               # sintetiza lo que falta (Kokoro, local, sin credenciales)
npm run build:audio -- --force    # re-sintetiza todo
```

## El audio

Se genera en build-time con **Kokoro-82M** —un modelo neuronal Apache-2.0 que corre **local**—
y se sirve como mp3. **No hace falta ninguna API key, ni cuenta, ni conexión** (más allá de la
primera descarga del modelo, ~90 MB).

La Web Speech API queda solo como fallback en runtime. No como fuente: su voz depende del sistema
operativo del usuario, y la app entrena el oído — la Unidad 1 no puede sonar distinta en cada
máquina.

```bash
npm run build:audio     # ~23 min la primera vez; después solo lo que cambió
```

Medido: la Unidad 1 son 246 emisiones, ~5 MB de mp3. El build es incremental por hash de
`texto + voz + velocidad`, así que cambiar una frase regenera un archivo, no cuatrocientos.
Los mp3 no se versionan (`.gitignore`); el manifest sí, porque es el cache que hace posible
ese incremental.

**Límite conocido:** Kokoro solo tiene voces en-US y en-GB, así que los personajes con acento
no nativo (Pedro portugués, Valentina rusa) suenan estadounidenses. Si querés esos acentos,
`--provider=azure` los restituye — necesita `.env`, y no cambia nada del contenido. Ver
`ARQUITECTURA.md` §5.4.

## Decisiones ya tomadas

React + TypeScript + Vite · audio pregenerado con Azure Neural (entra en el free tier, costo $0)
con Web Speech API de fallback · local-first sobre IndexedDB, deploy estático, sin backend ·
FSRS para repetición espaciada.

Justificación completa en `ARQUITECTURA.md` §0 y §5.4.

## Convenciones no negociables

1. **Los ids de átomo son estables de por vida.** El progreso del alumno apunta a esos ids.
   Nunca se reusan ni se reordenan.
2. **Todo átomo declara su origen**: `extracted` | `synthetic` | `corrected`. Sin excepción.
3. **El contenido nunca hereda una errata del PDF, pero registra que existe** (`sourceNote`).
   El alumno rinde con la cátedra: tiene que saber qué espera la grilla *y* qué es correcto.
4. **El audio nunca es el único canal de información.** Siempre hay forma de ver el texto.
