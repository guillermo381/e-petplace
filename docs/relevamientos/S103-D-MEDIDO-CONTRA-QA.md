# DeUna · lo medido contra QA — parte de cierre del riel

> **Autor:** pista D · **Medido:** 22-ago-2026 · ambiente **QA**
> (`apis-merchant.qa.deunalab.com`), comercio SATORI INOV LATAM S.A.S.
> **Va a A para depositar** — `docs/` es su territorio.
>
> **Qué es este documento:** el único lugar donde vive lo que el ambiente real
> contestó. `LETRA_DEUNA` dice qué queremos; esto dice **qué hay**.
> **Cuando difieran, gana esto** — la propia letra lo ordena en §2.
>
> 🔴 **SU VALOR ESTÁ EN LA SEPARACIÓN.** Todo lo de §1-§6 fue **observado**.
> Todo lo de §7 es **supuesto o construido** y no se cita como medición. *Si
> alguien mezcla las dos mitades, este documento deja de servir para lo único
> que sirve.*
>
> ⚠️ **Ninguna medición requirió `pointOfSale`** — que es justamente lo que
> falta. Por eso §7 es tan grande como es.

---

## §1 · LO PRIMERO, PORQUE CAMBIA DECISIONES

### 🔴 `NOT_FOUND` NO EXISTE

Consultar una transacción **inexistente** no devuelve error:

```
POST /merchant/v1/payment/info   { "idType":"0",
                                   "idTransacionReference":"00000000-0000-4000-8000-000000000000" }
→ HTTP 200
{"status":"PENDING","internalTransactionReference":"","amount":0,
 "transactionId":"00000000-0000-4000-8000-000000000000","transferNumber":"",
 "date":"","branchId":"","posId":"","currency":"USD",
 "description":"Your payment is being synchronized. Please check back in a moment.",
 "ordererName":"","ordererIdentification":""}
```

Con `idType "1"` es peor: **devuelve el eco de la referencia que mandamos**
(`internalTransactionReference: "EPQAnoexiste01"`), con cara de registro
existente.

**Consecuencias, y no son de estilo:**

1. La consulta activa **no puede distinguir «no existe» de «está pendiente»**.
2. El estado `NOT_FOUND` que `LETRA_DEUNA` §2 declara **nunca llega** ⇒ el
   hallazgo `huerfano_deuna_vencido` de §3.5 **no tiene señal que lo dispare**.
3. Un barrido que espere `NOT_FOUND` **no termina nunca**.

⇒ **El corte de la ventana de 7 días lo pone NUESTRO reloj.**

> *El proveedor no falla: contesta algo verosímil. Un 404 se nota; un `PENDING`
> con «please check back in a moment» se lee como «esperá» y sobrevive a
> cualquier revisión de código.*

### 🔴 Dos rutas de la letra eran falsas

Los tres endpoints viven bajo **`/merchant/v1/payment/*`** — **sin `api/`**.

| ruta | resultado |
|---|---|
| `/merchant/v1/payment/request` · `/info` · `/refund` | **401** (existen, exigen auth) |
| `/merchant/api/v1/payment/*` (como decía la doc) | **404** |
| `/merchant/v1/payment` (padre) | **404** |

**Control negativo:** que la ruta padre dé 404 prueba que el 401 **no es un
comodín de prefijo** — el gateway resuelve rutas exactas.

*Por qué importaba: la consulta activa habría devuelto 404 en cada llamada, y
ese síntoma es indistinguible del `NOT_FOUND` legítimo que la letra define.*

---

## §2 · AUTENTICACIÓN

| hecho | control |
|---|---|
| **`x-api-key` ES la subscription key** del gateway | sin headers → *«**missing** subscription key»*; con `x-api-key: <basura>` → *«**invalid** subscription key»*. **El mensaje cambia** |
| **`Ocp-Apim-Subscription-Key` NO se lee** | con ese header y sin `x-api-key`, sigue diciendo *«missing»* |
| **`x-api-key` + `x-api-secret` autentican** | con las credenciales reales el gateway pasa de **401 a 400 de negocio** — *un 400 prueba que nos dejó entrar y ahora discute el contenido* |

El gateway es **Azure APIM** (vocabulario de sus mensajes).

---

## §3 · EL CONTRATO DE `payment/request`

El validador **contesta un campo por vez**, así que iterar los rebotes dibuja el
contrato entero sin necesidad de una llamada exitosa.

| campo | lo medido |
|---|---|
| `pointOfSale` | **OBLIGATORIO**, solo numérico. Se resuelve contra la jerarquía del comercio: con `"1"` → `Hierarchy tree parent 1 not found` (code 2000) |
| `detail` | **≤ 50** — *«must be shorter than or equal to 50 characters»* con 51 |
| `internalTransactionReference` | **≤ 20** — *«must be **at most 20** characters long»*. **Medido con barrido**: 20 pasa; 21·25·30·36·40·50·64·100 rebotan con el mismo literal |
| `expiredTime` | **NÚMERO.** `"3"` rebota (*«must be a number»*); `3` pasa |
| 🔴 `currency` | **NO DEBE EXISTIR** — *«property currency should not exist»*. **Rebota el request entero** |
| `qrType:"dynamic"` · `format:"5"` · `amount` | aceptados por el esquema en todas las corridas |

> ⚠️ **`expiredTime` es número y `idType` es string.** El mismo API usa las dos
> convenciones: **no hay regla general que salve, cada campo se mide.**

> 🔴 **`currency` es la trampa:** es el campo que cualquiera agregaría por
> analogía con Nuvei —que sí lo lleva— y **rebota todo**. El daño de un campo de
> más es idéntico al de uno de menos, y es el que nadie va a buscar.

**Control de que esto mide el contrato y no el azar:** el rebote cambia de
mensaje al corregir cada campo y **vuelve siempre al mismo tope**
(`Hierarchy tree parent … not found`) cuando el esquema queda válido. *Ese tope
constante prueba que lo único que falta es el POS y no otro campo escondido.*

### El `pointOfSale` no lo expone ningún endpoint

16 sondeos (`GET`+`POST` × `pointOfSale`·`point-of-sale`·`pos`·`branch`·
`branches`·`merchant`·`store`·`stores` bajo `/merchant/v1/`) → **404 en los 16**.

> 🔴 **No se adivina.** Probar números hasta que uno responda es fuerza bruta
> contra el árbol de puntos de venta de un proveedor de pagos. Se probó **un**
> valor (`"1"`), y sólo para medir la forma del rechazo.

---

## §4 · EL CONTRATO DE `payment/info` Y `refund`

| lo que decía la letra | lo medido |
|---|---|
| «se consulta por `idType 0`» (número) | 🔴 **`idType` es STRING** `"0"`/`"1"`, máx 1 carácter. Un `0` numérico rebota |
| *(no nombra el campo del id)* | 🔴 el campo es **`idTransacionReference`** — **con el typo del proveedor**: *Transacion*, no *Transaction*. Máx 36 |
| `refund` recibe `transactionId` | 🔴 **falso**: recibe **la misma pareja** `idType` + `idTransacionReference` |

> ⚠️ **El typo es del proveedor y se respeta.** Quien lo "arregle" rompe todas
> las consultas.

### Campos que devuelve `payment/info`

```
status · internalTransactionReference · amount · transactionId · transferNumber
date · branchId · posId · currency · description · ordererName · ordererIdentification
```

- **`transferNumber`** existe — es el que la letra §3.6 exige en el comprobante.
- **`ordererName` / `ordererIdentification`** = el dato personal de §9.
  **Van al crudo del buzón y a ningún otro lado.**

---

## §5 · EL REFUND ES **MISMO DÍA** — dicho por el proveedor

Su propio mensaje de error lo declara:

> *«The transfer number … is invalid, not found, or **only valid for the
> purchase day**. Please verify the number and try again.»*

⇒ **Cierra la pregunta #1** (su doc decía «mismo día» en un recuadro y «24 h» en
otro). **La firma ③ del founder —el supuesto más restrictivo— queda confirmada
por la fuente**, y pasa de prudencia a hecho.

---

## §6 · HAY RATE LIMIT

```
429 · { "statusCode": 429, "message": "Rate limit is exceeded. Try again in 1 seconds." }
```

Apareció con **dos llamadas seguidas sin pausa**. Con **1,8 s** de espaciado,
cero 429 en toda la corrida. ⇒ **Cierra la pregunta #9.**

**Reglas que se derivan, y la segunda es la importante:**

1. El barrido y la consulta activa **espacian** sus llamadas (≥ ~1,2 s).
2. 🔴 **Un `429` JAMÁS se lee como fallo del pago y JAMÁS transiciona nada.**
   Significa *«no pude preguntar»*, no *«el pago no existe»*. Confundirlos
   marcaría como huérfano un cobro perfecto **porque consultamos rápido** — y el
   barrido corre solo, de noche, sin nadie mirando.

---

## §7 · 🔴 LO QUE **NO** ESTÁ MEDIDO — supuestos y construidos

**Nada de esta sección es observación.** Se separa a propósito.

### 7.1 · El supuesto que sostiene el clasificador de fantasmas

**Que una solicitud REAL recién creada devuelve su `amount` y no `0`.**

Es razonable —la solicitud nace con su monto— pero **crear una exige el
`pointOfSale`**. Si fuera falso, las tres marcas del fantasma (`PENDING` +
`amount 0` + `date ""`) **no discriminarían nada** y un pago legítimo consultado
en su primer segundo se cerraría como huérfano.

⇒ **Es el PASO 1 del guion del día 1**, y su rojo para todo lo demás.

### 7.2 · Todo lo que vive detrás de una transacción creada

| ⚪ | por qué no se pudo |
|---|---|
| ¿`format:"5"` devuelve **`numericCode`**? | **la firma ① del founder depende de este campo**, y la pantalla de C se diseña sobre él |
| ¿la respuesta trae `transactionId`, QR, deeplink? | ídem |
| ¿viene `expiredAt`, o el reloj lo fija `expiredTime`? | **tensión abierta**: su doc dice «3 min fijos, no configurables» pero el request acepta `expiredTime` — pregunta #10 |
| estados reales (`APPROVED`, `REVERSED`, `REVERSED_FAILED`) | sólo vimos `PENDING` |
| la ventana de 7 días | no se pudo envejecer una transacción |
| el webhook: 3 reintentos c/30 s, y su payload con cédula | exige la URL dada de alta — pregunta #3 |
| el refund sobre transacción **propia** aprobada | exige pagarla en la app Deuna de QA — pregunta #5 |

### 7.3 · Las fixtures sintéticas vivas, y dónde

**Marcadas como tales dentro de cada archivo.** El día 1 se reemplazan por
medidas (guion §7):

| archivo | qué es sintético |
|---|---|
| `pagos-deuna-webhook/fixtures-qa-deuna.json` | el bloque `_sinteticos`: `aprobada_con_monto`, `aprobada_sin_monto`, `reversada`, `reverso_fallido`. **Los dos fantasmas son REALES** |
| `pagos-deuna-barrido/_reloj.test.ts` | `S_APROBADA`, `S_REVERSED`, `S_REV_FAIL`, `S_PENDIENTE_REAL` |
| `scripts/deuna/simulador-local.mjs` | `respuestaRequest()` **entera**. **Sus errores 400 son REALES** |
| `pagos-deuna-solicitud/_motivo.test.ts` | **nada — los cinco cuerpos de error son literales de QA** |

### 7.4 · El tarifario

**2 % + IVA** (solicitud comercial firmada). **No es medible por API** — su
verificación es la primera factura. Entra a `MODELO_FINANCIERO` como **costo de
riel**, jamás confundido con la comisión de plataforma (10 %, `fee_configs`).

---

## §8 · LAS PREGUNTAS QUE QUEDAN PARA SOPORTE

`support@deunamerchant.zendesk.com` — **de las nueve originales cerraron tres
midiendo** (#1 refund mismo día · #7 `Ocp-Apim` innecesario · #9 rate limit).

| # | pregunta |
|---|---|
| **2** | 🔴 **BLOQUEANTE: ¿cuál es el `pointOfSale` numérico de SATORI INOV LATAM en QA?** Medimos que es obligatorio, numérico, y que se resuelve contra la jerarquía del comercio. **Ningún endpoint lo expone** (16 sondeos, 404 en los 16). ¿Y el de PDN es el mismo? |
| **3** | ¿Cómo se registra y rota la URL del webhook y sus headers, en QA y PDN? ¿Autogestión en el portal o lo hacen ustedes? |
| **4** | ¿Existe autenticación del webhook más fuerte que headers estáticos (HMAC del payload, mTLS)? |
| **5** | ¿QA permite **simular** `REVERSED` y `REVERSED_FAILED`? |
| **8** | **Confirmar las rutas**: `info`/`refund` responden en `/merchant/v1/payment/*` y dan **404** en `/merchant/api/v1/payment/*`, que es como figura en su doc. ¿Cuál es la canónica? ¿Va a cambiar? |
| **10** | ¿El reloj del código son **3 minutos fijos** o lo fija `expiredTime`? ¿Qué unidad? ¿Tiene tope? ¿Qué pasa si se omite? |

---

## §9 · ENMIENDAS QUE ESTO LE PIDE A `LETRA_DEUNA`

**Las decide la mesa; la pista sólo mide.** *(A ya depositó varias en v1.2 —
esta lista queda como el registro de qué salió de qué medición.)*

| § | qué dice | qué se midió |
|---|---|---|
| §2 | `/merchant/api/v1/payment/{info,refund}` | **404.** Son `/merchant/v1/payment/*` |
| §2 | «se consulta por `idType 0`» | `idType` es **string**, y el campo es `idTransacionReference` |
| §2 | estado `NOT_FOUND` | **no se emite.** Devuelve `200/PENDING/amount 0` |
| §2 | `refund` por `transactionId` | por la pareja `idType` + `idTransacionReference` |
| §4 | referencia **< 20** | es **≤ 20** |
| §8 | refund mismo día *(supuesto declarado)* | ✅ **confirmado por el proveedor** |
| §5 | «3 min fijos, no configurables» | 🟡 **el request acepta `expiredTime`** — sin resolver |
| — | *(no lo menciona)* | **`currency` no debe existir** · **hay rate limit ~1 req/s** |
