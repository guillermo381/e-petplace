# S115-C → A · la línea del correo de pago: **escrita, y es tuya**

**De:** pista C · **12-sep-2026**

El founder pide una línea al pie del correo de confirmación de pago. **Medí dónde
vive y no es mío:** el cuerpo se compone en
`supabase/functions/despachar-correo/index.ts` (el HTML de la línea 327), no en
`packages/mensajeria` ni en una plantilla. **Territorio tuyo.**

Te paso el texto listo para pegar, así no hay que decidirlo dos veces.

## La línea

**es**
> Tu factura electrónica llega por correo en unos minutos, aparte de este comprobante.

**en**
> Your electronic invoice arrives by email in a few minutes, separately from this receipt.

### Las tres decisiones que tiene adentro

- 🔴 **«aparte de este comprobante» no es relleno.** Son **dos correos** y hay
  que decir que son dos. *Decir sólo «te mandamos tu factura» sobre un
  comprobante que ya está en la bandeja hace pensar que ése ES la factura* — y
  quien la necesite para su contabilidad va a mandar el papel equivocado.
- **«unos minutos», nunca un número.** El plazo lo pone el SRI y no lo
  controlamos. *Prometer «5 minutos» es fabricar un incumplimiento.*
- **Una sola línea.** La tentación es explicar el SRI, la autorización y el
  plazo; **nada de eso le sirve a alguien que acaba de pagar** y sólo necesita
  saber que hay algo más en camino.

## La segunda mitad de su pedido, y por qué hoy no aplica

Pidió que si el documento quedó **esperando sus datos** (monto sobre el tope),
el correo también lo diga. **Ese caso ya no se produce en pagos nuevos:** desde
`15baa738` el guard **no deja cobrar** sobre el tope sin identificación.

⇒ Si lo agregás, es **sólo para los pagos viejos** que ya quedaron trabados
(medidos: 2 en `esperando_receptor`). *Decidilo vos: puede no valer una rama en
el correo para un conjunto que no crece.*

## Lo que hice de mi lado — el mismo momento, otra superficie

La pantalla de éxito del pago (los cuatro oficios de cita) ya lo dice, **con la
misma voz**. Va **debajo del botón**: la acción principal es volver, y esto es
nota al pie — *arriba se leería como un paso más que hay que hacer, y no hay nada
que hacer salvo esperar el correo*.

⚠️ **Declarado: las otras cinco pantallas de éxito NO la tienen todavía**
(despensa · paquete · plan · guardería · programa). Cada una arma su éxito con su
propio layout, y meterlas a ciegas con un reemplazo de texto es cómo se rompe una
pantalla que nadie va a volver a mirar antes del OTA. **Entran en la próxima
tanda, de a una y mirando cada layout** — o antes, si el founder las quiere para
este recorrido.

*C · S115 tanda 12.*
