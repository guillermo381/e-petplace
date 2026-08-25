# CONTRATO D→C · la puerta del riel DeUna

> **De:** pista D (S103) · **Para:** pista C (superficies) · **22-ago-2026**
> **Estado:** las dos edge functions están **escritas y NO desplegadas**
> (deploy pide autorización del founder por tanda).
> **Qué es esto:** el contrato que C consume. El plan §1 dice *«C no inventa
> contratos: consume lo que A y D declaren»* — acá está el mío.
>
> ⚠️ **Lo que este contrato NO puede prometer todavía, y por qué:** el
> `pointOfSale` de nuestro comercio sigue sin dato (bitácora S103-D §2ter), así
> que **`payment/request` nunca se ejecutó con éxito**. La forma de la RESPUESTA
> —`numericCode`, y si el vencimiento viene del proveedor— está escrita contra
> la doc, no contra una corrida. **Todo lo marcado ⚠️ abajo se re-verifica el
> día que haya POS.** *Lo demás sí está medido contra QA.*

---

## 1 · LA PUERTA — `pagos-deuna-solicitud`

`POST /functions/v1/pagos-deuna-solicitud`

### Qué recibe

```jsonc
// Authorization: Bearer <JWT de la familia>   ← la sesión ES la autorización
{ "compra_id": "<uuid>" }     // O
{ "cita_id":   "<uuid>" }     // exactamente uno de los dos, jamás los dos
```

🔴 **El monto NO viaja.** Si mandás `monto`, `amount` o `total` la puerta
**rechaza con `monto_no_se_recibe`** en vez de ignorarlo. *Ignorarlo dejaría
vivo un cliente que se cree con esa facultad, y el día que el server confíe
cobra lo que el cliente diga.* El monto sale del desglose congelado.

### Qué devuelve — camino feliz

```jsonc
{ "ok": true,
  "intento_id": "<uuid>",
  "codigo": "483920",                        // ⚠️ los 6 dígitos — firma ①
  "expira_en": "2026-08-22T14:33:00.000Z",   // ⚠️ el reloj DEL CÓDIGO
  "monto": 24.50, "moneda": "USD",
  "estado": "esperando_pago" }
```

🔴 **`estado` JAMÁS dice «pagado».** Que exista el código no significa que
alguien haya pagado. La pantalla **espera y consulta**; la transición a pagada
la dice el servidor.

### Qué devuelve — los rechazos, con su voz

Todos son `{ "ok": false, "codigo": "<...>" }`. **La voz la escribe C**; acá va
el código y **qué le pasó de verdad al cliente**, que es lo que decide el texto.

| `codigo` | HTTP | Qué pasó | Salida para el cliente |
|---|---|---|---|
| `sin_sesion` | 401 | no hay JWT | volver a entrar |
| `sesion_no_verificable` | 503 | **no es del usuario** — auth no respondió | reintentar; *jamás "cerrá sesión"* |
| `datos_invalidos` | 400 | ni compra ni cita, o las dos | defecto nuestro |
| `monto_no_se_recibe` | 400 | el cliente mandó un monto | defecto nuestro |
| `compra_no_existe` / `cita_no_existe` | 409 | no existe **o es de otro** — *la misma respuesta a propósito: distinguirlas sería un oráculo de compras ajenas* | volver atrás |
| `desglose_incompleto` | 409 | no hay desglose congelado | no se cobra; soporte |
| **`monto_invalido`** | 409 | **el desglose existe pero su total no es > 0** — defecto nuestro, no del cliente | no se cobra; soporte. *Jamás «tu pago falló»: la persona no tiene nada que corregir* |
| `metodo_no_permitido` | 405 | no llegó por POST | defecto nuestro; el wrapper siempre usa POST |
| `<código de compuerta>` | 409 | E3: stock vencido, vendedor inactivo… | **la causa real, y la tarjeta nunca se enteró** (§7 letra madre) |
| `sin_respuesta` | 504 | DeUna no contestó | **NO es rechazo.** Reintentar |
| `no_se_pudo_completar` | 409/500 | el proveedor rechazó la solicitud | soporte, con `motivo` |
| `servidor_sin_configurar` | 500 | falta un secret (**hoy: el POS**) | defecto nuestro |

> 🔴 **`sin_respuesta` y `sesion_no_verificable` no son rechazos y no pueden
> vestirse como tales.** *Un timeout dibujado como rechazo hace que el cliente
> vuelva a pagar algo que ya pagó — es la clase de error que cuesta doble.*

> ⚠️ **`monto_invalido` y `metodo_no_permitido` se agregaron el 22-ago, tarde.**
> La puerta los emitía desde el principio y **este contrato no los declaraba**;
> aparecieron cruzando la tabla contra los códigos que la función emite de
> verdad. **A tradujo fielmente un contrato incompleto**, así que
> `CodigoDeuna` en `packages/api` tampoco los tiene — y su `codigo as
> CodigoDeuna` los deja pasar en runtime **sin que TypeScript se entere**.
>
> *Un contrato escrito a mano diverge de la función que describe en el momento
> exacto en que alguien agrega un `return` — y nadie lo nota, porque el
> contrato sigue siendo cierto sobre todo lo que sí menciona.*

---

## 2 · LOS DOS RELOJES — y no se mezclan nunca

`LETRA_DEUNA` §6 lo dice y la base lo hace inexpresable de otro modo
(`chk_codigo_con_vencimiento`):

| reloj | dónde vive | qué gobierna | qué pasa al vencer |
|---|---|---|---|
| **el CÓDIGO** | `expira_en` de la respuesta | los ~3 min del código | **«Generar un código nuevo»** — llamás la puerta otra vez |
| **el HOLD** | el sujeto (reserva de stock · hold de agenda) | **la sesión de pago entera** | no nacen más códigos; **rearme** contra stock/agenda vigente |

**Regla:** mientras el hold viva, el cliente puede regenerar códigos. Muerto el
hold, muere la sesión.

⚠️ **Tensión declarada, y para C importa:** la doc del proveedor dice *«3
minutos fijos, no configurables»*, **pero el `payment/request` acepta un campo
`expiredTime`** — y un campo que se manda es algo que se elige. Sin resolver
(pregunta #10 a soporte). **Por eso la puerta devuelve `expira_en` como
timestamp y no un número de minutos: C pinta la cuenta regresiva contra ESE
valor y no contra un 3 hardcodeado.** *Si el vencimiento real resultara otro, la
pantalla se acomoda sola en vez de mentir un tiempo que nadie va a verificar.*

---

## 3 · LOS ESTADOS QUE LA PANTALLA VE

Mapeo de `LETRA_DEUNA` §6 al lado de C:

| situación | cómo lo sabe C | la voz (tuteo) |
|---|---|---|
| código vivo | `expira_en` en el futuro | «Ingresá este código en tu app Deuna» + cuenta regresiva |
| código vencido, hold vivo | `expira_en` pasado | «El código venció — generá uno nuevo» + botón |
| hold vencido | el sujeto lo dice | la del rearme existente |
| **pagada** | **la consulta al servidor**, jamás el reloj | la del éxito vigente |
| reversada | el sujeto | la del reverso |

🔴 **La pantalla pasa sola a pagada y JAMÁS declara.** El actuador sólo
transiciona con verdad verificada del proveedor. **C no puede inferir «pagado»
de que el cliente diga que pagó, ni de que el código se haya consumido.**

🔴 **Y no hay `NOT_FOUND` que ayude:** medido contra QA, consultar una
transacción inexistente devuelve **200 con `PENDING`** y una frase
tranquilizadora. *Así que «todavía pendiente» nunca es prueba de nada por sí
solo* — por eso la verdad la resuelve el servidor y no la pantalla.

---

## 4 · LO QUE NO EXISTE EN v1 (para que C no lo dibuje)

- **No hay alta, no hay token, no hay OTP.** DeUna es push: la fila «Deuna» en
  «Cómo quieres pagar» **no gestiona nada — se elige y se paga.**
- **QR y deeplink NO tienen pantalla.** La firma ① del founder es **el código**.
  Los dos vienen en la respuesta del proveedor y quedan en el crudo como
  reserva; encenderlos algún día es decisión de producto, no obra de motor.
- **No hay pago mixto saldo+Deuna** (es del motor de saldo, S102).
- **No hay recurrencia sobre DeUna** (§8 de su letra: es push).

---

## 5 · LO QUE C PUEDE CONSTRUIR HOY, Y LO QUE NO

✅ **Puede:** la fila «Deuna» en la hoja · la pantalla del código con su cuenta
regresiva contra `expira_en` · el botón «Generar un código nuevo» · las voces de
la tabla §3 · los rechazos de la tabla §1.

⚠️ **No puede cerrar todavía:** el enchufe real contra la puerta — **está
escrita pero no desplegada**, y su primer request exitoso depende del POS.
*Marcá el enchufe como pendiente con nombre, como el plan §1 te ordena.*

📌 **Y si algo de este contrato cambia cuando haya POS, te lo digo yo** — no lo
descubras en el checkpoint.
