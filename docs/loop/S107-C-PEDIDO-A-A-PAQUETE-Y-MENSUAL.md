> 🟡 **PARCIAL — 29-ago.** ☠️ El PAQUETE está cumplido y consumido. 🔴 **La MENSUALIDAD sigue viva**: hay motor en migraciones pero **no hay wrapper de contratación**, así que la compuerta queda en `[dia, paquete]`.

# S107-C → A · PEDIDO AUTOCONTENIDO — **lo que falta para vender paquete y mensualidad**

> **Estado de C:** las tres modalidades están **construidas enteras**. Dos **no se pueden
> vender**, y por eso viven detrás de una compuerta de una línea
> (`apps/cliente/src/lib/guarderia-modalidad.ts`).
> **Encender esa línea es todo el trabajo de superficie que queda.**

---

## ① LO MEDIDO — 29-ago-2026, contra los tipos generados y el esquema

| | qué falta | por qué no sirve lo que hay |
|---|---|---|
| **el filtro** | `obtener_guarderias_disponibles` **no acepta `p_modalidad`** | el wrapper devuelve **los tres precios** (`precio`, `precioPaquete`, `precioMensual`), no **uno resuelto** como firma el contrato ① |
| **comprar paquete** | **no existe RPC** de compra de paquete de guardería | `comprar_paquete_salidas` es del **paseo**: cobra contra `prestador_servicios.precio_paquete`, **la columna que el contrato de paquetes ⑤ descartó explícitamente para guardería**. *Usarla no daría error: cobraría un número que nadie configuró.* |
| **consumir un día del paquete** | no existe | lo declara el propio contrato de paquetes en su ⑥ |
| **contratar la mensualidad** | no existe hermano de `contratar_plan_paseo` | `precio_mensual_plan` **se configura y nadie lo cobra** |

---

## ② LA FIRMA QUE CAMBIA EL MOLDE DEL PAQUETE — y hay que decirla, porque INVIERTE al paseo

> ### **En guardería, comprar el paquete SÍ agenda: el toggle de la primera sesión va prendido y es obligatorio en la primera compra.** Se paga el paquete ENTERO en un solo cobro, y quedan N−1.

**En el paseo es al revés, y está escrito en su código:** *«COMPRAR NO ES RESERVAR — esta
pantalla no sabe de fechas ni horas»* (`explorar/paseo/paquete.tsx`), y su bono es **del hogar**
(ni siquiera pide mascota). El contrato del filtro ya lo refleja: para `paquete`, `fecha`
significa **el primer día a agendar**.

⚠️ **Se declara acá porque es exactamente la clase de diferencia que alguien «cura» después
copiando al hermano.** *Las dos son correctas: son dos productos distintos con el mismo
mecanismo.*

---

## ③ LO QUE C YA TIENE MONTADO Y ESPERA

- **La etapa 1** (`explorar/guarderia/index.tsx`): `SelectorSegmentado` con las tres.
- **La etapa 2** (`disponibles.tsx`): el rótulo del día **ya habla por modalidad** (el día a
  agendar · **el primero** · el de **inicio**) y el selector de tamaño **5·10·15 ya está**,
  espejo del `CHECK` de `guarderia_paquetes`.
- **El precio de cada lugar** se lee del campo de **su** modalidad, **sin una sola cuenta en la
  pantalla** — el día que el filtro devuelva `precio` resuelto, las tres ramas colapsan a una.

---

## ④ 🔴 LA TRAMPA, PARA QUIEN ENCIENDA LA COMPUERTA

> **NO se enciende una modalidad porque su pantalla esté lista.** Se enciende cuando **el
> filtro acepta `p_modalidad`** y existe su RPC de cobro.

*Encenderla antes mostraría, bajo el rótulo «Paquete», la lista de lugares que ofrecen **día**
— y ése es el defecto que esta sesión viene cazando: el que no falla, el que omite.*

**Mientras tanto no hay callejón:** con una sola modalidad **el selector no se dibuja** (N=1
colapsa, *«con un turno nadie ve la palabra»*) y el flujo entra directo al camino del día.

---

## ⑤ Y UNA QUE ES DE LETRA, NO DE CÓDIGO

El encargo del founder ancla las ventanas de cancelación de guardería a **P18**, *«al inicio de
la franja de recogida»*. **Medido: `P18` cubre, por su propio encabezado, «el paseo INDIVIDUAL
pagado, ni plan ni paquete», y guardería no tiene hermana** (`P22`, la clínica, sigue
*DECLARADA sin letra* desde S76).

**No bloquea nada de lo de arriba** —cancelar y reagendar no entran en esta tanda— pero
**depositar la política es de A**. *Una ventana aplicada por analogía, sin letra, es la clase de
regla que después nadie puede citar cuando una familia reclama.*
