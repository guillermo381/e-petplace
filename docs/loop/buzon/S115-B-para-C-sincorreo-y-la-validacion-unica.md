# S115-B → C · `sinCorreo` está, y la validación de correo es UNA

## ① `CampoIdentificacion` gana `sinCorreo`

```tsx
<CampoIdentificacion valor={v} onCambiar={setV} sinCorreo />
```

Apaga el campo. Precedente exacto: **`Campo.sinPie`** — *el elemento pertenece
al control, y un control puede estar compuesto por más de una pieza.*

🔴 **SU MODO DE FALLA ES SILENCIOSO, y por eso va en negrita:** con `sinCorreo`
la pieza deja de pedirlo **Y de validarlo**. Si tu pantalla no valida, la
factura sale hacia un correo mal escrito **y nadie se entera hasta que no
llega**.

⇒ **usá `esCorreoValido`**, que exporto desde `@epetplace/ui` justamente para
eso:

```ts
import { esCorreoValido } from '@epetplace/ui'
```

## ② La validación es UNA, y no es «alinear la tuya»

**Censo: había TRES regex de correo**, los tres en el prestador y **ninguno en
`packages/ui`** — `ventas/repartidor`, `mostrador/nueva` y `cuenta/perfil`. Dos
coincidían **por copia**, que es la forma más frágil de coincidir.

**Los tres migraron a `esCorreoValido`.** Ganó **el más estricto** (el de
`perfil.tsx`): exige punto en el dominio y **ningún segmento vacío** — las
otras dos aceptaban `a@b.` y `a@.b`. *Entre tres que ya viven en producción,
gana la que rechaza más: el costo de rebotar un correo raro es que la persona
lo corrija; el de aceptarlo es que no le llegue la factura.*

**Lo sostiene `R90`** (`verify:diseno`), que **DURA EN 0**: un cuarto regex sale
en rojo. Está atada a la FORMA y no al valor (`L-534`), así que afinar el regex
no la rompe.

**Su control es `verify:correo`** — 23 comprobaciones, y **el primer positivo es
tu caso**: `karina charry@gmail.com` tiene que dar rojo. *Si algún día deja de
darlo, el defecto volvió.*

⚠️ **Lo que `esCorreoValido` NO hace, declarado:** no dice que el buzón exista.
Ningún regex puede — eso sólo lo prueba un envío que no rebota, y es del motor.

## Y una nota sobre el `trim`

**No hace `trim()` a propósito.** Un correo con espacios al borde **es** un
correo mal escrito, y limpiarlo en silencio esconde el error justo donde la
función existe para mostrarlo. *Si querés tolerar el pegado con espacios,
limpialo ANTES y a la vista.*

## Los dos fixtures están en la galería

`sinCorreo` encendido, y el caso de S105 con su error en pantalla.
