# Spec del curso de Vocabulario — plantilla y convenciones

Este `spec/` **reemplaza al `material/`** de inglés: es la **fuente de verdad** del
curso, contenido **original nuestro** (por eso va commiteado, al revés que los PDF con
derechos). El flujo es:

> **Índice** (`borrador-curso-vocabulario.md`) → **spec por unidad** (acá) → *revisás y
> aprobás* → genero `content/voc1/unit-*.json` → `npm run build:audio` → verifico.

**Regla de oro:** ninguna palabra sin su **oración de ejemplo**. La palabra suelta no se
aprende; la oración es la que se sintetiza en audio y la que fija el sentido.

**Receta base elegida: Rica (~6 átomos/palabra)** — lexema (reconocer) + oración de
ejemplo (en varias skills) + colocaciones + miembros de la familia como lexemas propios +
participación en unidades de patrones/precisión. Escala estimada: ver
[`INVESTIGACION-cantidades.md`](./INVESTIGACION-cantidades.md). *(La receta puede
aligerarse en la cola larga B2+/especialización si el footprint lo pide.)*

---

## La ficha de una palabra

Cada entrada es un bloque `###` con estos campos. Los marcados *(opc.)* pueden faltar.

```
### <palabra> · <pos> · <CEFR>
- **Gloss (ES):** <traducción/es; separá sentidos con ;>
- **Ejemplo:** *<oración EN>* — <traducción ES>
- **Colocaciones:** <a · b · c>            (opc.)
- **Familia:** <derivados>                 (opc.)
- **Registro:** neutral | formal | informal
- **Matices/sinónimos:** <sinónimo (matiz)>   (opc.)
- **UK/US:** <uk / us>                     (opc.)
- **Práctica:** 🔁 y/o 🗣
- **Notas:** <cross-ref a otra unidad, trampa, polisemia…>  (opc.)
```

### Valores permitidos
- **pos:** `noun` · `verb` · `adjective` · `adverb` · `preposition` · `phrase`.
- **CEFR:** `A1` `A2` `B1` `B2` `C1`. Es el eje de la espiral: ordena qué entra antes.
- **Práctica:** `🔁` reconocer (mecánica *Vocabulario*/`word-focus`) · `🗣` producir
  (*Al inglés*/`es-to-en`). La mayoría del núcleo es 🔁🗣.
- **Registro:** por defecto `neutral`; marcá solo si se desvía.

### Convenciones
- **Ejemplos:** cortos, naturales, del nivel de la unidad. Nada de oraciones que
  metan gramática muy por encima del CEFR de la palabra.
- **Colocaciones:** 2-4, las más frecuentes. Si una merece audio propio, se vuelve su
  propia frase (`phrase`) en el JSON; si no, es solo texto de referencia.
- **Cross-refs:** si la palabra se retoma en otra dimensión (polisemia, confusables,
  patrones), anotalo en **Notas** para no duplicar y para enlazar.
- **id en el JSON:** `voc1.uN.lx.NNN` (lexeme) y su ejemplo `voc1.uN.p.NNN` (phrase).

---

## Extensión de schema que esto necesita (propuesta, aún no implementada)

Hoy `lexemeAtomSchema` tiene `word, pos, gloss, examplePhraseId, focus, variantOf`.
La ficha rica pide agregar (todo **opcional**, no rompe el contenido existente):

```ts
// en lexemeAtomSchema
cefr: z.enum(['A1','A2','B1','B2','C1']).optional(),
register: z.enum(['neutral','formal','informal']).optional(),
collocations: z.array(z.string()).optional(),
family: z.array(z.string()).optional(),
nuance: z.array(z.string()).optional(),   // "establish (más formal)"
```

- **CEFR** también puede alimentar el orden del "ladder" (qué se descubre antes).
- **Colocaciones/familia** como `string[]` para la v1 (sin audio); las que merezcan
  audio se modelan como `phrase` aparte.
- **Receptivo/productivo** NO es campo: ya lo define la mecánica (word-focus vs es-to-en).

Se implementa **después** de cerrar el formato con la unidad piloto (U0.1).
