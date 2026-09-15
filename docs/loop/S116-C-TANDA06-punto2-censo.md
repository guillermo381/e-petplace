# Tanda 06 · punto 2 — las pantallas sin cabecera, una por una

**31 archivos** en `apps/cliente/src/app` sin `Cabecera` ni `Encabezado`. Decisión
de cada uno, con su razón. **Ocho eran pantallas de verdad; 23 no lo son o no
llevan cabecera por diseño.**

## ⑴ LLEVAN LA ESTRUCTURA — 5 (hechas)

Las cinco de oficio. **No estaban «sin cabecera»: tenían una LOCAL**, y por eso
ningún instrumento las vio.

| archivo | línea | decisión |
|---|--:|---|
| `(tabs)/explorar/paseo/index.tsx` | 389 | **empujada** · «Agenda Paseos» · apoyo = la mascota |
| `(tabs)/explorar/grooming/index.tsx` | 273 | **empujada** · «Estética y baño» |
| `(tabs)/explorar/veterinaria/index.tsx` | 312 | **empujada** · «Veterinaria» |
| `(tabs)/explorar/adiestramiento/index.tsx` | 256 | **empujada** · «Adiestramiento» |
| `(tabs)/explorar/guarderia/index.tsx` | 462 | **empujada** · «Guardería» |

🔴 **El hueco entre dos instrumentos.** El censo del lote 3b las contó como «sin
cabecera» porque no montaban `Encabezado` ni `Cabecera`; montaban
**`CabezalOficio`**, pieza LOCAL que pinta `bg.base` **plano**. Y
`verify:techos-locales` tampoco las veía: su marcador es `LinearGradient`, y
**su propia cabecera declara ese punto ciego** (*«un techo hecho con un
`backgroundColor` plano no lo ve»*). *Dos gates con el mismo punto ciego, y el
hueco justo en el medio.*

☠️ `CabezalOficio` muere con su lápida. ⚠️ **Se pierde el glifo del oficio**:
`Cabecera` no tiene ese slot y no se dibuja local — pedido a B.

## ⑵ NO LLEVAN CABECERA POR DISEÑO — 8

| archivo | decisión y razón |
|---|---|
| `index.tsx` · `bienvenida.tsx` | **bienvenida** — láminas de marca a sangre; ya exentas por nombre en `verify:techos-locales` |
| `beneficios.tsx` | **bienvenida** — lámina de onboarding con «Saltar»; no hay a dónde volver |
| `verificar-correo.tsx` | **bienvenida** — su propio comentario lo dice: *«la flecha sola — sin cabecera»* |
| `invitacion.tsx` | **bienvenida** — el handshake llega desde un link, a sangre |
| `pagos/mensualidad.tsx` | **bienvenida/acceso** — se abre **desde un correo**: no hay pila, y una flecha de volver ofrecería un camino que no existe. Su éxito es una `Confirmacion` centrada a sangre |
| `(tabs)/hogar/mascota/despedida.tsx` | **nada** — monta `PantallaDespedida`, una pieza a sangre |
| `autorizacion/[solicitudId].tsx` | **nada** — es una `Hoja` sobre fondo transparente, no una pantalla con techo |

## ⑶ NO SON PANTALLAS — 13

`_layout.tsx` (raíz y los 6 de stack) · `(tabs)/_layout.tsx` (el shell) ·
`hogar/agregar/index.tsx` y `[paso].tsx` · `onboarding/index.tsx` y `[paso].tsx`
· `auth/callback.tsx` (puente de OAuth, sin UI).

## ⑷ YA LA TIENEN POR SU MÁQUINA — 5

`explorar/{paseo,grooming,veterinaria,adiestramiento}/checkout.tsx` y
`guarderia/checkout.tsx` montan `CheckoutReserva`, **que ya lleva la estructura**
(migrada en el lote 3b). *Ponerles una cabecera propia serían dos.*

## ⑸ DECIDIDAS QUE NO — 2, con su razón

- **`prestador/[prestadorId].tsx`** — la vitrina pública monta `FichaPrestador`,
  cuya **portada va A SANGRE en 4:3** por letra firmada (S91). Una banda ciruela
  arriba la taparía. *La pieza ES el techo de esa pantalla.*
- **`gallery.tsx`** — herramienta de sesión, no pantalla de producto. *Si se
  viera como una pantalla del producto dejaría de servir para mirar piezas del
  producto.* (⚠️ `lamina-fusion.tsx` SÍ se migró en el 3b, y la diferencia es
  real: aquélla ya montaba `Encabezado` y había que sacarlo.)
