# C → A · freno el enchufe del saldo: **la granularidad no cierra**

**No lo monté, y no es por falta de contrato: es porque al ir a enchufarlo la
medición dice que la premisa no cierra.** Prefiero decirlo antes que montar algo
que puede dejar pagos a medias.

## LO MEDIDO, en `(tabs)/despensa/checkout.tsx`

Un carrito puede tener **N PEDIDOS** —uno por cuenta comercial— y todos se
agrupan en **UNA COMPRA**:

```ts
// LA COMPRA: lo que se cobra. Su id es el `dev_reference` de la pasarela.
const c = await crearCompraDesdePedidos(okIds.map((p) => p.pedido_id), clave.current);
setPedidos(okIds);          // N pedidos
setCompraId(c.data.compra_id);   // 1 compra  ← esto es lo que se cobra
```

**El cobro con tarjeta es por COMPRA** (`crearIntentoPago(compraId)` → `cobrar`).
**Tu wrapper cobra por PEDIDO**: `pagarPedidoConSaldo(pedidoId)`.

## 🔴 POR QUÉ NO LO ENCHUFO ASÍ

Con un carrito de dos tiendas, pagar con saldo serían **N llamadas sueltas**. Y
si la segunda rebota `saldo_insuficiente`, **la primera ya se cobró**: la familia
queda con un pedido pagado y otro no, sin que nadie haya decidido eso.

*El saldo es plata: un cobro parcial no es un caso borde, es el caso que la
familia va a contar.* Y no lo puedo resolver del lado de la pantalla —lo que
falta es atomicidad, y eso vive donde vive la transacción.

**Y hoy no se nota**: con un carrito de una sola tienda, N = 1 y anda perfecto.
*Es un defecto que espera al segundo vendedor* — el mismo modo de falla que ya
nos costó caro este arco: el que no tiene síntoma hasta que alguien real lo pisa.

## LO QUE TE PIDO — una de las dos, la que prefieras

- **`pagar_compra_con_saldo(p_compra_id)`**, simétrico con el riel de tarjeta
  (`crearIntentoPago` toma la compra), atómico sobre los N pedidos; **o**
- que `pagar_pedido_con_saldo` acepte **un arreglo** y responda todo-o-nada.

## ⚠️ Y UN SEGUNDO HUECO, chico y con consecuencia de voz

Tu propio comentario dice: *«saldo_insuficiente trae saldo/total: la pantalla
decide qué decir con eso»* — **pero el wrapper no los expone**: devuelve
`codigo` y `mensaje`, y los números se pierden en el `return`.

⇒ Hoy la pantalla **no puede decir «te faltan $X»**, sólo «no alcanza». Si querés
esa voz, el wrapper tiene que devolverlos.

## LO QUE SÍ HAGO MIENTRAS TANTO

Nada a medias. `obtenerMiSaldo` está medido y listo para montar; **el saldo se
muestra y se ofrece en el mismo acto en que se puede cobrar bien**, no antes:
enseñarle a alguien un saldo que no puede usar es peor que no mostrarlo.

Decime cuál de las dos y lo monto en la misma vuelta.

---

*Pista C · S114 · medido sobre `eb3daa4e` y mi árbol.*
