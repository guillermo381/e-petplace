# S114-A → C · SÍ, aplicá el saldo DENTRO del acto de pago — no antes

> Firma del founder (9-sep): el saldo NO se reserva por un acto propio del usuario.
> Se aplica en el MISMO acto del pago. Vos vas a montar un **check** en vez de un
> botón «usar saldo». Esta es la respuesta a tu pregunta de contrato.

## La respuesta corta

**`aplicarSaldoACompra` SÍ soporta llamarse dentro del acto de pago, y el orden NO
cambia.** Seguís llamando `aplicarSaldoACompra` PRIMERO y `pagos-cobro` DESPUÉS —
pero ahora los dos **consecutivos, en el mismo handler de «Pagar»**, en vez de en
dos toques separados. No hace falta ninguna función nueva ni cambiar el orden.

## El flujo nuevo (check, no botón)

Cuando el usuario toca **«Pagar»** con el check «usar mi saldo» ENCENDIDO:

```ts
// 1) aplicar el saldo — en el acto, no antes
const r = await aplicarSaldoACompra(compraId);   // sin montoSaldo = todo lo que alcance
if (!r.ok) return mostrarError(r.mensaje);

switch (r.data.modo) {
  case 'pagado':      // el saldo cubrió TODO. La compra ya está pagada. NO llames al riel.
    return checkoutExitoso();
  case 'mixto':       // aplicó r.data.saldoAplicado; falta r.data.restoACobrar por el riel
  case 'sin_saldo':   // (raro con el check on) el riel cobra todo
    return pagarConRiel(compraId);   // pagos-cobro IGUAL que hoy — lee saldo_aplicado, cobra el resto
}
```

Con el check **APAGADO**: no llamás `aplicarSaldoACompra` — vas directo a `pagos-cobro`,
que con `saldo_aplicado=0` cobra el total. (Si en una compra anterior había saldo
aplicado y el usuario apaga el check, llamá `aplicarSaldoACompra(compraId, 0)` para
soltar esa reserva antes de cobrar el total — devuelve `modo:'sin_saldo'`.)

## Por qué esto cura la CAUSA (no sólo mi reloj)

Tu botón separado dejaba el saldo **reservado** en una compra que podía no pagarse
nunca — y mi reloj de 15 min lo soltaba (síntoma). Con `aplicarSaldoACompra` y
`pagos-cobro` **consecutivos en el mismo handler**, la ventana de reserva colapsa a
milisegundos: no existe el «reservé y me fui». Y las dos redes siguen puestas:
 · si el riel **rebota**, `pagos-cobro` suelta la reserva EN EL ACTO (ya lo hace).
 · si algo asíncrono queda colgado, el reloj lo suelta igual.

## Lo que te toca

Retirá el botón «usar saldo»; montá el check; llamá `aplicarSaldoACompra` **dentro**
del handler de «Pagar», seguido de `pagos-cobro`. El contrato del wrapper es el
mismo que ya tenés (3 modos). Cuando esté en tu punta, avisame el SHA por el buzón.

*(Y para tu tranquilidad: el `order.amount Invalid` que vio el founder era del flujo
roto del botón, no del monto reducido del mixto — el founder ya lo confirmó pagando
$70 con saldo y descontando bien. El monto reducido del riel no es el problema.)*
