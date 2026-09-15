# S116-B · LOTE 15 — recorrido 5: el abanico, la píldora de la rejilla, y **el oscuro**

**Rama `pista/s116-b-05`.**

**Gates:** `verify:diseno` VERDE (81) · `verify:contrast` **469/0** (tres pares nuevos) · `verify:catalogo-v5` VERDE · `verify:reduced-motion` VERDE · `tsc` 0 en las cuatro.

---

## ① EL ABANICO — la pastilla no corta, y las etiquetas son de una palabra

**(a) La pastilla.** Llevaba `numberOfLines={1}`: cuando la fila no entraba, **el que cedía era el texto** («Pregúnt…», «Anotar s…», «Cargar s…»). Ahora **se ajusta al texto** y lleva `flexShrink: 0` para que la fila no la comprima.

> ⚠️ **Truncar era la peor de las tres salidas posibles, y por eso no alcanzaba con agrandar la pastilla:** un atajo cortado **no se lee mal — se lee OTRA COSA**, y el dedo decide sobre una palabra a medias.

**(b) Los textos, y dónde estaban:**

| clave | estaba | queda |
|---|---|---|
| `nexo.atajo_peso` | «Anotar su peso» | **Peso** |
| `nexo.atajo_vacuna` | «Cargar su carné» | **Vacuna** |
| `nexo.atajo_antiparasitario` | «Anotar un antiparasitario» | **Antiparasitario** |
| `nexo.atajo_foto` | «Guardar un recuerdo» | **Recuerdo** |
| `nexo.preguntar` | «Pregúntale a Nexo» | **sin cambio** |

**Vivían en `apps/cliente/src/i18n/es.ts:104-107` y `en.ts:59-62`** (territorio de C, tocado con tu autorización), **y la demo de `TokenGallery.tsx:4140`** era la que yo había escrito. En inglés: Weight · Vaccine · Dewormer · Memory.

☠️ **Y se retira el argumento que las sostenía**, que estaba escrito ahí: *«voz de ACTO, no de sustantivo: la familia no va a "peso", va a anotar su peso»*. **Lo derogó el aparato** — *el acto lo dice el glifo que va al lado; la palabra sólo tiene que nombrar la cosa.*

---

## ② LA PÍLDORA DE LA REJILLA

`Boton` gana **`tamaño="xs"`**: alto **30**, letra **un escalón menos** (`size.xs`), padding lateral menor. La tarjeta lo usa con `bloque` (ancho de la tarjeta) y gana **`paddingBottom`** — el aire de abajo.

⚠️ **Bajó la CAJA, no sólo el botón:** `ALTO_STEPPER_ANCHO` (34 → **30**), porque `Mutacion` comparte esa caja entre el «Agregar» y el stepper. *Dos formas que se turnan en la misma caja tienen que medir lo mismo o la tarjeta salta al tocar* (L-284). **El blanco táctil sigue en 44 por `hitSlop`: se achica el píxel, no el target.**

---

## ③ EL OSCURO — lo que curé, y por qué NO era donde parecía

🔴 **El borde del disco y el fondo de la barra YA salen del tema, medido en la fuente:**

```
BarraTabs.tsx:659   colorBarra = theme.bg.card
BarraTabs.tsx:660   colorDisco = theme.accent.activoLleno
dark.ts:36          bg.card = ciruelaProfunda #3B0B47      ← NO es blanco
dark.ts:95          accent.activoLleno = magentaLuz        ← el «rosa pálido»
```

**Y el borde del disco no es un color: es AUSENCIA de material** (`fillRule="evenodd"`), así que **muestra el fondo real de la pantalla que hay detrás**. ⇒ *si se ve blanco, lo blanco está detrás de la barra, no en la barra.*

> **El síntoma es de la barra y la causa es de la pantalla** — y eso explica el tercer síntoma que trajiste en la misma frase: *«la tarjeta del Hogar queda ciruela sobre ciruela»*. **Es el mismo eje: superficies que no cambian con el tema, o que cambian a un color que nadie previó.**

### 🔴 LA CLASE, encontrada y capturada: `'inverso'` sobre una superficie que NO cambia

**`text.inverse` es blanco en claro y TINTA en oscuro.** *No significa «sobre fondo oscuro»: significa «al revés del tema».* Sobre una superficie que es **la misma en los dos temas** (la franja magenta, la banda ciruela), acierta en claro **por casualidad** y falla en oscuro.

**Capturado:** `lote15-oscuro-bienvenida-ilegible.png` y `lote15-oscuro-login-y-onda.png` — el titular, el apoyo y la frase de la onda **desaparecen** en oscuro.

**CURADO (es de mi territorio y es el mismo defecto que firmaste en el lote 11):**
- **`Texto` gana `sobreMagenta`** — blanco fijo, medido **5,13** contra `magentaAccion`, al gate.
- **`OndaAcceso`**: la frase pasa a `sobreMagenta` (salía en tinta: **3,29**, el número que rechazaste).
- **`Personaje`**: su fondo `'blanco'` **era `theme.bg.card`** — ciruela en oscuro. *Un valor cuyo nombre dice «blanco» y en un tema no lo es no es una decisión de tema: es un nombre que miente.* ⚠️ Y tenía una segunda razón escrita en su propia cabecera: **el blanco existe para tapar el fondo blanco opaco del asset del roedor**, que en oscuro quedaba a la vista.

### EL CENSO — 15 casos, con archivo y línea (NO curados, como pediste)

**A · `'inverso'` sobre superficie fija** — *el mismo defecto que acabo de curar en la onda:*

| archivo:línea | qué dibuja | superficie |
|---|---|---|
| `packages/ui/src/components/Cabecera.tsx:209` | antetítulo | banda ciruela (fija) |
| `packages/ui/src/components/Cabecera.tsx:213` | **título** | banda ciruela (fija) |
| `packages/ui/src/components/Cabecera.tsx:217` | apoyo | banda ciruela (fija) |
| `apps/cliente/src/app/bienvenida.tsx:155` | titular | ciruela (fija) |
| `apps/cliente/src/app/bienvenida.tsx:165` | apoyo | ciruela (fija) |

🔴 **`Cabecera` es el caso grande y por eso lo pongo primero: va en TODAS las pantallas del cliente.** En oscuro su título sale en tinta sobre ciruela — es lo que se ve en la captura del login.

**B · a verificar (leen el tema, pero su superficie también cambia)** — *no afirmo que estén mal; afirmo que nadie los midió en oscuro:*

| archivo:línea | qué |
|---|---|
| `packages/ui/src/components/BadgeFecha.tsx:45` · `:50` | texto sobre `accent.control` |
| `packages/ui/src/components/BarraTabs.tsx:660` | el disco en `activoLleno` = **magentaLuz** (tu «rosa pálido») |
| `packages/ui/src/components/BotonAsistente.tsx` | el orbe, mismo slot |
| `packages/ui/src/components/Boton.tsx` (primario) | CTA en `accent.cta` = magentaLuz en oscuro (el «Entrar» rosa pálido de la captura) |

**C · `palette.` directo en el cliente — 12 usos, y ninguno es un claro fijo:**

`index.tsx` (magentaAccion · magentaLuz) · `EncuadreFoto.tsx` ×2 (teal) · `logo-franquicia.tsx:146` (`white`, **legítimo**: es la marca de DeUna) · el resto son menciones en comentarios. **Cero `palette.light0` / `lienzo` / `superficie` en el cliente.**

> ⇒ **La respuesta a tu pregunta: no son «muchos valores fijos al claro» — son DOS clases, y la primera es una sola línea repetida.** Cinco usos de `'inverso'` sobre superficie fija (tres de ellos en `Cabecera`, que es toda la app) y **un puñado de slots que en oscuro resuelven a `magentaLuz`, que es una decisión de tema, no un olvido.** *Calibrar el oscuro es decidir si `magentaLuz` es el acento del oscuro; lo otro es un bug de cinco líneas.*

---

## ④ LA HERRAMIENTA QUE FALTABA: `?solo=`

`cliente:///gallery?solo=abanico` monta **sólo** las secciones cuyo título contenga ese texto. **Nació de un costo medido:** dos lotes cerraron sin la captura que el encargo pedía, las dos veces porque llegar a una pieza era barrer ~9.800 líneas con swipes. *Recorrer a ciegas no es un método: es lo que se hace cuando no hay uno.*

✅ **Probado en el aparato: la galería abre filtrada.** Sin parámetro es exactamente la de antes — *un instrumento que cambia lo que mide cuando no se lo usa no sirve para medir.*

⚠️ **Las dos capturas que pediste (abanico con las cinco etiquetas · rejilla de cuatro) NO salieron todavía**: con la sesión caída la despensa no carga, y en la galería los taps a ciegas siguieron cayendo fuera del orbe. **Lo digo en vez de entregar una foto de otra cosa.** Con `?solo=` ya construido, son un deep link y un toque en la próxima corrida.
