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

### 🔴 CORRECCIÓN MEDIDA — **las 34 compras NO SIRVEN**

*Se probó la compuerta contra dos de ellas **antes** de la sesión, y por eso
esto no pasó en vivo:*

```
verificar_compuertas_pre_cobro(a4f8f309…) →
  {"ok": false, "codigo": "reserva_vencida",
   "detalle": {"pedidos_sin_reserva": 1}, "compuerta": "1_reserva_vencida"}
verificar_compuertas_pre_cobro(bd55346a…) → idéntico
```

> ### Las 34 están en `esperando_pago` **con la reserva de stock vencida**. La puerta las rebota en la compuerta 1, antes de hablarle a DeUna.
>
> *«Hay 34 sujetos disponibles» era cierto sobre el estado de la compra y falso
> sobre lo que la puerta acepta. **Un sujeto no está disponible porque su
> estado lo diga: lo está si la compuerta lo deja pasar** — y eso solo se sabe
> preguntándole a la compuerta.*

**Si esto se descubría en vivo, la sesión se quemaba con Carlos al teléfono**, y
el síntoma —`reserva_vencida`— habría parecido un defecto del riel cuando es el
sujeto el que está vencido.

⇒ **HACE FALTA UNA COMPRA NUEVA, hecha desde la app poco antes.**

**Y el margen es cómodo, medido:** `timeout_checkout_minutos = 120` ⇒ una
reserva nueva vive **2 horas**, con el cron `expirar-reservas-vencidas` corriendo
cada 5 min. *Dos horas contra los 3 minutos del código: **el reloj que aprieta
sigue siendo el del código**, no el de la reserva.*

**El usuario de esas compras es `guillo381+8@gmail.com`** (`dd024680…`) — la
cuenta de prueba del founder, la misma que tiene las 8 tarjetas de `D-921`.

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
| **Una compra NUEVA** (reserva viva) | ⏳ **del founder, desde la app** — las 34 viejas rebotan |
| **El JWT de `guillo381+8`** | ⏳ **del founder, POR KEYCHAIN** — ver abajo |

### 🔑 CÓMO VIAJA EL JWT — **por keychain, jamás por chat**

**Un access token es una credencial.** Pegado en un mensaje queda en el
transcript para siempre — es `D-712`, que esta casa ya pagó: *un token de sesión
commiteado durante una auditoría de seguridad.* **Y el precedente bueno también
existe:** las llaves de DeUna y el secreto de despacho se leen del keychain **al
momento de usarlos** y nunca se imprimen.

```
security add-generic-password -s DEUNA_SESION_JWT -a epetplace -w '<el access token>' -U
```

**Lo leo al momento, lo uso en el `Authorization: Bearer`, y no lo imprimo.**
*Su vida de 1 hora juega a favor: es la credencial más acotada posible para
esto — no es una clave, y se vence sola.*

⚠️ **Depositalo cerca de la sesión**, no antes: si el token vence, la puerta
devuelve `sin_sesion` (401) y hay que repetir el paso.

---

## §5 · LO QUE NO SE HACE EN ESTA SESIÓN

**No se enciende el cron del barrido** (`§13bis ③`: sin aplicador, un barrido
que escala lo mismo cada pasada entrena a ignorarlo) · **no se flipean los dos
interruptores de C** (`§13bis ②`) · **no se cura `D-913` sobre la marcha** — si
el código vence, se usa otra compra · **y no se declara el circuito verde**:
llega hasta detectado, y eso es lo que se reporta.
