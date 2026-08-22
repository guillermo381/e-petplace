# S102-B → MESA (hilo con Erick / Nuvei) · **LO QUE SE PREGUNTA EN VEZ DE ADIVINARSE**

> **Estatuto: insumo para el hilo activo de la mesa. No es una tarea de pista.**
> *Cada pregunta viaja con **el literal medido de nuestro lado**, para que la
> respuesta se pueda cotejar contra un hecho y no contra un recuerdo.*
>
> **Ninguna de estas se completó de memoria, y ninguna se va a completar de
> memoria** — es la misma disciplina de `LETRA_DEUNA` §12.

---

## ① 🔴 LA TABLA DE `status_details` COMPLETA — **bloquea una cura**

**Qué pedimos:** la tabla oficial completa `status_detail` → significado, con su
`status` asociado.

**Por qué bloquea:** el motor tiene **un solo brazo** para todo lo no aprobado, y
la cura —separar «causa conocida» de «sin causa»— **exige saber qué significa
cada código**. *Mapear por parecido sería el defecto que el censo vino a medir.*

**Los códigos que YA recibimos en sandbox y no sabemos leer** *(medidos, no
recordados: `GROUP BY` sobre 103 filas de `webhook_events`, `pagos_eventos` y
`pagos_intentos.payload_crudo`)*:

| par `status/status_detail` | veces | qué hace hoy nuestro motor |
|---|---|---|
| `1/3` | 47 | **aprobado** ✅ |
| `success/3` | 14 | **aprobado** ✅ |
| **`0/31`** | 11 | ❓ cae en `desconocido` |
| **`2/32`** | 7 | ❓ cae en `desconocido` |
| **`2/7`** | 5 | ❓ *(nunca llegó al actuador — rebotó por firma)* |
| **`5/14`** | 4 | ❓ cae en `desconocido` |

**Intentado de nuestro lado y fallido, declarado:** dos fetch a
`developers.paymentez.com/api/` (con y sin el ancla `#status-details`). **La
sección no viaja en el render** — la página es una SPA. *Lo único que sí se pudo
confirmar de esa doc: los valores de `current_status` (`PENDING` · `APPROVED` ·
`CANCELLED` · `INITIATED` · `REJECTED` · `EXPIRED`) y los de `card.status`
(`valid` · `review` · `pending` · `rejected`).*

---

## ② 🔴 ¿PUEDE LA RESPUESTA DEL DÉBITO DEVOLVER `status: "1"` (numérico)?

**Esta es la pregunta más filosa del paquete, y su respuesta bifurca en dos
mundos distintos.**

### El literal de nuestras dos capas

**Capa 1 — el actuador** (`_pago_aprobado`, sobre el payload del **webhook**):

```sql
lower(status) IN ('1','success')  OR  upper(current_status) = 'APPROVED'
```

**Capa 2 — el cobro** (`pagos-cobro`, línea 315, sobre la respuesta del
**débito**):

```js
const aprobado = status >= 200 && status < 300 &&
  (tx.status === 'success' || tx.status === 'approved');
```

⇒ **La capa del cobro NO reconoce el `1` numérico.**

### Lo medido de nuestro lado

**Los dos vocabularios existen de verdad en nuestra base:** `1/3` (47 filas, por
webhook) y `success/3` (14, por respuesta de débito).

**Nuestra hipótesis, declarada como hipótesis:** el endpoint de débito responde
con el vocabulario de STRINGS y el webhook con el NUMÉRICO, así que cada capa
mira el suyo y la asimetría es correcta.

### 🔴 Por qué no la damos por buena sin la respuesta

| si Nuvei dice… | consecuencia |
|---|---|
| **«el débito puede responder `1`»** | 🔴 **es un defecto**: un cobro aprobado se leería como no aprobado. **Ficha inmediata.** |
| **«el débito siempre responde string»** | ✅ la asimetría es correcta — **y hay que DOCUMENTARLA con su porqué**, para que nadie la "unifique" a un solo vocabulario y rompa una de las dos capas |

> ### **Las dos respuestas producen trabajo. Ninguna produce «no hacer nada».**
>
> *Y la segunda es la peligrosa: una asimetría correcta y sin explicar es una
> invitación a que alguien la "arregle".*

---

## ③ 🟡 LOS ESTADOS DE TARJETA QUE NUNCA VIMOS

**Medido: `card.status` en nuestra base es `valid` en las 8 filas.
`review`, `pending` y `rejected` — cero.**

**Preguntas:**
1. ¿En qué casos concretos el alta devuelve **`review`**, y **cuánto puede
   durar** ese estado?
2. ¿Hay **notificación** cuando un `review` se resuelve, o hay que consultar?
3. ¿El ambiente de pruebas permite **provocar** `review`, `pending` y
   `rejected` — con qué tarjetas o parámetros?

> **El ③ es el que más nos sirve operativamente:** *sin forma de provocarlos, esos
> tres caminos no se pueden gatear nunca, y van a estrenarse con una persona
> real.*

---

## ④ 🟡 LAS DOS DEL AMBIENTE, que condicionan el gate

1. ¿Se puede **simular un rechazo** de cobro en sandbox de forma dirigida (una
   tarjeta o monto que produzca cada `status_detail`)?
2. ¿El **OTP / 3DS** de sandbox permite ejercitar el **código incorrecto** y el
   **vencido**, o solo el camino feliz?

**Por qué:** la ley tiene voces para OTP incorrecto y para timeout, **y ninguna
de las dos se pudo ejercitar todavía**. *Una voz que nunca se probó es una voz
que nadie vio.*

---

## ⑤ · LO QUE **NO** PREGUNTAMOS, porque ya lo medimos

*Se dice para que el hilo no gaste turnos en lo que ya está.*

- **La tarjeta no llega completa:** `card.number` mide **4 caracteres** en las 94
  filas, solo dígitos. **Cero PAN, cero CVV.** ✅
- **Los dos códigos de certificación llegan y se persisten:**
  `proveedor_transaction_id` y `authorization_code`.
- **El webhook rebota sin firma válida:** 24 filas con `stoken_invalido` — *el
  guard del buzón funcionando, no un problema.*
