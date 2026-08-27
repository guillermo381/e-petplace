# FICHAS `D-948` · `D-949` · `D-950` — S107-CERT (27-ago-2026)

> Números verificados libres **por grep** contra `DEUDAS_CANONICAS.md`
> (tope real `D-944`; `D-946`/`D-947` los tomó esta misma sesión).
> ⚠️ **`D-945` sigue TOMADO y NO DEPOSITADO** — vive en
> `docs/loop/S106-C-CIERRE.md:200`. Patrón `D-757`.

---

## 🟡 `D-948` — EL COMPROBANTE DEL PROVEEDOR DICE «COMPRA» EN UNA CITA

**Medido en el crudo de Nuvei del reverso `DF-2106081`, que es una CITA:**

```json
"product_description": "e-PetPlace compra"
```

Comparado con el de una compra real (`DF-2106074`):

```json
"product_description": "e-PetPlace compra 6488a891"
```

⇒ La descripción se arma con **plantilla de compra**, y en una cita queda además
**sin identificador**: la palabra sobra y el id falta.

**Por qué importa aunque no sea funcional:** `product_description` es **lo que
Erick ve en la consola de Nuvei**, y lo que va a aparecer en cualquier reporte
del proveedor. *Es nuestra voz del lado de un tercero — el único texto nuestro
que se lee sin abrir nuestra app.*

**Dónde:** `pagos-cobro/index.ts`, el bloque `order.description`, que hoy hace
`` `e-PetPlace compra ${compraId.slice(0,8)}` `` con `compraId` vacío en citas.
**Disparo:** antes de la certificación con Erick — es superficie que él mira.

---

## 🟢 `D-949` — LA CANCELACIÓN DEL PEDIDO NO TOCA `pedido_items.estado_item`

**Medido en el reverso `DF-2106074`:** el pedido `bfdbfd0d` pasó de
`pago_capturado` a `cancelado_sistema`, y su ítem (`ACTIVE MIND 7+ x1`) **quedó
en `estado_item = 'pendiente'`, igual que antes.**

🔴 **Se ficha SIN CURAR, a pedido del founder, y la razón es la ficha:**

> **O es correcto por diseño —el ítem no tiene por qué seguir al pedido— o es
> residuo. Y hoy nadie sabe cuál.**

*Curarlo sin saber cuál de las dos es sería elegir una semántica por defecto
para una columna que quizá ya tenía otra.* Lo que hay que responder antes de
tocar nada: **¿quién lee `estado_item`, y qué decide con él?** Si nadie lo lee,
la pregunta es si la columna debe existir.

**Disparo:** la primera pantalla o lector que consulte `estado_item`, o la mesa
que decida su semántica — lo que llegue primero.

---

## 📌 `D-950` (registro, no deuda) — EL QUINTO OFICIO HEREDA EL MOTOR ENTERO

**Ejercido el 27-ago con el reverso de `DF-2106081`, cita `d41c9dea`,
`tipo_servicio = telemedicina`.**

Sin una sola línea escrita para telemedicina, el reverso:

| | |
|---|---|
| cobró | `DF-2106081` · $24,00 · auth `MFfZJL` |
| movió el sujeto | cita → `cancelada` en **los dos ejes** (`estado` y `estado_reserva`) |
| liberó el horario | la cita deja de ocupar |
| avisó al prestador | **primer `pago_reversado` de la historia del producto** — `dest=4f572081`, que es el `user_id` del prestador `de680000` de esa cita |

> **La letra afirmaba que el oficio nuevo hereda el motor; nadie lo había
> ejercido. Ahora está medido de punta a punta.**

Y su corolario, que es lo que lo vuelve barato: *un oficio nuevo que se apoya en
el motor no necesita su propio circuito de pagos — necesita que alguien lo
ejerza una vez para saber que no lo necesita.*

⚠️ **Lo que este ejercicio NO cerró:** `obtener_cita_resuelta` sigue
**NO CONCLUYENTE**. Llamada por SQL rebota en `{"ok": false, "codigo":
"sin_sesion"}` **antes** de llegar a su brazo `pago_reversado`. Se ejerce
abriendo el detalle de esa cita **en la app, con sesión** — gate del founder en
el aparato, no medible desde acá.
