# S105-D · GUION — la sesión de pruebas con Carlos (DeUna)

> **Escrito ANTES de la sesión**, para que lo que se mida no se decida sobre la
> marcha. 25-ago-2026.
> **Medido contra el objeto**: base `zyltipqscdsdsxnjclhp`, functions
> desplegadas, `main` al día.

---

## 🔴 §0 · LO QUE HAY QUE DECLARAR ANTES DE EMPEZAR — y es lo más importante

> ### Aunque Carlos apruebe el pago, **el sujeto NO se va a mover.** El pedido va a seguir sin pagar de nuestro lado.

**No es un riesgo: es lo que va a pasar, y está medido.** Dos causas que se
suman:

| # | por qué | estado |
|---|---|---|
| ① | **El webhook no está registrado del lado de DeUna** | no va a llegar señal por esa vía |
| ② | La confirmación tendría que venir por **consulta activa**, pero el barrido **clasifica y no aplica** (`D-887`, sin aplicador, dueño **A**) — y **no tiene cron**, que es correcto por `§13bis ③` | el circuito llega a *«detectado»* y se detiene |

**⇒ El circuito de DeUna llega hasta DETECTADO, NO APLICADO.**

*Si esto no se dice antes, la sesión termina con «el pago se aprobó y no pasó
nada» y se lee como un fallo — cuando es un hueco conocido, fichado y con
dueño.* **Declararlo antes convierte el mismo resultado en una medición
exitosa.**

**Lo que la sesión SÍ prueba, que es mucho y es lo que falta:** que se puede
formar la solicitud con nuestro `pointOfSale`, que el código llega a una persona
real, que **DeUna lo aprueba**, y que **nuestra consulta activa lo ve**. *Eso es
el riel entero salvo el último eslabón, y el último eslabón ya tiene ficha.*

---

## §1 · QUÉ CAMINO USAR — dos, y prueban cosas distintas

| | camino | prueba | costo |
|---|---|---|---|
| **(a)** | `scripts/deuna/sondeo-qa.mjs` — **directo a la API** | que el proveedor aprueba y que `payment/info` lo refleja. **NO prueba nuestro circuito** | inmediato |
| **(b)** | **nuestra puerta** `pagos-deuna-solicitud` | **el camino real**: compuertas, desglose congelado, intento en la base, referencia corta, código persistido | pide sesión + sujeto |

**Recomendación: (b), con (a) como respaldo si (b) se traba.** *Lo que hay que
certificar es nuestro circuito, no el de ellos.*

**(b) es viable, medido:** hay **34 compras en `esperando_pago`** ⇒ sujetos
disponibles. Lo que hace falta es un JWT de usuario dueño de una de ellas.

---

## 🔴 §2 · EL RELOJ — el riesgo operativo de una sesión coordinada por teléfono

**El código vive 3 minutos** (`expiredTime`, elección nuestra, `§5`).
**Y ahora sabemos que el proveedor lo invalida automáticamente al caducar**
(dato de Carlos, 25-ago) ⇒ un código vencido **no se puede pagar**, ni por error.

⚠️ **Tres minutos es poco para coordinar por teléfono.** Y encima, hoy:

> **`D-913`: si el código vence, NO se puede generar otro.** La compuerta rebota
> `pago_en_proceso` porque el intento viejo sigue `pendiente` y nada lo cierra.
> **La sesión se queda sin segundo intento sobre esa compra.**

**⇒ Dos mitigaciones, y la primera no cuesta nada:**

1. **Generar el código con Carlos YA ESPERANDO**, no antes. *El reloj arranca al
   generar, no al mandar.*
2. **Si hace falta más margen: subir `expiredTime` para la sesión.** Es un campo
   del request y una **decisión nuestra declarada revisable** (`§5`) — no un
   límite del proveedor. **Requiere tocar la edge y redesplegar; se hace solo si
   el founder lo pide.**

**Y si igual vence:** se usa **otra compra** de las 34. *Es más barato que curar
`D-913` bajo presión.*

---

## §3 · QUÉ MEDIR EN CADA PASO

**Cada paso con su control: qué probaría que NO pasó.**

| # | paso | qué se mide | control negativo |
|---|---|---|---|
| **0** | antes | estado de la compra · **cero intentos `deuna`** en la base | si ya hubiera uno pendiente, la compuerta rebota y no es la sesión: es `D-913` |
| **1** | generar por la puerta | intento nace **`pendiente`** con `codigo_numerico` (6 dígitos), `codigo_expira_en`, `referencia_corta` (≤20) | sin `codigo_numerico` el wrapper devuelve `respuesta_incompleta`, no `ok` a medias |
| **2** | mandar a Carlos | **el código de 6 dígitos** *(el QR y el deeplink existen en el crudo como reserva, `§5`)* | — |
| **3** | Carlos aprueba | `payment/info` devuelve **`APPROVED` Y `amount > 0`** | 🔴 **las dos condiciones**: con `amount = 0` **no está aprobado**, diga lo que diga el estado (`§2`) |
| **4** | consulta activa | que **nuestro** lado ve la aprobación | *acá es donde el fantasma y un pago real dejan de ser indistinguibles: hasta el paso 3 los dos son `PENDING/0/""`* |
| **5** | barrido a mano | clasifica **`confirmado`** | **y AHÍ SE DETIENE** — `D-887`. Es el resultado esperado, no un fallo |
| **6** | el sujeto | **sigue sin pagar** | ✅ **es lo predicho.** Si se moviera, *ahí* habría que investigar |

**Después de la sesión, si hubo `APPROVED`:** el reverso de DeUna **ya está
descongelado** (Carlos confirmó que afecta solo a esa transacción) ⇒ **se puede
ejercer sobre ese mismo pago** y cerrar el circuito `REVERSED` que la
certificación pide. *Ése es el segundo caso, y sale gratis de esta sesión.*

---

## §4 · LO QUE HAY QUE TENER LISTO

| | estado |
|---|---|
| `pagos-deuna-solicitud` desplegada | ✅ ACTIVE v1 |
| `pagos-deuna-webhook` desplegada | ✅ ACTIVE v1 — ⚠️ **mudo hasta que DeUna registre la URL** |
| `pagos-deuna-barrido` desplegada | ✅ ACTIVE v1, **sin cron** (correcto) |
| `DEUNA_POINT_OF_SALE` = 4262774 | ✅ cargado y **ejercido**: `payment/request` responde 200 |
| `DEUNA_WEBHOOK_SECRET` | ✅ cargado ⚠️ **pendiente de que DeUna lo registre** |
| `PAGOS_AMBIENTE` = sandbox | ✅ fijado explícito |
| Un JWT de usuario con compra en `esperando_pago` | ⏳ **lo único que falta, y es del founder** |

🔑 **Lo único que necesito para (b): una sesión de usuario.** Sin eso, el camino
posible es (a), que prueba al proveedor y no a nosotros.

---

## §5 · LO QUE NO SE HACE EN ESTA SESIÓN

**No se enciende el cron del barrido** (`§13bis ③`: sin aplicador, un barrido
que escala lo mismo cada pasada entrena a ignorarlo) · **no se flipean los dos
interruptores de C** (`§13bis ②`) · **no se cura `D-913` sobre la marcha** — si
el código vence, se usa otra compra · **y no se declara el circuito verde**:
llega hasta detectado, y eso es lo que se reporta.
