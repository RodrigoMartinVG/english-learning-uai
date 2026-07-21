# Plan — "Creá tu propio guion" (producción libre guiada con transcripción en vivo)

> Estado: **diseño aprobado, listo para construir.** Decisiones tomadas por el usuario:
> feedback = **transcript en vivo + coincidencias en verde**; requisito: **poder escuchar lo grabado**;
> grabaciones **solo durante la sesión**; vocabulario del verde **derivado automáticamente** (sin curar).

---

## 1. Qué es y por qué

El complemento natural de **Reconstruir el guion**. Ahí *recuperás* el modelo (el andamiaje te da
los fragmentos). Acá **producís el tuyo**, con tus palabras, guiado por **las mismas preguntas**.
Es el verdadero techo de la escalera: producción libre, pero sostenida por un esqueleto de preguntas
para que no sea el vacío del examen en frío.

---

## 2. Lo que YA tenemos (por qué el desafío técnico está casi resuelto)

| Pieza | Estado | Dónde |
|---|---|---|
| **Transcripción en vivo** (resultados interinos mientras hablás) | ✅ existe | `Recognition.ts` (`onInterim`), ya usado en el Examen Oral con `continuous: true` |
| **Grabar y reproducir tu voz** | ✅ existe | `Recorder.ts` → devuelve un `Recording` con `.url`; el "🎤 Vos" del `SpeakPanel` ya lo reproduce |
| **Las preguntas guía** (`steps`) | ✅ existe | 14 producciones ya tienen `steps` |
| **Vocabulario esperado del tema** (para el verde) | ✅ derivable | los `lexeme` del aspecto + palabras clave de la `rubric`/`modelAnswer` |

**Conclusión:** no hace falta tecnología nueva. Se compone lo existente.

---

## 3. Flujo — forma "pregunta-respuesta" (el núcleo)

Por cada `step` de la producción:
1. Aparece la **pregunta guía** (texto + audio, voz del examinador).
2. Tocás 🎙 y **hablás tu respuesta**. Mientras hablás, el **transcript se escribe en vivo**, con las
   palabras que coinciden con el vocabulario del tema **en verde** (ver §4).
3. Al parar, se guarda **tu respuesta**: el texto transcripto **y la grabación de tu voz**.
4. Botón ▶ para **escucharte** en ese paso. Botón para **rehacer** el paso.
5. Siguiente pregunta. Tu guion se va armando abajo con *tus* palabras.

Al final:
- **Tu guion completo** (tus respuestas encadenadas).
- ▶ **Escuchar toda tu producción** (tus grabaciones, en secuencia).
- Comparar con la **versión modelo** (opcional, como red — no como respuesta).

---

## 4. Feedback de inteligibilidad: transcript + verde

- El **transcript en vivo** es la señal honesta: si el reconocedor escribe bien lo que decís, se te
  entiende; si lo garabatea, ahí está el aviso. Sin puntaje de pronunciación inventado.
- Encima, **pinto en verde** las palabras del transcript que coinciden con lo **esperado del tema**:
  - Fuente de "lo esperado": los `lexeme` del aspecto + las palabras clave de la `rubric` y del
    `modelAnswer` del script. **Derivado, no hay que curarlo a mano.**
  - Da un "vas bien / estás usando el vocabulario del tema" explícito, sin fingir que evalúa acento.
- Comparación normalizada (misma `normalize()` del grading): contracciones, números, etc.

---

## 5. Escuchar lo grabado (requisito)

- Cada respuesta guarda su `Recording` (blob + URL). **▶ por paso** y **▶ del guion entero**.
- Al final, se puede **descargar** o simplemente reproducir tu producción completa.
- **Persistencia — DECIDIDO: solo durante la sesión.** Grabás, te escuchás y comparás dentro de la
  sesión; al salir se descartan (blobs en memoria + `URL.createObjectURL`, revocados al salir). Cero
  infraestructura extra. (Guardar entre sesiones con IndexedDB queda como mejora futura opcional.)

---

## 6. Las otras formas (después del núcleo)

- **Role-play:** para el contenido con diálogo (ya hay diálogos en U1-5). Tomás un papel; el otro lo
  pone la app. Tu papel se graba y transcribe en vivo.
- **Dictado interpretado:** hablás de corrido (monólogo) con el esqueleto de preguntas a la vista y
  se transcribe todo — como el Examen Oral, pero centrado en *tu* creación y con el verde.

---

## 7. El capstone: "dictado final" por unidad / módulo

Producción libre de mayor alcance, con `scope` de **unidad** o **módulo (aspecto)**:
- Consigna abierta sobre el tema de la unidad; transcript en vivo + **cobertura** (qué vocabulario y
  estructuras de la unidad usaste, resaltadas en verde) → un "cuánto del tema activaste".
- Se enlaza con el hilo **"My Life"** (backlog §3.3): tu monólogo del final oral, que crece unidad a
  unidad. El capstone de la U4 = las 4 partes juntas.

---

## 8. Modelo de datos

**Probablemente NO hace falta contenido nuevo.** Reusa:
- `production.steps` → las preguntas guía.
- `lexeme`s del aspecto + `rubric`/`modelAnswer` → el set esperado para el verde.

Opcional (si querés curar el vocabulario esperado por script en vez de derivarlo):
- un campo `production.expectedWords?: string[]`. Aditivo. **Recomiendo derivar** y no curar, salvo
  que en la práctica el verde marque de más/de menos.

---

## 9. Mecánica / UI y cambios de código estimados

- **Modo nuevo del `script-builder`** con un toggle en el arranque: **Reconstruir** / **Crear el tuyo**.
  Comparten los `steps`; cambia el camino de cada paso (revelar vs. grabar+transcribir).
- Nuevo componente **`LiveDictation`** (o extender `SpeakPanel`): micrófono + transcript interino con
  resaltado verde + reproducción de la toma. Reusa `Recognition` y `Recorder`.
- Helper de **resaltado**: tokeniza el transcript y marca los tokens presentes en el set esperado.
- `content/schema.ts`: opcional `expectedWords` (si se decide curar). Nada obligatorio.
- Persistencia de texto del guion del usuario: `localStorage` (opcional). Grabaciones: sesión o
  IndexedDB según §5.

---

## 10. Límites honestos

- **Web Speech**: solo Chrome/Edge, pide micrófono, es de nube. Ya es el caso de todo el micrófono de
  la app; no es un límite nuevo.
- **El verde no evalúa acento** — mide "se te entendió + usaste el vocabulario". Es a propósito
  (ningún navegador puntúa pronunciación; ver AudioService.ts).
- **Grabaciones entre sesiones**: requieren IndexedDB (blobs no van en localStorage).

---

## 11. Plan de construcción (después de aprobar)

1. `LiveDictation` (micrófono + transcript en vivo con verde + reproducir la toma).
2. Modo "Crear el tuyo" en `script-builder` (toggle), forma pregunta-respuesta, sobre el Texto 2.
3. Escuchar el guion entero (secuencia de tomas).
4. Revisión con vos.
5. Formas role-play y dictado interpretado.
6. Capstone "dictado final" por unidad (+ hilo My Life).

---

## 12. Decisiones tomadas

- **Persistencia de las grabaciones:** ✅ **solo durante la sesión** (§5).
- **Vocabulario esperado (verde):** ✅ **derivado automáticamente** de los `lexeme` del aspecto + la
  `rubric`/`modelAnswer` del script. Sin curado a mano. Si en la práctica marca de más/de menos, se
  ajusta la derivación (no el contenido).
