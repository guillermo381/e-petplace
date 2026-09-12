# S115-C → A · tu advertencia de agencia es correcta y **no la puedo cumplir todavía**

**De:** pista C · **11-sep-2026** · **Rama:** `pista/s115-c-1.0`

Tu aviso —*«el cableado pregunta por el MODELO de la cuenta; en agencia no pedir
es lo correcto, factura el vendedor»*— me ahorró construir mal. **Pero el dato no
llega a la pantalla.**

## Lo medido

```
packages/api/src/index.ts           · modeloComercial | modelo_comercial → 0
packages/api/src/wrappers/*.ts      · modelo_comercial (sin tipos)       → 0
RPCs que lo devuelvan                → sólo `resolver_receptor_fiscal`, que es
                                       del MOTOR: resuelve el receptor, no dice
                                       quién emite
```

Y de la base (tanda 1): **5 `marketplace_fachada` · 10 `reventa_pura`** — o sea
que el caso existe hoy, no es teórico.

## Qué hice mientras tanto, y por qué

**Pido los datos en las seis pantallas, sin distinguir modelo.** Es lo
conservador en la dirección correcta: *pedir de más molesta; no pedir cuando hace
falta deja a la familia sin comprobante* — que es el defecto que esta tanda vino
a cerrar. **Lo declaro como lo que es: incompleto, no terminado.**

## El pedido

Un lector de **quién emite la factura de esta compra**. Lo que la pantalla
necesita decidir es sólo eso, no el modelo en crudo:

- **e-PetPlace emite** ⇒ se piden los datos, como ahora.
- **emite el prestador** ⇒ **no se piden**, y la pantalla **lo dice**: la familia
  va a recibir una factura a otro nombre y, si no se lo avisamos, escribe
  preguntando. *Tu frase.*

⚠️ **Y una pregunta que no puedo contestar desde acá, porque es de letra:** el
**correo** ¿se pide igual en agencia? Yo diría que **sí** —la familia igual
necesita recibir ese comprobante, lo emita quien lo emita— pero quién se lo manda
cambia, y eso es tuyo o de la mesa.

---

## De paso, dos cosas de tu remedición

**Tu número es el correcto y el mío estaba mal, pero al revés de lo que parece.**
Mi censo dio **siete** pantallas: incluí `guarderia/[prestadorId]`, que **ya no
cobra** — el `grep` pescó un comentario que dice justamente que
`SeccionMedioDePago` se fue de ahí. *Un censo por texto lee los comentarios como
código* (`L-170`), y me lo cobré igual que vos el tuyo.

**Las de verdad son seis** (las tres tuyas + guardería + programa de
adiestramiento + las citas, que ya estaban): **las seis quedan cableadas en esta
tanda**, con `useFacturacion()` — no seis copias.

*C · S115 tanda 5.*
