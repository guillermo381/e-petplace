# CONTRATO A→C · el wrapper de la puerta DeUna

**Pieza:** `packages/api/src/wrappers/pagos-deuna.ts` · exportado desde
`@epetplace/api`.

> ⚠️ **Acá NO va un conteo de líneas.** Lo había, decía «162», y **venció el
> mismo día** — `L-361`: *un número en un documento es una medición con fecha de
> vencimiento.* **Se mide con el comando, no con la memoria:**
> `git show main:packages/api/src/wrappers/pagos-deuna.ts | wc -l`

**Autoría del contrato de servidor: S103-D**
(`docs/relevamientos/S103-D-CONTRATO-PUERTA-DEUNA-para-C.md`).
**Autoría del wrapper: S103-A**, porque `packages/api` es su territorio **y
porque la casa tiene UNA puerta a la DB y a las functions.**

> ⚠️ **Este documento existe para que el contrato no viva sólo en un mensaje.**
> `L-355` se cobró hoy exactamente así: un contrato entregado por mensaje, luego
> cambiado abajo sin avisar, y el receptor tradujo con fidelidad algo que ya no
> existía. **Si el wrapper cambia, cambia acá — y quien lo cambie avisa a C por
> nombre.**

---

## 1 · QUÉ RECIBE

```ts
import { pedirCodigoDeunaCompra, pedirCodigoDeunaCita } from '@epetplace/api';

const r = await pedirCodigoDeunaCompra(compraId);   // o …Cita(citaId)
```

**Y no hay más forma de llamarlo.** El tipo es una unión discriminada:

```ts
type SujetoDeuna = { tipo: 'compra'; id: string } | { tipo: 'cita'; id: string };
```

🔴 **NO EXISTE dónde poner un monto.** El servidor además lo **rechaza**
(`monto_no_se_recibe`) en vez de ignorarlo — *ignorarlo dejaría vivo un cliente
que se cree con esa facultad, y el día que el server confíe cobra lo que el
cliente diga.* **Desde el lado de C el estado malo es INEXPRESABLE, no sólo
rechazado.** El monto sale del **desglose congelado**.

**La autorización es la sesión.** `functions.invoke` la lleva sola. **Ningún
secreto compartido: una app publicada no los guarda.**

---

## 2 · QUÉ DEVUELVE

```ts
{ ok: true, data: {
    intentoId: string,
    codigo: string,       // los seis dígitos que la persona teclea EN LA APP DE DEUNA
    expiraEn: string,     // ISO · el reloj DEL CÓDIGO
    monto: number,
    moneda: string,       // 'USD' si el servidor no lo dice
    estado: 'esperando_pago',
} }
```

🔴 **`estado` JAMÁS dice «pagado», y el tipo lo hace literal.** Que exista un
código **no significa que alguien pagó** — el código es *una invitación a pagar
en otra app*. **La transición la dice el servidor por consulta activa** (§7).
*Una pantalla que celebre al recibir el código estaría celebrando que se imprimió
un ticket, no que entró la plata.*

**El wrapper verifica la forma antes de devolverla** (fail-closed): si falta
`codigo`, `expira_en`, `intento_id` o `monto`, devuelve
`no_se_pudo_completar` / `respuesta_incompleta` **en vez de un `ok:true` a
medias**. *Un `ok:true` sin código pintaría una pantalla de pago sin código que
teclear — y eso se ve como defecto del proveedor cuando es nuestro.*

---

## 3 · LOS ESTADOS — **y son DOS RELOJES que no se mezclan nunca**

| reloj | de dónde sale | qué gobierna | la cura al vencer |
|---|---|---|---|
| **el CÓDIGO** | `expiraEn` de esta respuesta | los ~3 min del código | **«generá uno nuevo»** — se vuelve a llamar la puerta |
| **el HOLD** | el sujeto (reserva de stock · hold de agenda) | **la sesión de pago entera** | **REARME** contra stock/agenda vigente |

🔴 *Confundirlos hace que la pantalla ofrezca un código nuevo cuando lo que
venció fue la reserva — **y el código nuevo tampoco va a servir.***

| situación | cómo se sabe | la voz (tuteo) |
|---|---|---|
| código vivo | `expiraEn` en el futuro | «Ingresá este código en tu app Deuna» + cuenta regresiva |
| código vencido, hold vivo | `expiraEn` pasado | «El código venció — generá uno nuevo» + botón |
| hold vencido | **lo dice el sujeto**, no este wrapper | la del rearme existente |
| **pagada** | **la consulta al servidor**, jamás el reloj | la del éxito vigente |
| reversada | el sujeto | la del reverso |

---

## 4 · 🔴 CÓMO SE DISTINGUE EL FALLO DEL PROVEEDOR DEL FALLO NUESTRO

**Los códigos viajan TAL CUAL desde el servidor** — no se traducen ni se
colapsan acá, *para que un tablero cuente lo mismo que el motor dice*. **Y se
clasifican en cinco familias, porque cada una pide una voz distinta:**

### ① DEFECTO NUESTRO — la persona no hizo nada mal y no puede arreglarlo
`datos_invalidos` · `monto_no_se_recibe` · `servidor_sin_configurar` ·
**`desglose_incompleto`** *(movido acá por dictamen de mesa, 22-ago)*
*(hoy `servidor_sin_configurar` es el `pointOfSale` que falta).*
**Voz: disculparse y ofrecer soporte. Jamás pedirle que reintente algo que no
va a cambiar.**

### ② LA COMPUERTA — nuestro motor diciendo QUE NO SE PUEDE ENTREGAR
`pago_en_proceso` · `reserva_vencida` · `vendedor_no_activo` ·
`monto_divergente` · `compra_sin_pedidos`

> ⚠️ **`desglose_incompleto` SALIÓ de esta familia** — dictamen de mesa,
> 22-ago-2026: **pasa a ① DEFECTO NUESTRO, y no depende del sujeto.** *El
> desglose congelado es artefacto nuestro; la persona no tiene nada que
> corregir volviendo atrás, ni en una compra ni en una cita.* **Voz: soporte,
> jamás «reintentá».**
> *Se corrige acá el mismo día del dictamen porque un contrato que conserva la
> clasificación vieja **envejece por omisión** — sigue siendo cierto sobre todo
> lo demás que menciona, que es exactamente `L-369`.*

🔴 **Los que QUEDAN en esta familia llegan con LA CAUSA REAL y el proveedor NUNCA SE ENTERÓ** — es la
letra madre de §7: *primero se verifica que se pueda entregar, después se pide
la plata.* **Voz: la causa concreta y su salida** (rearmar, elegir otro día,
volver atrás). *Decir «no se pudo procesar el pago» acá sería mentir: el pago
nunca se intentó.*

### ③ EL PROVEEDOR RECHAZÓ
`no_se_pudo_completar` — viene con `motivo`.
**Voz: soporte, con el motivo.**

### ④ NADIE FALLÓ — es la red, y **NO ES UN RECHAZO**
`sin_respuesta` (504, DeUna no contestó) · `sesion_no_verificable` (503, auth no
respondió — **no es que la sesión sea inválida**).
🔴 **Voz: REINTENTAR.** *Dibujarlos como rechazo manda a la persona a soporte por
algo que se cura solo. Y `sesion_no_verificable` **jamás dice «cerrá sesión»**:
la sesión probablemente esté bien.*

### ⑤ AMBIGUO A PROPÓSITO — y conviene no «mejorarlo»
`compra_no_existe` · `cita_no_existe` — significan **no existe O es de otro**, y
**dan la misma respuesta a propósito**. *Distinguirlas convertiría la puerta en
un oráculo de compras ajenas.* **Voz: volver atrás. No se afina.**

### Y `sin_sesion` (401)
No es defecto de nadie: **volver a entrar.**

---

## 5 · LO QUE ESTE WRAPPER **NO** HACE

- **No consulta el estado del pago.** La transición a pagada la dice el servidor;
  la espera es de otra pieza.
- **No conoce el hold.** Sólo devuelve el reloj **del código**.
- **No traduce voces.** Devuelve códigos; **las voces son de C**, y esta tabla es
  el insumo para elegirlas — no las escribe.

## 6 · ESTADO OPERATIVO — medido, no recordado

| | |
|---|---|
| wrapper en `main` | ✅ exportado · typecheck 0 *(el largo se mide, no se cita)* |
| edge `pagos-deuna-solicitud` | 🔴 **ESCRITA Y NO DESPLEGADA** |
| bloqueante | **el `pointOfSale`** (D) — hasta que llegue, la puerta contesta `servidor_sin_configurar` |

⇒ **C puede construir contra el tipo hoy; el camino real llega cuando D
destrabe.** *Y eso es a propósito: el tipo es el contrato, y el contrato ya
existe.*
