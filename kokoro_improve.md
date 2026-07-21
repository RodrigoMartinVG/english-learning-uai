# Informe Técnico: Resolución de Entonación en Preguntas de Sí/No usando Kokoro TTS

## 1. Resumen Ejecutivo del Problema

Kokoro es un modelo de síntesis de voz (TTS) altamente eficiente (~82M de parámetros) basado en *flow-matching*. Su limitación con las preguntas de "Sí/No" (preguntas polares que requieren entonación ascendente) no es un defecto de calidad de audio, sino un problema arquitectónico: Kokoro depende de un fonemizador externo (como `espeak-ng` o `misaki`). Al carecer de un motor avanzado de inferencia semántica que lea la oración completa por adelantado, el fonemizador procesa el texto de forma lineal. Cuando encuentra el signo de interrogación al final de la cadena, ya ha asignado una prosodia plana o descendente al resto de la oración.

A continuación, se detallan tres soluciones para implementar directamente sobre el *pipeline* local de Kokoro, evaluando la calidad acústica y la viabilidad técnica de cada una.

---

## 2. Soluciones Implementables y Evaluación de Calidad

### Solución A: Interceptación y Modificación a Nivel de Fonemas (IPA)

En lugar de pasar texto plano a la API de Kokoro, se divide el proceso en dos etapas: primero se extraen los fonemas y luego se modifican antes de inyectarlos al modelo acústico.

* **Mecanismo:** Se genera la cadena de fonemas en Alfabeto Fonético Internacional (IPA). Mediante programación, se detectan oraciones que inician con auxiliares (*Do, Is, Are, Can*) y se inyectan modificadores de acento o de tono ascendente (como las flechas de tono `↑` o marcadores de estrés específicos de espeak) en los últimos *tokens* del arreglo.
* **Calidad Conseguida:** **ALTA.**
* *Pros:* Es la solución más determinista. Altera directamente las instrucciones acústicas que recibe el modelo, generando una curva ascendente natural sin alterar la velocidad de la frase.
* *Contras:* Requiere escribir una capa intermedia lógica (en Python, Rust, o el lenguaje del *stack* utilizado) para parsear y manipular el arreglo de tokens fonéticos de manera precisa.



### Solución B: Preprocesamiento Heurístico de Cadenas (Text Hacking)

Consiste en implementar un *middleware* de expresiones regulares que intercepte el texto (el `string` puro) antes de que llegue a Kokoro, aplicando alteraciones gramaticales diseñadas para "engañar" al fonemizador.

* **Mecanismo:** Un script detecta la pregunta polar y aplica modificaciones como:
* *La coma táctica:* `Are you going to the, party?` (Fuerza una micro-pausa y recalcula el tono).
* *Alargamiento vocal:* `Are you readyyy?`
* *Múltiples signos:* `Are you sure?!`


* **Calidad Conseguida:** **MEDIA / INCONSISTENTE.**
* *Pros:* Implementación trivial (un simple RegEx en la entrada de texto). Cero impacto en el rendimiento.
* *Contras:* La calidad acústica varía drásticamente según la voz utilizada. La coma táctica a menudo genera una pausa respiratoria robótica antes de la última palabra, rompiendo la cadencia natural (el *flow*). El alargamiento vocal puede inducir artefactos metálicos en el audio.



### Solución C: Fusión de Tensores (Voice Blending)

Aprovechar la capacidad de Kokoro de promediar los *embeddings* (pesos) de diferentes voces en tiempo de carga para crear un perfil acústico más dinámico.

* **Mecanismo:** Se toma el tensor de la voz deseada (que suele ser plana o corporativa) y se interpola con un 20-30% de los tensores de una voz catalogada como altamente expresiva (ej. `af_bella` o `af_sky`).
* **Calidad Conseguida:** **MEDIA-ALTA (Global) / BAJA (Específica).**
* *Pros:* Mejora significativamente el rango dinámico, la calidez y la naturalidad de *todo* el texto generado.
* *Contras:* No resuelve la raíz del problema lógico. Aunque la voz sea más expresiva, el modelo sigue sin saber que debe aplicar una curva ascendente exactamente en la última sílaba de la pregunta.



---

## 3. Cuadro Comparativo

| Solución | Calidad de Entonación | Estabilidad Acústica | Complejidad de Implementación | Viabilidad para Producción |
| --- | --- | --- | --- | --- |
| **A. Nivel de Fonemas** | Alta y determinista | Excelente (sin artefactos) | Media (Manipulación de Arrays/IPA) | **Recomendada** |
| **B. Preprocesamiento** | Inconsistente | Regular (Riesgo de pausas raras) | Baja (Regex simple) | Solo como parche temporal |
| **C. Fusión de Tensores** | No soluciona el patrón | Alta (Mejora el audio general) | Baja (Interpolación de matrices) | Complemento estético |

---

## 4. Conclusión y Recomendación de Arquitectura

Para un entorno de producción local donde el costo computacional debe mantenerse al mínimo (evitando migrar a modelos pesados de *Diffusion* o *Transformers*), la **Solución A (Interceptación a Nivel de Fonemas)** es el único camino robusto.

Se recomienda diseñar la arquitectura del servicio TTS de la siguiente manera:

1. Recibir el `string`.
2. Pasar por un analizador léxico ligero que clasifique el tipo de oración.
3. Generar los fonemas base mediante `espeak-ng`.
4. Si la oración es una pregunta de Sí/No, aplicar una función mutadora sobre los últimos *tokens* del *array* fonético.
5. Inyectar el *array* final en el modelo acústico de Kokoro.

Este enfoque mantiene la velocidad de inferencia casi instantánea de Kokoro, garantizando una prosodia correcta a nivel de sistemas sin depender de trucos de puntuación que degradan la calidad del audio.