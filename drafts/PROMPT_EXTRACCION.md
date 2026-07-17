Rol: sos un diseñador de contenido educativo especializado en apps de entrenamiento auditivo
de idiomas (decodificación por oído, shadowing, emparejamiento fonético). No sos traductor ni
resumidor: tu trabajo es RECONSTRUIR el material fuente en un formato que después otra persona
pueda convertir en ejercicios de escucha y habla, sin perder nada útil del original.

Material fuente:
[PEGAR ACÁ EL PDF / TEXTO / TRANSCRIPCIÓN DE LA UNIDAD]

Tarea:
Analizá el material fuente y reorganizalo en un documento markdown con las siguientes secciones.
No generes JSON ni ninguna estructura de datos rígida — el objetivo es un documento legible y
editable a mano, porque todavía no está definido cómo se va a modelar esto en la app.

1. INVENTARIO DE CONTENIDO
   Antes de reorganizar nada, listá qué tipos de contenido hay en el material (explicación
   gramatical, diálogo, preguntas y respuestas, vocabulario suelto, ejercicios de completar,
   ejercicios de reordenar, producción libre larga, comprensión auditiva narrativa, etc.).
   Para cada tipo, decime en qué parte del material aparece y cuántas instancias hay.
   Si encontrás un tipo de contenido que no está en esta lista, agregalo.

2. SCRIPTS DE DIÁLOGO
   Para cada situación comunicativa del material (diálogos ya existentes en el texto, o
   situaciones que se pueden inferir de los ejemplos gramaticales sueltos), armá un script
   de diálogo completo con hablantes identificados (A/B o nombres si el material los da).
   Reglas:
   - Usá únicamente vocabulario y estructuras que aparecen en el material fuente. No inventes
     palabras nuevas fuera del léxico ya visto en la unidad.
   - Si un punto gramatical del material aparece solo como oraciones sueltas (sin diálogo),
     construí un diálogo breve y natural (4-8 líneas) que las agrupe en contexto.
   - Marcá qué estructura gramatical o función comunicativa practica cada diálogo.
   - Después de cada script, listá 2-3 variantes naturales de cómo se podría preguntar o decir
     lo mismo (otras formas de la misma intención comunicativa), si el material las sugiere o
     son razonables de inferir.

3. BATERÍAS DE PREGUNTA Y RESPUESTA
   Agrupá todo el contenido que tenga forma de "pregunta con respuesta corta predecible"
   (entrevistas, ejemplos significativos, datos personales) en listas de la forma:
     Pregunta: ...
     Variantes de la pregunta: ...
     Respuesta(s) natural(es): ...
     Categoría/función: ...
   Agrupá estas baterías por tema (datos personales, lugar de trabajo, posesión, etc.), no las
   dejes todas mezcladas.

4. FRAGMENTOS DESCRIPTIVOS Y DE PRODUCCIÓN LARGA
   Identificá todo lo que sea producción libre o extendida (describir una imagen, presentarse,
   narrar) y para cada uno documentá:
   - La consigna original tal como aparece en el material.
   - El banco de palabras o estructuras que el material sugiere usar (si lo da).
   - Un ejemplo de respuesta modelo, extenso y natural, escrito por vos, que use ese banco.
   - Qué estructuras gramaticales de la unidad se pueden practicar con ese ejercicio.
   No conviertas esto en preguntas cerradas — tiene que quedar como texto libre, porque es
   contenido de producción, no de repetición.

5. VOCABULARIO SUELTO
   Listá el vocabulario que aparece sin oración de contexto. Para cada palabra agregá una
   oración de ejemplo natural (usando solo estructuras ya vistas en la unidad) para que no
   quede aislada, y anotá si el material sugiere trabajarla con deletreo, pronunciación,
   traducción u otra cosa.

6. EJERCICIOS ESTRUCTURALES (completar, reordenar, puntuar)
   Para cada ejercicio de este tipo en el material fuente, reescribilo en un formato legible:
   - Enunciado / consigna original.
   - Los ítems, con su respuesta correcta (usá la grilla de corrección si el material la trae).
   - Una nota corta sobre si ese ejercicio se presta a una versión auditiva/oral, o si es
     inherentemente un ejercicio de texto/escritura.

7. NOTAS PARA DISEÑO DE MECÁNICAS
   Cerrá con una sección breve, en prosa, con:
   - Qué contenido de este material no encaja bien en las mecánicas de escucha/repetición
     habituales, y por qué.
   - Qué contenido se repite o se solapa entre secciones (para evitar duplicar ejercicios).
   - Un orden sugerido de dificultad, de más guiado a más libre, basado en cómo el propio
     material fuente progresa.
   - Cualquier ambigüedad o dato faltante que haya encontrado en el material original.

Restricciones generales:
- No resumas de más: preferí extraer y reorganizar contenido real del material antes que
  generalizar o sintetizar.
- No inventes contenido pedagógico nuevo salvo cuando la tarea lo pide explícitamente
  (diálogos sintéticos, oraciones de ejemplo de vocabulario, respuestas modelo) — y en esos
  casos, avisá explícitamente qué fue generado y qué es extraído tal cual del original.
- Escribí todo en español para las instrucciones/metadatos y en inglés para el contenido
  de idioma (tal como está en el material fuente), salvo que el material fuente sea de otro
  idioma objetivo.
- El resultado tiene que poder leerse de corrido como documento de referencia, no como una
  base de datos.