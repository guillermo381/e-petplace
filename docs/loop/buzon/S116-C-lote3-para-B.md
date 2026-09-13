# Buzón · C → B — S116 lote 3

> Rama `pista/s116-c-03`. Lo que la pantalla necesitó y la pieza no da. **No se resolvió local** (regla del método §0.1).

## 1. 🔴 `Campo` no tiene `razonDeshabilitado` — bloquea cerrar `D-1086`

**Medido:** `packages/ui/src/components/Campo.tsx` acepta `deshabilitado` (línea 245) y **no** tiene `razonDeshabilitado`; `Boton` sí (línea 235).

**Dónde muerde:** `apps/cliente/src/app/nexo.tsx:538` — el `Campo` de la caja del asistente se apaga con `deshabilitado={pensando}` mientras NEXO responde, y **no puede decir por qué**. Es uno de los tres frenos mudos de `D-1086`; los otros dos (los de `carnet.tsx`) ya están curados porque son `Boton`.

**Por eso el baseline de `verify:razon-muda` bajó a 138 y no a 137.** El tercero queda vivo, declarado, esperando la prop.

**Lo que pido:** la misma prop que `Boton`, con el mismo contrato (`razonDeshabilitado?: string`, sin default — la voz es del riel).

⚠️ *Y una observación que es tuya, no mía: puede que la cura correcta no sea la prop sino que el campo no se apague y el envío sí. No lo decido desde la pantalla.*

## 2. 🟡 `Cabecera` — el alto como constante exportada

**No bloquea**: lo resolví midiendo con `onLayout`, igual que el shell mide la barra. Lo dejo anotado por si querés exponer el alto como constante (`ALTO_CABECERA_*`), como ya existe `ALTO_FILA_TABS`. *Con la constante, el valor de arranque de la medición asincrónica es el correcto — que es la regla que el propio shell dejó escrita.*

---

## 3. 🔴 **BALOO NO APARECE, Y LA CAUSA NO ES NINGUNA DE LAS DOS QUE LA MESA PLANTEÓ** — medido, cadena completa

El acta `S116-REVISION-MESA-1.md` §3 dejó la pregunta abierta así: *«si el token `titulo` no apunta a Baloo, es del lote 1 y lo corrige B; si las pantallas usan un token propio, es de C en su lote»*. **Lo medí y es una tercera cosa.**

### La cadena, eslabón por eslabón

| eslabón | archivo:línea | valor |
|---|---|---|
| la pieza monta | `components/Cabecera.tsx:156` | `<Texto variante={esRaiz ? 'titulo' : 'seccion'}>` |
| la variante resuelve | `components/Texto.tsx:236` | `fontFamily: typography.family.sans.light` |
| el token entrega | `tokens/typography.ts:33` | **`'DMSans_300Light'`** |

**⇒ `variante="titulo"` entrega DM Sans 300 Light. No Baloo.**

### Por qué nadie lo vio, que es la parte que importa

**La escala v5 existe y está bien** (`typography.escala.display/titulo1/titulo2/cifra` → `Baloo2_800ExtraBold`, líneas 183-187). **Lo que no existe es un consumidor**: de las nueve variantes de `TextoVariante`, la **única** que lee la escala v5 es `antetitulo`. Las otras ocho siguen en `family.sans`/`family.mono`.

Y **`family.sans` no se tocó a propósito y con razón medida** (tu propio comentario, líneas 49-64): el prestador la consume en 64 ocurrencias / 26 archivos, más 130 en 58 piezas compartidas. Re-apuntarla habría cambiado el prestador entero en silencio, y la letra §5 dice que no cambia. **Esa decisión fue correcta.**

**El hueco está en el medio: la escala nueva nació sin variantes que la sirvan, así que nada puede consumirla.**

### 🔴 Y el detalle que lo vuelve invisible: las piezas NUEVAS creen que ya usan Baloo

`components/Confirmacion.tsx:145` lleva escrito:

> `{/* El «¡Listo!» en Baloo — `titulo` es la variante display de la casa; ... */}`

**El comentario afirma Baloo y el token entrega DM Sans.** No falla nada, compila, pasa `verify:diseno` y `verify:contrast` — *y el comentario refuerza la creencia de que está bien, así que el próximo que lea la pieza tampoco va a ir a mirar.* Misma clase que el `@3x` del lote 2: el nombre parecía documentación y era otra cosa.

### Lo que pido, y por qué no lo resuelvo local

**Variantes v5 en `Texto` que lean `typography.escala`** — `display`, `titulo1`, `titulo2`, `cifra`, `cifraChica`, `cta`, `fila` — y que las piezas nuevas las monten en vez de `titulo`/`seccion`.

**No lo hago yo** porque `Texto` la montan las dos apps y cambiar `titulo` en su archivo le cambiaría los títulos al prestador — exactamente el silencio que evitaste al no tocar `sans`. *El mecanismo que esto necesita ya lo inventaste vos en el lote 2: `accent.formaV5`, el booleano por casa. La tipografía necesita el mismo, o variantes nuevas con nombre propio.*

⚠️ **Esto bloquea el objetivo del lote 3.** Sin variante v5, mis once pantallas salen con los títulos en DM Sans 300 Light y el founder ve en el recorrido exactamente lo que la mesa ya rechazó. **Monto lo que hay y lo declaro en el parte**; el día que la variante exista es un cambio de una línea por pieza.

---

## 4. 🟠 `Texto` necesita el color **rosa sobre ciruela** para el acento del claim

**Dónde muerde:** 01 · Propuesta. El encargo pide el claim *«en Baloo grande, blanco, con "una vida." en rosa sobre ciruela»*. Ese acento **es la firma visual de la pantalla** — es lo único que la separa de un párrafo blanco.

**Medido:** `TextoColor` = `primary | secondary | tertiary | danger | success | warning | sobreVideo | warm | inverso`. **No hay un miembro que resuelva a `palette.rosaSobreCiruela`**, y el token existe (`#FFB8DE`, letra §2).

`antetitulo` sí lo lleva adentro (*«magenta en cuerpo, `#FFB8DE` sobre ciruela»*), pero es una **variante** y su tamaño es 11 con tracking: no sirve para el acento de un display.

**Lo que pido:** un color más en `TextoColor` para el rosa sobre ciruela. El nombre lo elegís vos; desde la pantalla lo único que importa es que **el color no se escriba en la pantalla** — pasarlo por `style` lo caza `R4`, y con razón.

**Mientras tanto monto el claim entero en `inverso`** (blanco) y queda declarado en el parte: la pantalla dice lo mismo y pierde su acento. *Es un cambio de una palabra el día que el color exista.*

---

## 5. 🟠 `Boton` necesita su **secundario sobre fondo oscuro**

**Dónde muerde:** 01 · Propuesta, sobre el degradado de entrada. El encargo pide *«secundario blanco "Ya tengo cuenta"»*.

**Medido:** `BotonVariante` = `primario | marca | secundario | ghost | destructivo | compacto | apoyada | sinCaja | acento`. Ninguna es para fondo oscuro. El `secundario` de la casa es *«alto 52 borde 1,5 magenta»* (letra §2) ⇒ sobre ciruela queda **magenta sobre ciruela**, que la misma §2 prohíbe textual (*«Nunca magenta sobre magenta ni ciruela sobre ciruela»*).

**Es el mismo hueco que ya resolviste en `Texto` con el color `inverso`** — *«el par legible de `primary` cuando el fondo se da vuelta»*. `Boton` lo necesita igual.

**Mientras tanto monto `secundario`**: la forma es la correcta (alto, radio, borde) y el color queda declarado en el parte. 01 es la primera pantalla que ve un invitado de F&F, así que este par va a estar en la primera captura del recorrido.
