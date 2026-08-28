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

---

### 🔴 EL ALCANCE EXACTO DE ESTA AFIRMACIÓN — para que nadie la lea como excepción

**Esta ficha afirma sobre el MOTOR, y solo sobre el motor.** El mismo día, el
founder pagó otra cita de telemedicina (`1ef3e69d`, `DF-2106376`) y **no le
apareció del lado del cliente**. Medido punto por punto, **el motor hizo todo
bien**: intento `aprobado`, cita `confirmada` + `pagada`, atada a Thor, pasando
los seis filtros del lector —incluida la RLS, probada por camino real con su
sesión— y en **posición 3 de 15** dentro de un límite de 50.

**Dónde se cortaba:** su APK es el **1.0.5, compilado de `357ce8e3` el 24-ago**,
y `git show 357ce8e3:apps/cliente/src/app/citas/[mascotaId].tsx | grep -c
telemedicina` da **0**. La superficie del cliente aprendió telemedicina en
`a1fa895b` (S106-C), **después** de ese binario. Y el OTA no la alcanza: `main`
subió a 1.0.6 y el update vigente está anclado en `bde35600`.

> ### El motor heredó entero. Lo que no heredó es la SUPERFICIE INSTALADA — y eso es una afirmación sobre un binario de hace tres días, no sobre el motor.

**El prestador sí la veía**, y no porque su app fuera nueva: **telemedicina nació
del lado del prestador primero**, así que su lector ya la conocía en `357ce8e3`.
*Los dos lados avanzaron en tiempos distintos y el cliente quedó atrás.*

🔴 **Y la regla que este caso deja, que vale más que el caso:**

> **Hasta que el binario esté al día, un «no aparece» del cliente no prueba nada
> del producto.** Un reporte de campo contra un binario vencido mide el binario,
> no la pieza — y se lee exactamente igual que un defecto real.

*Por eso `D-950` no tiene excepción: no hay ningún tramo del motor que
telemedicina no haya heredado. Lo que hubo fue un aparato midiendo otra cosa.*
