# S114-A → C · «Reconocer parcial» pide MONTO y RAZÓN — la superficie es tuya

> Del recorrido del founder: el prestador podía «reconocer parcial» sin decir
> cuánto. El motor ya está curado; la pantalla la montás vos.

## El contrato (wrapper `reconocerYResolver`, ya en packages/api)

```ts
reconocerYResolver(casoId, {
  alcance: 'total' | 'parcial' | 'sin_devolucion',
  monto?: number,     // 🔴 OBLIGATORIO cuando alcance='parcial'
  motivo?: string,    // 🔴 la razón del prestador (opcional; si va vacía, el motor
                      //    pone «el prestador lo reconoció»)
})
```

Códigos de error nuevos a mapear en la UI:
- `monto_requerido_en_parcial` — parcial sin monto (o ≤ 0).
- **`monto_supera_total`** — el monto parcial supera el total del objeto. **El rebote
  trae el tope**: el motor devuelve `{ ok:false, codigo:'monto_supera_total', total }`.
  Usalo para decir «no puede superar $X» y, si querés, cap­ear el input en el tope.

## Lo que tiene que pedir la superficie de «reconocer parcial»

1. **Un monto** (obligatorio) — con el tope a la vista. El objeto tiene un total
   conocido (una cita, un pedido, etc.); el motor lo capea y rebota `monto_supera_total`
   con el `total` adentro si te pasás, así que podés mostrarlo antes de enviar.
2. **Una razón** (texto) — viaja como `motivo`. Es lo que el prestador reconoce; se
   guarda en el caso. Si el prestador no escribe nada, el motor pone el default, pero
   la pantalla debería pedirla (es lo que el founder quiere ver).

## Lo que el motor garantiza (no lo re-implementes)

- **El parcial se aplica SOLO, sin pasar por la casa** (firma del founder): el prestador
  reconoce desde `con_prestador` y el caso pasa a `resuelto_entre_partes`. No hay paso
  de la casa en el medio.
- **Reparte per-source igual que el completo**: si la compra fue mixta, la porción saldo
  vuelve al hogar y la porción tarjeta al riel, a prorrata `saldo_aplicado/total`, con el
  MISMO factor para el parcial. No calculás el reparto vos.
- El tope cubre citas (desglose o precio propio) y pedidos. Una estadía de guardería sin
  devengo es el único borde sin tope (declarado; raro). No es tu problema en la UI.

## Qué te toca

La pantalla de «Reconocer parcial» en el prestador: input de monto (con el tope) + campo
de razón, y mapear `monto_requerido_en_parcial` / `monto_supera_total`. Cuando esté en tu
punta, avisame el SHA por el buzón.
