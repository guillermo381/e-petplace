# 🔴 A → C · PRIORIDAD · El checkout fiscal falta en TRES pantallas, no en una

**Medido el 11-sep-2026, sobre el árbol de `main @ b65befcd` (tu merge incluido).**

## Lo que disparó la medición

El founder pagó desde la app y **el checkout no pidió correo ni datos de
facturación**. No fue un defecto de tu trabajo: **esa pantalla nunca lo tuvo**.

## Quién monta el compartido y quién no

Medido por **import real**, no por ocurrencia de la cadena:

| pantalla | monta `checkout-reserva` | |
|---|---|---|
| `explorar/paseo/checkout` | sí | ✅ |
| `explorar/guarderia/checkout` | sí | ✅ |
| `explorar/grooming/checkout` | sí | ✅ |
| `explorar/adiestramiento/checkout` | sí | ✅ |
| `explorar/veterinaria/checkout` | sí | ✅ |
| **`despensa/checkout`** | **no** | 🔴 |
| **`explorar/paseo/checkout-paquete`** | **no** | 🔴 |
| **`explorar/paseo/checkout-plan`** | **no** | 🔴 |

⚠️ **Una trampa que casi me hace corregir al founder con un número falso:**
`grep -c 'checkout-reserva'` sobre `despensa/checkout.tsx` devuelve **1** — y esa
única ocurrencia está **dentro de un comentario** (línea 1579, hablando del
glifo). *Un censo por cadena cuenta la palabra, no el uso*, y por un minuto tuve
«la despensa está cableada» apoyado en un comentario. Lo que decide es el
`import` y el montaje.

## Cuánto pesan, medido sobre los pagos aprobados reales

```
DESPENSA (compra)     32 pagos   $1.131,98   🔴
PAQUETE de paseo      15 pagos   $  577,50   🔴
PLAN de paseo          3 pagos   $  414,00   🔴
                      ──────────────────────
SIN CABLEAR           50 de 109 pagos (46 %) · $2.123,48 de $4.739,45 (45 %)
```

**Casi la mitad del volumen pasa por una pantalla que no pide los datos
fiscales.** El founder lo dijo de la despensa y la medición lo amplió: son tres,
y las dos de paseo (paquete y plan) no estaban en el radar de nadie.

## Lo que NO es un hueco, para que no pierdas tiempo ahí

El documento del pago del founder nació `pendiente_manual` con motivo
**`agencia_factura_el_tercero`**, sin receptor y sin correo — y **eso está
bien**: la compra fue a `TODO EN UNO DE PRUEBAS S97`, cuya cuenta es
`marketplace_fachada`. **En agencia factura el vendedor, no nosotros**, así que
no pedir datos fiscales es lo correcto para ESE caso.

⇒ **El cableado tiene que preguntar por el MODELO de la cuenta**, no pedir
siempre: en `reventa_pura` se piden los datos; en `marketplace_fachada` no se
piden **y conviene que la pantalla lo diga**, porque la familia va a recibir una
factura de otro nombre. *Sin eso, el primer «¿por qué mi factura dice otra
empresa?» llega a soporte sin que nadie pueda explicarlo.*

## 🔴 El peso real, medido con dos compras del founder — y son un PAR DISCRIMINADOR

Pagó dos veces desde la despensa y cayeron en los dos modelos comerciales. Sin
quererlo armó la prueba que distingue lo que hay que construir de lo que no:

| | $24,90 | **$70,90** |
|---|---|---|
| cuenta | `marketplace_fachada` | **`reventa_pura`** |
| quién factura | el vendedor | **NOSOTROS** |
| documento | `pendiente_manual` | **`esperando_receptor`** |
| motivo | `agencia_factura_el_tercero` | **`supera_tope_sin_identificacion`** |
| ¿es correcto? | **sí** — no pedimos datos | **sí** — pero la venta queda trabada |

⇒ **El fail-closed hizo su trabajo: sobre el tope, sin identificación, el
documento NO sale.** *Facturar a «consumidor final» algo que por ley exige
identificación sería emitir mal a propósito para no dejar un hueco visible* — y
no lo hizo.

**Pero el costo lo paga la familia y no se ve:** compró, se le cobró, y su
factura **no existe y no va a existir** hasta que alguien entre a la base. Ella
no se entera de nada.

🔴 **Y esto sube la urgencia de la despensa por encima de las otras dos:** arriba
de $50 **no es una preferencia del cliente, es un comprobante que el SRI no
acepta sin identificar**. Hoy un pedido de cualquier monto pasa sin pedir nada.

✅ **Lo que sí funcionó, y conviene saberlo antes de tocar nada:** el documento
nació con **1 línea y base 70,90** — el motor resolvió la base imponible sobre
un pago real. *Del lado del motor no falta nada: falta que la pantalla pregunte.*

## Lo que ya tenés de mi lado, sin construir nada

- `fiscalTopeConsumidorFinal()` — el tope, fail-closed.
- `fiscalObtenerTaxProfile()` / `fiscalGuardarTaxProfile()`.
- El motor resuelve el receptor solo: perfil fiscal → correo de la cuenta →
  **espera** si no hay ninguno. Vos no tenés que decidir eso.

**Lo único que falta es que las tres pantallas monten lo que ya construiste.**

## Prioridad y por qué

**Va antes de octubre.** La despensa factura igual que los servicios, y con
paquete y plan adentro es el 46 % de los pagos. *Lo que hoy produce es un
documento `pendiente_manual` por cada compra — no se pierde plata, pero alguien
tiene que cerrarlos a mano, uno por uno.*
