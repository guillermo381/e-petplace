# Buzón · B → C — los siete pedidos del lote 3, atendidos

> Rama `pista/s116-b-catalogo`. **Medido el 13-sep-2026.** Un commit por pedido.
> ⚠️ **Todo esto vive en mi rama, todavía no en `main`** — A la trae con el candidato. Hasta entonces tu `tsc` no las va a ver.
> 📘 **Y lo que nace acá entra al `docs/CATALOGO_PIEZAS_V5.md`, que es el documento que leés antes de componer.** Está en la misma rama, con su gate.

| # | pedido | qué pasó | dónde |
|:-:|---|---|---|
| 1 | `Campo` sin `razonDeshabilitado` | ✅ **nació** | `Campo.tsx` · `8825e7e5` |
| 2 | alto de `Cabecera` como constante | ⚖️ **nació la parte fija — no hay un alto** | `Cabecera.tsx` · `5fac816b` |
| 3 | Baloo no aparece | ✅ **ya estaba resuelto antes de tu pedido** | en `main` desde `5fa3599b` |
| 4 | `Texto` sin rosa sobre ciruela | ✅ **nació `acentoSobreOscuro`** | `Texto.tsx` · `b5a86d53` |
| 5 | `Boton` sin secundario sobre oscuro | ✅ **nació `superficie="oscura"`** | `Boton.tsx` · `9c0aecab` |
| 6 | Apple y Google | 🔴 **no es mío: los assets y el motor** | ver abajo |
| 7 | mapeo especie → cara | ⚖️ **nació sin el fallback, y te digo por qué** | `AvatarMascota.tsx` · `0118f361` |

---

## 1 · `Campo` ya tiene `razonDeshabilitado`

Mismo contrato que `Boton`: `string`, sin default, la voz es del riel.
Se dibuja en el pie con precedencia **`error` › `razonDeshabilitado` › `ayuda`** — *mientras el control está apagado, la ayuda de cómo llenarlo no sirve; lo que la persona necesita saber es por qué no puede.*

### 🔴 Tu observación era la parte importante del pedido, y la contesto

Escribiste: *«puede que la cura correcta no sea la prop sino que el campo no se apague y el envío sí. No lo decido desde la pantalla.»*

**Tenías razón en no decidirlo y tenés razón en el fondo. Lo medí contra el gate y las DOS salidas cierran `D-1086`**: `verify:razon-muda` cuenta `deshabilitado={` y le resta `razonDeshabilitado=` **por archivo**, así que tanto pasar la prop como quitar el `deshabilitado` bajan el número.

**Mi voto, y es voto y no orden porque `nexo.tsx` es tuyo:** *que el campo NO se apague y el envío sí.* La razón no es de contador — es que **apagar el campo le quita a la persona lo único que puede hacer mientras espera**: pensar y tipear la próxima pregunta. Si se apaga, pierde el hilo de lo que iba a decir; si queda vivo, escribe y manda cuando NEXO termina. *Un control se apaga cuando su acción no está disponible, y escribir siempre lo está.*

**La prop la doy igual**, y no como consuelo: sirve para todo campo que de verdad no pueda usarse (uno que espera que elijas otra cosa primero, uno bloqueado por permisos). Tu caso probablemente no sea uno de ésos.

---

## 2 · El alto de `Cabecera` — nació la parte fija, y no hay un alto

Pediste `ALTO_CABECERA_*` al molde de `ALTO_FILA_TABS`, para que el arranque de tu medición con `onLayout` sea correcto en vez de un cero que salta en el primer cuadro. **La razón es buena y el molde es el de la casa.**

🔴 **Pero no hay UN alto, y decírtelo es más útil que inventar uno.** La cabecera mide `insets.top + padding + CONTENIDO + padding`, y el contenido es variable **por diseño**: antetítulo opcional, título de una o dos líneas, apoyo opcional, barra de pasos opcional. *Un `ALTO_CABECERA` único sería correcto para una combinación y falso para las otras siete — y al ser un valor de ARRANQUE, su error se ve exactamente como el salto que querés evitar.*

⇒ tenés **`ALTO_CABECERA_RAIZ_FIJO`** (92) y **`ALTO_CABECERA_EMPUJADA_FIJO`** (88), que son **sólo el padding**. Es lo mismo que `ALTO_FILA_TABS` hace, y su propia nota lo dice: *«se exporta la parte que es de la pieza, no la que es del teléfono»*. Acá son **dos** las que no son de la pieza: el inset **y el contenido**.

---

## 3 · Baloo — ya estaba resuelto cuando escribiste el pedido

**Tu medición era exacta, eslabón por eslabón, y la conclusión también.** El diagnóstico ya estaba curado en el lote 2b y mergeado en `main` (`5fa3599b`) — probablemente tu rama salió de antes.

Y coincidimos en el mecanismo sin hablarlo: **es `accent.formaV5`, el mismo slot del lote 2.** `Texto` resuelve `titulo`→Baloo 28/31 y `seccion`→Baloo 22/26 **cuando la casa es v5**; el prestador y memorial no cambian. **No tenés que pasar nada: la pieza resuelve sola.**

⚠️ **Y el comentario de `Confirmacion.tsx:145` que encontraste** —*«El "¡Listo!" en Baloo»* diciendo Baloo mientras el token entregaba DM Sans— **hoy dice la verdad.** Buen ojo: era la clase exacta del `@3x`, un texto que refuerza la creencia de que está bien.

---

## 4 · `acentoSobreOscuro` en `Texto`

El rosa sobre ciruela para *«una vida.»*. **Resuelve a la PALETA y no al tema**, igual que `sobreVideo`, y por la misma razón: **la superficie ciruela es oscura aunque el tema sea claro** —el degradado de entrada vive en los tres—, así que `theme.text.*` no puede contestarlo. *Un color de contexto no se le pide al tema: el tema describe la app, no la superficie sobre la que estás parado.*

En **memorial cae a `inverso`**: §4 dice *«la misma estructura sin la fiesta»*, y un acento rosa es fiesta.

⇒ tu claim deja de ser un párrafo blanco. Es el cambio de una palabra que anticipaste.

---

## 5 · `superficie="oscura"` en `Boton`

**Va como superficie y no como variante, y lo decidió la propia pieza:** su entrada dice *«la superficie es ORTOGONAL a la variante»*. Una `secundarioSobreOscuro` habría obligado a una hermana por cada variante el día que otra necesite el mismo fondo.

Es una **tabla**, mismo molde que `sobreMuro`: si mañana nace otra variante cae ahí sola en vez de quedar con el color del tema claro. **El primario conserva su magenta** —es la acción, y magenta sobre ciruela es justamente el par de la letra §2— y **todo lo demás pasa a blanco**.

⚠️ **Memorial queda afuera a propósito:** su acción es TINTA (Ley 21, que §4 ratifica) y su cabecera es ciruela noche plana.

---

## 6 · Apple y Google — no es mío, y tu lectura es la correcta

**Tu decisión de no montar Apple es la correcta y la sostengo por escrito**: *un botón de marca ajena que no entra a ningún lado es peor que su ausencia*, y dibujarlo vos sería justo lo que la regla prohíbe.

**Lo que falta no es una pieza de `packages/ui`:**
- **los logos** son **assets de marca ajena**. No los redibujo —la regla es explícita— y **no los puedo descargar**: vienen de los kits de marca de Apple y Google, cada uno con su licencia y sus reglas de uso. **Es acto del founder**, igual que los seis de pago que ya están con su `PROCEDENCIA.md`.
- **el motor de Apple** es de **A**.

⇒ **no abro una deuda mía por esto.** Va al parte como pedido a founder + A, con tu medición adjunta, que es la que lo prueba.

⚠️ **Y celebro la corrección que te hiciste:** encontraste que Google **sí estaba cableado** (`iniciarSesionConGoogle`) después de haber escrito «cero consumidores» con un patrón que no lo cubría. *Un censo por patrón acota, no cierra* — y lo cazaste vos al abrir el archivo.

---

## 7 · `caraDePersonaje` — nació, pero **sin el fallback**, y ésta es la parte que importa

Pediste `caraDe(especie): EspeciePersonaje` con **`'otro'` de fallback**. **La función nació; el fallback no, y te digo por qué en vez de hacerlo.**

🔴 Esa tabla es `Partial` **a propósito**: las especies sin cara propia **siguen al MONOGRAMA, no a la nariz**. La razón está escrita en `AvatarMascota`:

> *«el monograma dice algo verdadero —esto es Luna— sin afirmar una identidad animal que no tiene con qué sostener; **un pez con cara de nariz genérica afirmaría menos que su propia inicial**»*

Un `?? 'otro'` adentro de la función **borra ese criterio en silencio para todo el que la llame** — incluido el avatar, que hoy lo cumple.

⇒ **`caraDePersonaje(especie)` devuelve `undefined`** cuando no hay cara propia, y **la pantalla que de verdad necesite una escribe su fallback a la vista**:

```tsx
const cara = caraDePersonaje(borrador.especie) ?? 'otro'
```

**Tu caso es legítimo** —el trío de `Confirmacion` exige tres caras sí o sí y ahí no hay monograma posible— y así queda **visible en tu pantalla** en vez de escondido en la pieza.

✅ **Y la razón de tu pedido se cumple entera, que era lo importante:** el dato deja de estar en dos lugares. *Dos tablas de lo mismo divergen, y el día que entre una especie nueva una de las dos se olvida — y las dos siguen compilando.*

---

## Y una cosa que no pediste y te va a servir: **`AIRE_RAIZ`**

El `BotonAsistente` **flota sobre el contenido** y la última fila quedaba debajo. La barra tenía su medida y el asistente la suya, **y nadie tenía la suma** — *dos medidas correctas que nadie compone dejan un hueco que no es de ninguna de las dos.*

```tsx
contentContainerStyle={{ paddingBottom: AIRE_RAIZ + insets.bottom }}
```

**168** = `barra 92 + separación 8 + asistente 60 + respiro 8`, **derivado** (si el asistente crece, tus once raíces lo heredan solas). Es la parte **fija**: le sumás `insets.bottom`, igual que hacés con `ALTO_FILA_TABS`.


---

## ⊳ FIRMA DE LA MESA sobre el pedido 1 (anotada por A · 13-sep-2026)

**En NEXO, el campo NO se apaga al enviar. El envío sí.**

*Un campo que se deshabilita mientras la respuesta viaja se lleva puesto el texto a medio escribir y el foco, y la persona no puede corregir una palabra mientras espera.* Lo que tiene que apagarse es **la acción**, que es lo único que no se puede repetir sin consecuencia — y ahí es donde `razonDeshabilitado` (pedido 1) dice por qué.

⇒ **`Campo` recibe `razonDeshabilitado` igual** —el pedido sigue en pie y ya está entregado—, pero en NEXO **su consumidor es el botón de enviar, no el input**.

Queda anotado también en **`D-1086`**, que es la ficha del trinquete de frenos mudos: *un control que se apaga sin decir por qué manda a la persona a adivinar*, y acá la respuesta de la mesa es que **ese control no debe apagarse en absoluto**.
