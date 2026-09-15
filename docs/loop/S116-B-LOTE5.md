# S116-B · LOTE 5 — Explorar y servicios

**Rama `pista/s116-b-05`.** Gates: `verify:diseno` VERDE (80) · `verify:contrast` **494 pares / 0** · `verify:catalogo-v5` VERDE (46 piezas) · `verify:boton-alto` VERDE · `verify:techos-locales` VERDE · `tsc` 0 en las cuatro.

---

## ① QUÉ NACIÓ Y QUÉ NO — porque la mitad del lote fue no duplicar

| pedido | resultado |
|---|---|
| `GrillaOficios` | **nace** |
| `TarjetaPrestador` | **nace** |
| `GrillaSubservicios` | **nace** |
| `SelectorHora` | **nace** — no como promoción literal (ver ④) |
| `FilaIncluye` | **nace** |
| `SelectorDia` | **ya existía** — gana la anatomía v5; **la rueda sigue viva** (ver ③) |
| el pie de precio | **es `PieReserva`** — gana `rotuloTotal` y la cifra en Baloo |
| `TarjetaDestacada` | ya existía, como decía el encargo |

## ② LO QUE ENCONTRARON LAS CAPTURAS, y no el razonamiento

🔴 **Tres defectos, los tres míos, los tres invisibles en el código.**

1. **El día y la hora elegidos salían MAGENTA.** Pedía `accent.activoLleno` — y **la casa tiene la distinción escrita desde el lote 2, en el propio tema**: *«MAGENTA ACCIONA, CIRUELA SELECCIONA»* (`light.ts:56`, letra §1.3). Un día elegido **es una selección**, así que el slot es `accent.controlLleno`, que **ya existía con ese empleo declarado** (`SelectorOpcion:276`). *El slot no faltaba: yo estaba pidiendo el de al lado — y los dos son un relleno con letra clara, así que en pantalla parecía correcto.* ⚠️ `activoLleno` **no se toca**: es el disco de `BarraTabs`, firmado en el lote 1.
2. **La pata no pisaba nada.** La primitiva es `position:'absolute'` con `top:-MONTA`, o sea **contra su PADRE**; colgada de la columna quedaba flotando arriba de todo. *Un puntito suelto en el aire, no una pata apoyada.*
3. **El retrato de la tarjeta salía SQUIRCLE.** Monté `AvatarMascota` en la maqueta y esa pieza es squircle 32 % por diseño, mientras el encargo dice **«en círculo»**. ⇒ **la FORMA la garantiza la pieza y el CONTENIDO la pantalla**: *si la forma dependiera de qué nodo manda cada pantalla, dos listas de la misma app tendrían retratos distintos sin que nadie lo hubiera decidido.*

⚠️ **Y el par `controlLleno`/`sobreControlLleno` NUNCA ESTUVO MEDIDO.** Existía desde el lote 2 con un consumidor, y el gate de contraste **sólo mide lo que está en su lista**. Declarado: **13,35 / 11,47 / 16,85**. *Un par que nadie declara es un par cuyo verde no dice nada.*

## ③ `SelectorDia` — un trabajo, una pieza, y la casa decide el traje

La rueda existe, tiene **nueve montajes vivos** (seis del cliente, tres del prestador) y su física está **firmada en dispositivo** (S82-C r12) con su propia cabecera diciendo que no se recalibra sin otro gate. El encargo dicta **otra anatomía**.

🔴 **No nace una pieza hermana** (Ley 19). Lo que cambia es **de qué casa es la anatomía**, y esa pregunta **ya tiene su slot**: `accent.formaV5` — *«¿esta casa recibió la geometría del rediseño?»*. *No es una prop de variante inventada para la ocasión: es la decisión que la casa ya tomó, aplicada donde corresponde.* Consecuencia: **ningún montaje se toca** y cada uno recibe la anatomía de su casa.

⚠️ **Un cambio de criterio declarado:** en la tira **el día cerrado NO se elige**, al revés que en la rueda. La rueda lo dejó tocable porque la voz que explica el vacío sólo se monta para el día elegido; **acá manda el encargo**, y la contrapartida es de quien monta: *el porqué tiene que decirse en otro lado, porque el chip ya no puede.* → buzón.

## ④ `SelectorHora` — se promueve el TRABAJO, no el archivo

Su antecesor vive local: `GrillaElegir` (`reserva-piezas.tsx:229`). Medido antes de escribir: **hace TRES trabajos** —horas, duraciones y el QUÉ de grooming a dos columnas—, y por eso tiene props de columnas y de voz. 🔴 **Promoverlo verbatim con el nombre `SelectorHora` habría puesto en `packages/ui` un nombre que miente sobre dos de sus tres usos**, y un nombre que miente ahí lo hereda toda la casa. Cuando el eje de la hora migre, `GrillaElegir` pasa de tres trabajos a dos.

## ⑤ LA CIFRA DE LA CASA, en dos piezas

🔴 **La letra v5 dice *«Baloo 2 800 para display, títulos y CIFRAS»* y `typography.escala` la declara desde el lote 2 — pero la voz única del precio seguía en PJS.** `PrecioText` gana el registro `cifra` y `PieReserva` lo aplica cuando la casa es v5. *Como no falla nada, nadie lo iba a notar hasta que una pantalla pidiera la cifra de la casa.* ⚠️ **`cifraChica` (22) y no `cifra` (44)**: 44 preside una pantalla; acá comparte el renglón con el CTA. ⚠️ **Los otros tres registros no cambian**: migrarlos toca los 53 sitios que `PrecioText` unificó y es decisión de mesa.

## ⑥ LAS CAPTURAS

📷 `lote5-grilla-oficios.png` · `lote5-tarjeta-prestador.png` · `lote5-grilla-subservicios.png` · `lote5-agendar.png` · `lote5-detalle-y-pie.png`

## ⑦ AL BUZÓN

- **C** — el día y la hora **sin lugar ya no se tocan**: la pantalla tiene que decir por qué no hay, porque el chip ya no puede explicarlo. Es el criterio inverso al de la rueda y está declarado en las dos piezas.
- **C** — `GrillaElegir` pierde el eje de la hora cuando monte `SelectorHora`; los otros dos trabajos siguen siendo suyos.
- **C** — `GrillaOficios` exige `vozSinDisponibles` cuando hay algún oficio apagado: *un estado que sólo existe como color más pálido es invisible para quien no ve el color.*
- **mesa** — `PrecioText`: los registros `vitrina`/`ficha`/`linea` siguen en PJS. Migrarlos a Baloo es un lote propio con su gate.
