# S112-C → A · EL SHA DEL CORTE PARA EL LOTE DE GUARDERÍA

## EL SHA

```
pista/s112-c   cf139002beef7f0dc7166446d1793e119f84f5dd
```

**Verificado POR SHA contra origin** (`git ls-remote`), no por código de salida:
local y remoto **coinciden**. La rama está en origin y el árbol quedó **limpio**
(`git status --porcelain` en cero).

## 🔴 LO PRIMERO: **NO HAY ADOPCIÓN ALCANZABLE HASTA ESTE SHA, y está medido**

La orden era *«nada de adopción alcanzable antes de ese SHA»*. **Sí construí
adopción antes de que llegara la orden** — así que en vez de borrarla la
**apagué**, con el precedente de la casa (`VITRINA_GATE_ABIERTO`, S78:
*construir SÍ, encender NO*).

**El interruptor es uno solo:** `apps/cliente/src/lib/gate-adopcion.ts` →
`ADOPCION_ALCANZABLE = false`. Sus lectores, medidos, son **tres**:

| lector | qué apaga |
|---|---|
| `(tabs)/explorar/index.tsx` | la entrada «Mascotas en adopción» **y su petición** (el gate corta antes de leer: un viaje para decidir algo que no se dibuja es un viaje pagado para nada) |
| `(tabs)/hogar/index.tsx` | la carta de adopción del hogar sin mascotas |
| `onboarding/index.tsx` | la bifurcación de dos tarjetas — con el gate apagado, `/onboarding` hace **exactamente lo de siempre** |

⚠️ **Lo que el gate NO apaga, declarado:** `/adoptar`, `/adoptar/solicitudes` y
el hilo **siguen existiendo como rutas**, y la puerta desde el login es de
S111-C y ya estaba viva antes de mi lote. **No son secreto ni dato ajeno.** Lo
que se apaga es el **descubrimiento**: que la adopción aparezca sola delante de
alguien que entró a mirar su guardería.

⚠️ **Y el portal del publicador (app de negocios) ya nace inalcanzable por otra
razón**, no por el gate: no está en la barra de tabs, porque su llave es tu
`obtener_mi_cuenta_refugio`. *La puerta va última.*

## LO QUE VA EN EL LOTE DE GUARDERÍA — los tres que el founder recorre

| # | qué | commit |
|---|---|---|
| ① | **`D-1000` CERRADA** — el espejo del tramo vivo muere; lo contesta `obtenerTramoVivoDeMiMascota` | `5ba785c0` |
| ② | **El censo del hogar vacío + su cura** — un guard con dos hechos adentro, en las 5 raíces de oficio | `b6f60a0f` |
| ③ | **La bifurcación del onboarding**, construida con su puerta cerrada | `cf139002` |

**② no estaba en la lista de esta noche y lo mando igual**, porque toca el mismo
recorrido: quien abra la app sin mascota y toque cualquier oficio recibía la
voz del caso equivocado. Si preferís dejarlo afuera, se saca sin tocar lo demás
—es un commit propio— **pero avisame**, porque `③` y `②` se leen juntos: el
onboarding manda al alta, y el alta es donde caía esa persona.

## 🔴 `D-1001` — LO ÚNICO DE LOS TRES QUE **NO PUDE CERRAR**, y es tuyo

La orden decía *«las tres claves con su razón en el Boton de B»*. **Medí contra
el objeto y en mi árbol NO están** (`L-166` — el dato vivo se lee al usarlo, no
del reporte):

- `packages/api/src/wrappers/guarderia-reserva.ts` → el enum `MENSAJES` tiene
  **`mascota_no_elegible`** («La guardería es solo para perros y gatos») **y
  ninguna clave nueva de mensualidad**;
- `grep especies_elegibles` en `packages/api` → **0 ocurrencias**;
- tu rama **no está en origin** al momento de este corte (sólo `s112-b` y
  `s112-d`).

**Lo que sí verifiqué que ya funciona:** el rebote **no sale mudo** —
`checkout.tsx` llama `rebotar(r.codigo, r.mensaje)` y muestra la voz del
wrapper—, así que **el día que agregues las claves al enum, el rebote habla
solo**.

🔴 **Lo que falta es lo que el founder pidió y es lo mejor de su dictado:**
*«al elegir mascota, los planes que no aplican ya se ven apagados con su porqué,
ANTES de llegar al botón»*. **Eso necesita `especiesElegibles` en el LECTOR**,
no el código de error: con el rebote solo, la puerta ofrece lo que va a
rechazar (Ley 23). **Es el §⑦② del PEDIDO 1 y sigue siendo el más barato de los
que te pedí.**

⚠️ **Y hay un segundo bloqueo, que es de B y no tuyo:** el `Boton` que dibuja la
razón vive en `pista/s112-b`, y **su commit `55f51ad6` deja `Boton.tsx` en rojo
de tipos** (`TS2322` en el `style` del `Animated.View`, línea ~752). Lo mergeé,
me puso el typecheck del cliente en rojo, **deshice el merge** para no quedar
bloqueado y se lo reporté a B con el error literal. **No toqué su archivo.**

— **Pista C, S112**
