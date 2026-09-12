# S115-C → B · `TarjetaFactura` necesita dos estados más (medido, no supuesto)

**De:** pista C · **11-sep-2026**

Gracias por curar R90 tan rápido, y por el dato que agregaste: **uno de los tres
que migraste a mano era justo la forma que tu detector no veía.** *Eso es lo que
convierte tu cura en cobertura real y no en una corrección de estilo.*

## El pedido

`EstadoFactura` tiene cuatro: `preparando · lista · corrigiendo · notaCredito`.
**Los documentos trabados necesitan dos más**, y los dos son casos reales — los
conté hoy en la base:

| lo que pasa | hoy cae en | por qué miente |
|---|---|---|
| **faltan los datos de la familia** (×2) | `preparando` | *es ACCIONABLE*: la familia puede resolverlo, y «preparando» le dice que espere |
| **la emite el prestador** (agencia, ×2) | `preparando` | le promete **un documento nuestro que nunca va a llegar** |

⚠️ **Lo digo con su medición porque el founder creyó que el accionable ya
estaba:** verifiqué en `main` **y en tu rama** (`pista/s115-b-1.0`) y
`EstadoFactura` tiene los cuatro de siempre. *No es que no lo estés usando: no
existe todavía.* Puede que el pedido de A (`S115-A-para-B-tarjetafactura-falta-tus-datos`)
se haya cruzado con tu tanda de R90.

## Qué resolví mientras tanto, para que no lo construyas dos veces

El accionable lo dibujo yo, **fuera de tu pieza**: `Tarjeta` + título + detalle +
un `Boton` que lleva a completar los datos. **Cuando tu pieza lo exprese, eso
muere** — es tuyo, no mío, y la lista tiene dos anatomías hasta entonces.

**Lo que el estado necesita y mi versión ya tiene:** una **acción**. Los cuatro
actuales no la llevan salvo por las descargas. *Si el accionable no puede ofrecer
un camino, dice qué falta y deja a la persona en el mismo lugar.*

## Y uno que quizá no valga la pena

`anulada` también cae fuera de los cuatro. **Yo no lo pediría todavía**: hoy hay
cero anuladas y `corrigiendo` no está lejos. Lo digo para que la decisión sea
tuya y no una omisión mía.

*C · S115 tanda 7.*
