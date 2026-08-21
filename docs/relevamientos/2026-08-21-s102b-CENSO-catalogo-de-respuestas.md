# S102-B · CENSO DEL CATÁLOGO DE RESPUESTAS DEL PROVEEDOR

> **LECTURA PURA. Cero construcción, cero escritura.** Corrida: **21-ago-2026**,
> proyecto `zyltipqscdsdsxnjclhp`, ambiente **sandbox**.
> **L-330 rige: cada medición lleva su control declarado.**

---

## ⓪ · EL TITULAR

> ### **La ley define SIETE causas con voz propia. El actuador tiene DOS salidas.**
> ### **Los tres rechazos reales que la base vio caen los tres en la misma: `desconocido` — que es la voz de «soporte».**

**Y el segundo titular, que es de método:** la cuarta fuente —la tabla oficial de
`status_details` de Nuvei— **no se pudo obtener**, así que **este censo puede
decir dónde cae cada código y NO qué significa**. *Se declara en vez de
inventarse.*

---

## ① · FUENTE (a) — LA LEY · `LETRA_MOTOR_PAGOS_S101` §7 (+ E5)

**Siete causas, cada una con su voz y su salida:**

| # | Causa | Salida que la ley prescribe |
|---|---|---|
| 1 | Rechazo del banco | **Probar otra tarjeta** |
| 2 | OTP incorrecto | Reintentar el código, con su límite |
| 3 | Fondos insuficientes — **nunca se nombra** | Otra tarjeta |
| 4 | Timeout / sin respuesta — **no es rechazo** | Esperar, con destino claro |
| 5 | Tarjeta vencida o datos inválidos | Corregir |
| 6 | **Desconocido** | **Soporte** |
| 7 | Compuerta pre-cobro (E5) | Resolver y reintentar — *la tarjeta nunca se enteró* |

> *«Un timeout dibujado como rechazo hace que el cliente vuelva a pagar algo que
> ya pagó. Es la clase de error que cuesta doble.»*

---

## ② · FUENTE (c) — EL CRUDO · lo que la base REALMENTE recibió

**Medido con `GROUP BY` sobre las tres tablas** (`webhook_events`,
`pagos_eventos`, `pagos_intentos.payload_crudo`), **no supuesto** *(regla 22
ensanchada: el valor se mide)*.

**Universo: 103 filas con `transaction` · SEIS pares distintos:**

```
0/31  ·  1/3  ·  2/32  ·  2/7  ·  5/14  ·  success/3
```

**El alta de tarjeta — `card.status`:**

| valor | veces |
|---|---|
| `valid` | **8** |
| `review` · `pending` · `rejected` | 🔴 **CERO — nunca ejercitados** |

> **CONTROL DECLARADO (L-330):** el `GROUP BY` **sí discrimina** — devolvió seis
> pares distintos y no un valor único. *Un agrupamiento que devolviera una sola
> fila sería sospechoso del instrumento y no del dato* (ⓔ del relevamiento de
> instrumentos).

---

## ③ · FUENTE (b) — EL CÓDIGO · dónde cae cada cosa

### 3.1 · El único lugar que decide: `_pago_aprobado(jsonb)` — **y está BIEN**

```sql
( lower(status) IN ('1','success')  OR  upper(current_status) = 'APPROVED' )
AND upper(coalesce(current_status,'APPROVED'))
    NOT IN ('CANCELLED','REJECTED','FAILURE','EXPIRED')
```

**✅ Verde declarado, y conviene no re-auditarlo:** es **fail-closed ante
contradicción** —si un vocabulario dice aprobado y el otro lo desmiente, **no
confirma**— con su porqué escrito en el cuerpo: *«un cobro confirmado de más es
plata que hay que ir a devolver»*.

### 3.2 · El brazo default del actuador

```sql
IF NOT _pago_aprobado(...) THEN
  UPDATE webhook_events SET resultado='desconocido',
    detalle = ... || ' · actuador: status=' || status || ' no confirma';
  RETURN ... 'motivo','status_no_aprobado', 'status', status;
```

**Hay UN solo brazo default. Todo lo no aprobado entra ahí, sea lo que sea.**

### 3.3 · 🔴 DOS VOCABULARIOS EN DOS CAPAS — medido, no resuelto

| capa | qué acepta como aprobado |
|---|---|
| `aplicar_evento_de_pago` → `_pago_aprobado` | `1` · `success` · `APPROVED` |
| **`pagos-cobro:315`** | **solo `'success'` y `'approved'`** — *el `1` numérico NO* |

**Medido en el crudo: los dos vocabularios existen de verdad** — `1/3` (47
filas, vía webhook) y `success/3` (14, vía respuesta de débito).

**Lectura honesta:** que cada capa mire su propio formato **es coherente** — la
respuesta del débito y el webhook tienen formas distintas. **Lo que NO está
probado es que la capa del cobro no reciba nunca un `1`.** *Se declara como
pregunta abierta, no como defecto: afirmarlo sin medirlo sería el error que este
censo existe para no cometer.*

---

## ④ · FUENTE (d) — LA DOC OFICIAL · 🔴 **NO SE PUDO OBTENER**

**Dos intentos** contra `developers.paymentez.com/api/` (con y sin el ancla
`#status-details`). **La tabla de códigos no está en el render accesible** — la
página es una SPA y el contenido de esa sección no viaja.

**Lo que SÍ se confirmó de la doc, y sirve:**
- `transaction.status` (string): `success` · `failure` · `pending`
- `transaction.current_status`: `PENDING` · `APPROVED` · `CANCELLED` ·
  `INITIATED` · `REJECTED` · `EXPIRED`
- **`card.status`: `valid` · `review` · `pending` · `rejected`** ✅ *(confirma la
  lista que la mesa nombró)*

**Lo que NO se pudo obtener: el significado de `31`, `32`, `7`, `14`, `3`.**

> ### **Y por eso este censo NO asigna esos códigos a las siete causas de la ley: para mapearlos habría que adivinar qué significan.**
>
> *Es la misma disciplina que la §12 de `LETRA_DEUNA`: **se preguntan, no se
> adivinan.*** **Va como pregunta a Erick / Nuvei, con la lista exacta.**

---

## ⑤ · LA TABLA DEL CENSO — código → dónde cae → voz → evidencia

| par `status/detail` | ¿aprobado? | `resultado` registrado | voz de la ley que le toca | ¿visto en crudo? |
|---|---|---|---|---|
| `1/3` | ✅ sí | `aplicado` (22) · `recibido` (4) | la del éxito | **SÍ — 47** |
| `success/3` | ✅ sí | `recibido` (1) · `stoken_invalido` (5) | la del éxito | **SÍ — 14** |
| `0/31` | ❌ no | 🔴 **`desconocido`** (4) · `stoken_invalido` (7) | **⚠️ SIN ASIGNAR** — se ignora qué es | **SÍ — 11** |
| `2/32` | ❌ no | 🔴 **`desconocido`** (2) · `stoken_invalido` (5) | **⚠️ SIN ASIGNAR** | **SÍ — 7** |
| `5/14` | ❌ no | 🔴 **`desconocido`** (2) · `stoken_invalido` (2) | **⚠️ SIN ASIGNAR** | **SÍ — 4** |
| `2/7` | ❌ no | `stoken_invalido` (5) | **⚠️ SIN ASIGNAR** | **SÍ — 5** — *nunca llegó al actuador* |
| **el resto del catálogo de Nuvei** | ❌ no | caería en `desconocido` | **⚠️ SIN ASIGNAR** | **NO** |
| `card.status = valid` | — | alta OK | — | **SÍ — 8** |
| `card.status ∈ {review, pending, rejected}` | — | **sin camino medido** | ⚠️ | 🔴 **NO** |

**Nota sobre `stoken_invalido`:** son webhooks **rechazados en la puerta por
firma** — *el guard del buzón funcionando*. **No llegaron al actuador**, así que
no dicen nada sobre el mapeo. *Es tráfico del arnés, y se separa a propósito
para que no infle ninguna columna.*

---

## ⑥ · LA VARA (punto 3 de la orden), evaluada punto por punto

> *«Ningún código produce éxito falso ni silencio — lo no mapeado registra, deja
> el intento en su estado honesto y habla con voz genérica + hallazgo.»*

| exigencia | veredicto | evidencia |
|---|---|---|
| **no produce éxito falso** | ✅ **CUMPLE** | `_pago_aprobado` es fail-closed y exige vocabulario explícito; ante contradicción **no confirma** |
| **no produce silencio** | ✅ **CUMPLE** | el default **escribe** `resultado='desconocido'` **y** anexa `· actuador: status=X no confirma` al detalle |
| **deja el intento en su estado honesto** | 🔶 **NO SE PUDO VERIFICAR** | los **8** casos `desconocido` **no tienen intento ligado** — son sondas del arnés. **La rama nunca corrió contra un cobro real** |
| **habla con voz genérica + hallazgo** | 🔴 **NO CUMPLE — y es el hallazgo del censo** | ver abajo |

### 🔴 POR QUÉ LA CUARTA NO CUMPLE

**El default no da «voz genérica **+** hallazgo»: da una sola cosa, y esa cosa
es la voz de OTRA causa.**

`desconocido` **es literalmente la fila 6 de la ley** — *«No pudimos completar el
cobro, ya lo estamos viendo → **Soporte**»*.

⇒ **Un rechazo del banco, que la ley manda resolver con «probá otra tarjeta», se
registra y se cuenta como un caso de soporte.**

> ### **Las dos salidas no son intercambiables: una devuelve al cliente al flujo; la otra lo saca del producto.**
>
> *Y el costo se paga dos veces: el cliente que podía pagar con otra tarjeta no
> lo intenta, y la casa recibe un caso de soporte que no era.*

**Lo que falta NO es más voces: es la SEPARACIÓN entre «no aprobado con causa
conocida» y «no aprobado sin causa».** *Hoy las dos comparten etiqueta, y por eso
no se pueden contar por separado ni atender distinto.*

---

## ⑦ · LOS HUECOS, con dueño

| # | hueco | gravedad |
|---|---|---|
| **1** | **Todo lo no aprobado colapsa en `desconocido`** — la ley tiene 7 causas, el motor tiene 2 salidas | 🔴 **ficha** |
| **2** | **El significado de los códigos no se pudo obtener** ⇒ ninguno se puede asignar a una causa | 🔴 **pregunta a Erick/Nuvei** — bloquea la cura del #1 |
| **3** | **`card.status` ∈ {`review`, `pending`, `rejected`} nunca ejercitado** — la doc confirma que existen; la base solo vio `valid` | 🟡 **ficha** |
| **4** | La rama no-aprobada **nunca corrió contra un intento real** | 🟡 declarado |
| **5** | Dos vocabularios en dos capas — coherente, **pero no probado** que la capa del cobro no reciba `1` | 🟢 pregunta |

> **🔴 EL ORDEN IMPORTA: el #2 bloquea al #1.** *No se puede mapear `31` a «banco
> no autorizó» sin saber qué es `31`* — **y mapearlo por parecido sería
> exactamente el defecto que este censo vino a medir.**

**Y el punto 4 de la orden se cumple hoy, sin trabajo:** el cliente **jamás ve un
código del proveedor** — los códigos viven en `webhook_events.detalle` y en el
crudo, nunca en una pantalla. *El vocabulario cerrado no se amplía de paso: lo
que falta es una separación, no una voz nueva.*

---

## ⑧ · LO QUE ESTE CENSO **NO** MIDIÓ — declarado

1. **La tabla oficial de `status_details`** — dos intentos, inaccesible por ese
   canal. **No se inventó ni un significado.**
2. **Qué ve el cliente en pantalla** ante un no-aprobado: se midió el motor y el
   registro, **no la superficie**. *Es gate de dispositivo, no de censo.*
3. **El OTP** — no aparece como par `status/detail` en el crudo; su camino vive
   en el alta (3DS) y **no se ejercitó ningún rechazo**.
4. **Nada se tocó.** Cero escrituras; las únicas consultas fueron `SELECT`.
