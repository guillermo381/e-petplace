# S114-A → C · EL SALDO ES PAGO MIXTO — el checkout cambia de puerta

**De A (conductor + packages/api). Firma del founder, 8-sep-2026. Ya construido,
aplicado a la DB, probado (4 cinturones VERDE + E2E en vivo + edge deno 42/42).
Commit A: `b23f47e6` en `candidato/s114-2`.**

## Qué cambió, en una línea

El saldo dejó de ser «paga todo o nada». Ahora es **parcial + riel**: si la
familia tiene $13 y el pedido son $20, aplica **$13 de saldo** y el riel cobra
**$7**. Y **`pagar_compra_con_saldo` YA NO EXISTE** (se dropeó de la DB) — la
reemplaza `aplicar_saldo_a_compra`. Tu `checkout.tsx` la usa (`pagarCompraConSaldo`
en las líneas 83 y 845): **hay que reconectarlo o el checkout del saldo rebota.**

## El contrato nuevo (wrapper de `@epetplace/api`)

```ts
import { aplicarSaldoACompra } from '@epetplace/api';
// export type ResultadoSaldoACompra =
//   | { modo: 'pagado';   saldoAplicado: number; saldoRestante: number; duplicado: boolean }
//   | { modo: 'mixto';    saldoAplicado: number; restoACobrar: number; saldoRestante: number }
//   | { modo: 'sin_saldo'; restoACobrar: number; saldoRestante: number };

const r = await aplicarSaldoACompra(compraId /*, montoSaldoOpcional */);
if (!r.ok) {
  // r.codigo: 'sin_sesion' | 'compra_no_existe' | 'no_es_tuya' |
  //           'compra_no_pagable' | 'pago_sin_reserva' | 'sin_familia' | 'error'
  // (YA NO hay 'saldo_insuficiente': el mixto aplica lo que haya y el riel cubre el resto)
  return mostrarError(r.mensaje);
}
switch (r.data.modo) {
  case 'pagado':    // el saldo cubrió TODO. La compra YA está pagada. NO llames al riel.
    return checkoutExitoso();
  case 'mixto':     // reservó r.data.saldoAplicado; falta cobrar r.data.restoACobrar por el riel.
  case 'sin_saldo': // no había saldo; el riel cobra r.data.restoACobrar (= total).
    return irAlRiel(compraId); // ⬅️ pagos-cobro IGUAL que hoy (ver abajo)
}
```

## El riel NO cambia de llamada

Para `mixto` y `sin_saldo`, **llamás a `pagos-cobro` con la compra EXACTAMENTE
como hoy** (`{ compra_id }`). El edge ya lee `compras.saldo_aplicado` y cobra
`total − saldo_aplicado` server-side. **No le mandes ningún monto** (lo rebota:
`monto_no_se_recibe`). Vos no calculás la diferencia: el motor la sabe.

## El orden en el checkout

1. `aplicarSaldoACompra(compraId)` PRIMERO (reserva el saldo o paga entero).
2. Si `modo==='pagado'` → listo, no hay riel.
3. Si `modo==='mixto' | 'sin_saldo'` → `pagos-cobro` por la diferencia.

*(Podés mostrar «$13 con tu saldo + $7 con tu tarjeta» usando `saldoAplicado` y
`restoACobrar` del resultado. La UI la componés vos.)*

## Lo que garantiza el motor (para que no lo re-implementes)

- **Atomicidad todo-o-nada** sobre los N pedidos de la compra (igual que el riel).
- **El saldo se consume DESPUÉS de que el riel confirma** (lo hace
  `confirmar_pago_compra` al llegar el webhook). Si el riel rebota, el saldo
  queda intacto — la familia no pierde nada.
- **La reserva evita el doble-gasto**: mientras la compra está en
  `esperando_pago` con saldo aplicado, ese saldo NO figura disponible para otro
  checkout (`obtenerMiSaldo` ya lo resta).
- **Reembolso per-source**: una devolución de una compra pagada mixta reparte a
  prorrata (la porción saldo vuelve al saldo, la porción tarjeta al riel). Eso es
  postventa (`caso_resolver`), no toca tu checkout.

## Qué te toca

Reconectar `checkout.tsx` (líneas 83 y 845) de `pagarCompraConSaldo` a
`aplicarSaldoACompra` con el `switch(modo)` de arriba. Cuando esté en tu punta
limpia, avisame el SHA por el buzón y lo junto en el próximo candidato (el
founder arma el próximo con el mixto + tu reconexión + B).

**Hasta que reconectes, el checkout del saldo rebota** (llama a un RPC que ya no
está). El founder lo sabe: recorre el `6354fbfe` sabiendo que le faltan tus curas.
