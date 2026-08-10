# Borrador — guion de exposición del texto de entropía (en2, Unidad 5)

> Estado: **borrador, no desplegado**. Trabajo pausado el 2026-08-09 por decisión del usuario
> ("la versión que ya tenemos desplegada con audios dejémosla... dejemos el borrador guardado
> como eso, un borrador para luego irlo mejorando").
>
> Texto fuente: *Tea and nineteenth century physics*, Hannah Darken, plus.maths.org.
> `material/comun/CUADERNILLO … INGLÉS I II III & IV_UAI_2026.pdf`, págs. 14-15.
> Átomo destino si algún día se instala: **`en2.u5.pr.002`**.

---

## 1. Qué está desplegado hoy (NO tocar sin decisión)

`en2.u5.pr.002` tiene el modelo de **"dos ideas + cuatro leyes"**, con 11 `steps`, una variante
(la versión en prosa corrida) y **audio generado**. Empieza así:

> I choose text 1, 'Tea and nineteenth century physics', by Hannah Darken. First, the everyday
> fact. If you leave a hot cup of tea on a table, it always cools down…

Su esqueleto: apertura (título/autora) → hecho cotidiano → giro → **anuncio "two ideas"** →
temperatura → entropía → **anuncio "four laws"** → las cuatro → cierre que vuelve a la taza.

Calcado del modelo que el usuario ya validó para Inglés 1 (*What is a square?*), cuyo mérito es
**anunciar las listas antes de darlas**: decir "two ideas" o "four laws" te da el número, así
sabés cuántas piezas faltan mientras exponés.

---

## 2. El borrador a mejorar

### 2.1 La crítica que lo motiva

Sobre la versión desplegada, el usuario señaló —con razón— que **la sección de las leyes rompe
el hilo**: "todo viene bien y de repente se corta enunciando leyes físicas". Las cuatro leyes
entran como bloque enciclopédico y la taza desaparece de escena justo donde más se la necesita.

### 2.2 La idea de la solución

No suavizar la transición, sino **cambiar qué hace esa sección**: en vez de enunciar cuatro
leyes, hacerle **cuatro preguntas a la taza**. Cada ley pasa a ser *la respuesta* a algo que el
ejemplo ya hizo preguntar, y salen en el orden canónico sin forzar:

| Pregunta que hace la taza | Ley que la responde |
|---|---|
| ¿Cuándo deja de enfriarse? | Ley cero (equilibrio térmico) |
| ¿A dónde se fue el calor? | Primera (no se crea ni se destruye) |
| ¿Por qué la habitación no se lo devuelve? | Segunda (la entropía tiende a aumentar) |
| ¿Podría enfriarla para siempre? | Tercera (el cero absoluto como límite) |

Dos ganancias, además del hilo:

- **Un solo objeto en escena de principio a fin.** Si te perdés en el examen, la taza te devuelve
  al lugar: "¿en qué pregunta iba?" se recupera más fácil que "¿qué ley sigue?".
- **La estructura te delata si te salteaste algo.** La tercera pregunta arranca con "Remember our
  count", que no cierra si antes no definiste entropía.

### 2.3 El texto (≈450 palabras, ~3 min)

> I am going to talk about Text 1, 'Tea and Nineteenth-Century Physics', by Hannah Darken.
>
> Let's start with something simple. If you leave a hot cup of tea on a desk, it always cools
> down. It never takes heat from the room to boil again. Right now, the tea on my desk is cooling
> down. We usually ignore this, but a whole area of physics is hidden in that cup: thermodynamics,
> the theory of heat and heat flow. It was developed mostly during the nineteenth century.
>
> Before the cup can explain anything, we need two ideas: temperature and entropy.
>
> The first idea is temperature. It is easy to imagine heat as an invisible substance inside the
> cup, but that is not what it is. The text says temperature is a bulk property of molecules and
> atoms in motion. In hot tea the atoms move fast. In the cold air of the room they move very
> little.
>
> The second idea is entropy. My cup is made of many, many molecules, and they move all the time.
> If we could pause time and re-arrange them, the tea would look much the same to us. So entropy
> is a way to count: it counts how many ways we can arrange the small parts while the big picture
> stays exactly the same.
>
> Now we can go back to the cup and ask it four questions. Each answer is one of the four laws.
>
> First question: when does the tea stop cooling? When the tea, the cup and the air are all at the
> same temperature. The Zeroth Law lets us say this: if the tea is in equilibrium with the cup,
> and the cup with the air, then the tea is in equilibrium with the air.
>
> Second question: where did the heat go? The First Law answers that nothing was lost. Energy
> cannot be created or destroyed; it can only change form or be transferred. The heat is now in
> the air of the room.
>
> Third question: then why does the room never give it back? This is the Second Law, and it is the
> heart of the text. In an isolated system that is not in equilibrium, entropy tends to increase
> over time. Remember our count: there are many more ways for the energy to spread into the room
> than to stay inside the cup. So the tea cools, and it never boils again by itself.
>
> Last question: could I cool it for ever? No. The Third Law gives a limit: as temperature
> approaches absolute zero, the lowest temperature that is theoretically possible, entropy reaches
> a constant minimum.
>
> To conclude, my cold tea is not just a drink. It is the Second Law on my desk. And the same four
> answers work far beyond the cup: they are used to understand the weather, the planets, and even
> black holes. Thank you.

---

## 3. Fidelidad al texto — errores ya corregidos (no reintroducir)

El examinador tiene el texto delante. Estas derivas venían del borrador original del usuario y
**ya están corregidas arriba**; quedan documentadas para que no vuelvan.

| Deriva | Lo que dice el texto | Por qué importa |
|---|---|---|
| "in any **closed** system, entropy **always increases**" | "The entropy of an **isolated** system **not in equilibrium** will **tend to** increase" | El más serio. *Closed* e *isolated* no son sinónimos: el cerrado intercambia energía, el aislado no. Y "always increases" es falso, por eso el texto dice "tend to". En una carrera de matemática esto se caza. |
| "temperature is just **matter in motion**" | "temperature is a **bulk property** of molecules and atoms in motion" | *Bulk property* está **subrayado** en el original: es el término técnico que el texto elige. |
| "the science of **heat and energy**" | "the theory of **heat and heat flow**" | Menor, pero *heat flow* es la frase del texto. |
| "At absolute zero, **all movement stops**" | "**As** temperature **approaches** absolute zero… entropy approaches a constant **minimum**" | "Todo movimiento se detiene" es un mito (queda energía de punto cero) y no está en el texto, que además lo plantea como límite, no como estado alcanzado. |
| "made of **millions** of molecules" | "many, many molecules" | Ante matemáticos, "millones" queda corto por ~20 órdenes de magnitud. La vaguedad del original es más segura. |
| "If we **can** pause time and change… still **looks**" | "the tea **would** look much the same if we **re-arranged** them" | El texto usa segundo condicional, que además es estructura de Level 2. |

## 4. Licencias tomadas (no están en el texto)

Si el examinador pregunta "¿eso lo dice el texto?", la respuesta honesta es **no**:

- **El encadenado té → taza → aire** de la ley cero. El texto solo la enuncia en abstracto. Es la
  interpretación estándar de manual y es segura, pero es glosa propia.
- **La explicación estadística de la segunda ley** ("there are many more ways for the energy to
  spread into the room than to stay inside the cup"). Aporte del usuario, correcto y muy bueno: es
  la razón real de la irreversibilidad y conecta las dos ideas definidas antes. Conservar.
- **"It is easy to imagine heat as an invisible substance"** (alusión al calórico). Recurso
  didáctico propio. Está redactado como impresión del expositor, no como contenido del texto —
  mantenerlo así.

## 5. Adecuación al nivel

Las consignas post-lectura del cuadernillo revelan qué gramática evalúa Level 2:
**cuantificadores** (Texto 2), **Past Simple** (Texto 3), **Present Continuous** (Texto 4). El
Texto 1 es el único con consigna conceptual, pero se rinde en el mismo nivel.

El guion exhibe las tres: past simple y pasivas (*was developed*), cuantificadores (*many, many*),
y present continuous (*the tea on my desk is cooling down*, agregado a propósito en el gancho).

---

## 6. Qué hacer el día que se retome

1. Decidir si reemplaza al modelo desplegado o entra como **variante** (dos maneras de contar el
   mismo texto, que el "Armá el guion" ya sabe mostrar y comparar).
2. Partir el texto en `steps` **por bloque del esqueleto** — apertura, hecho, giro, anuncio de las
   dos ideas, idea 1, idea 2, anuncio de las cuatro preguntas, una por pregunta, cierre. Rondaría
   los 12-13 pasos. Es lo que hace que el shadowing te lo haga copiar en ese orden.
3. Verificar por script que **la concatenación de los `segment` reconstruye el `modelAnswer`
   exactamente**. Si divergen, el shadowing enseña un texto distinto del que después hay que decir.
4. Actualizar la `rubric` para detectar la **estructura** (¿anunciaste las dos ideas?, ¿las cuatro
   preguntas?, ¿cerraste volviendo a la taza?), no solo el contenido.
5. Regenerar audio: `npm run build:audio -- --only=en2.u5.pr.002 --no-alts` (~35 clips, ~20 min).
   Los del modelo anterior quedan huérfanos; los poda una corrida completa.

### Trampas conocidas

- **`normalize()` pasa los números escritos a dígitos** ("two" → "2"). Un `detect` con `\btwo
  ideas\b` falla contra su propio modelo; hay que escribir `\b(two|2) ideas\b`. El validador lo
  caza, pero cuesta entender el error si no se sabe.
- **No editar este JSON con `node -e "…"` desde bash**: el escape del shell convierte `\\b` en el
  carácter de control backspace (0x08) y el regex queda roto de una forma difícil de ver. Usar un
  archivo `.mjs` con `String.raw`.
