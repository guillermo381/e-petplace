# S87-A · DISEÑO DEL LOTE 1 — EL MOTOR DE INTENCIONES

> **Diseño antes de construir (orden del founder, S87).** Se apoya en
> `MODELO_NOTIFICACIONES` **v1** §0bis/§3/§6 y en el censo
> `2026-08-04-s87a-censo-notificaciones-contra-lo-vivo.md`. **Nada acá se
> construye hasta que la mesa lo firme.**
>
> **La adjudicación que lo ordena:** *los gates de §5 y la cura del contrato de
> §6 son **precondición** del motor.* **No se enciende nada sobre lo que hoy
> escribe sin consultar §5.**

---

## 0. El problema en una línea

**Hay siete productores de intenciones, cero gates, cero lectores y cero
transporte.** El lote no construye un motor de cero: **le pone puerta, ley y
memoria a algo que ya está escribiendo.**

> **Y ese es el riesgo real que gobierna el diseño:** *si el transporte se
> enchufa antes que la puerta, las siete DEFINER pasan a enviar de verdad — sin
> memorial, sin menores, sin rol, sin consentimiento y sin techo.* **El orden de
> las piezas ES la seguridad del lote.**

---

## 1. Las cinco piezas, en orden de dependencia

```
① catálogo de categorías ──► ② puerta única con los 5 gates ──► ⑤ modo sombra
        │                              │                            declarado
        └──► ③ cura del contrato ──────┘                                │
             de preferencias                                            ▼
                                     ④ idempotencia + estados + auditoría
                                                    │
                                                    ▼
                                         (transporte — FUERA del lote 1)
```

**El transporte NO entra al Lote 1.** El lote termina con el motor probado en
sombra; enchufar push es el Lote 2 **y depende de una build nativa** (§0bis).

---

## 2. ① EL CATÁLOGO DE CATEGORÍAS — cierra el CHECK abierto

`cat_notificacion_tipos` — el vocabulario deja de ser `text` libre.

| columna | qué |
|---|---|
| `codigo` PK | `cita_confirmada`, `vacuna_vencida`, … |
| `categoria` | FK a las 7 de §3 (enum o catálogo propio) |
| `apagable_existencia` | **derivado de la categoría, no por tipo** |
| `activo` | un tipo se jubila sin borrar historia |

**El mapeo de los 10 tipos vivos ya está firmado en `MODELO_NOTIFICACIONES` §3**
(ENMIENDA S87), con las tres dudas de D resueltas y el criterio para el tipo N+1.

**La migración:** `notificaciones.tipo` y `user_notificacion_prefs.tipo` ganan FK
al catálogo, **después** de sembrarlo con los 10 vivos. **Cero backfill de datos**
(L-176: una migración no concede disponibilidad) — pero **sí** un cinturón
in-migración que **aborte si algún `tipo` vivo no está en el catálogo**. *El
censo dice 10; el cinturón lo prueba en el momento del apply.*

> **Por qué esta pieza va PRIMERA y no es prolijidad:** **los gates de §5 la
> consumen.** Un gate no puede preguntar *"¿esta categoría es apagable?"* si la
> categoría no es un dato. **Sin ① no se puede escribir ②.**

---

## 3. ② LA PUERTA ÚNICA — `registrar_intencion_notificacion`

**Un solo escritor de intenciones. Las siete DEFINER pasan por ella; ninguna
vuelve a insertar directo.**

```
registrar_intencion_notificacion(
  p_tipo, p_destinatario_user_id, p_mascota_id, p_evento_id,
  p_datos jsonb, p_clave_dedup text
) → uuid | NULL(descartada, con motivo registrado)
```

### Los cinco gates de §5, en su orden, y qué mide cada uno

| # | gate | cómo se resuelve | si corta |
|---|---|---|---|
| 1 | **MOMENTO VITAL** | `mascotas.estado_vida` = memorial ⇒ descarta **todo salvo `seguridad_cuenta`** | `descartada_memorial` |
| 2 | **MENORES (P5)** | el evento origen con `aportado_por_menor` no genera intención | `descartada_menor` |
| 3 | **ROL Y ACCESO** | familia: vínculo vivo con la mascota · prestador: `empleado_tiene_rol` | `descartada_sin_acceso` |
| 4 | **CONSENTIMIENTO** | §6 con la unidad **(persona, categoría, canal)** | `descartada_sin_consentimiento` |
| 5 | **TECHO** | ventana por persona/categoría + colapso por entidad | `diferida_techo` |

**Ninguno filtra en UI. Los cinco viven en la puerta**, patrón `MODELO_LOYALTY`
§7.1 (el apagado es estructural).

### La regla de la transición del memorial (§5.1) — es un TRIGGER, no un gate

El gate 1 protege lo que **nace**. **Lo ya encolado lo purga un trigger sobre el
cambio a memorial.** *Un recordatorio de vacuna que llega el día después es la
peor falla imaginable de este producto* — y el gate de nacimiento **no la
cubre**, porque esas filas ya nacieron.

### Cómo migran las siete sin romperlas

**No se reescriben las siete a mano y se cruza los dedos.** El orden:

1. Nace la puerta.
2. Las siete cambian su `INSERT` por una llamada a la puerta — **una por una, con
   su discriminador**: par antes/después sobre el caso real de cada una.
3. **Recién entonces** se cierra la puerta trasera: `REVOKE INSERT ON
   notificaciones` a todo lo que no sea la puerta, **+ un trigger `BEFORE INSERT`
   que rebota hablado** lo que no venga de ella.

> **El paso 3 es el que hace que esto no se degrade.** *Sin él, la puerta única
> es una convención — y la octava función que alguien escriba dentro de seis
> meses va a insertar directo sin que nadie se entere.* **Es exactamente la clase
> D-654: funciona, y hace lo incorrecto en silencio.**

---

## 4. ③ LA CURA DEL CONTRATO DE PREFERENCIAS

Los tres choques están en `MODELO_NOTIFICACIONES` §6 (ENMIENDA S87). Acá, su forma:

**La tabla nueva — `user_notificacion_prefs` v2:**

| | hoy | lote 1 |
|---|---|---|
| PK | `(user_id, tipo)` | **`(user_id, categoria, canal)`** |
| default | *"ausente = habilitada"*, sin distinguir | **por categoría** (§6) |
| `comercial` | ON | **OFF en todos los canales** |
| WhatsApp | — | **OFF en todo** hasta opt-in con evidencia |

**La regla del default deja de ser una constante y pasa a ser una función del
catálogo** — `default_por(categoria, canal)`. *Es la misma pieza ① otra vez: el
defecto ② existía porque el default no sabía de categorías.*

**El apagado de existencia de una categoría no apagable** (la letra firmada
*«elige por dónde le llegan, no si le llegan»*) **se honra en los dos lados**:

- **motor:** rebota `categoria_no_apagable` — **código estable**, jamás mapeo por
  literal humano (la trampa medida en D-565).
- **superficie:** esa fila **no dibuja** el toggle de existencia y **dice por qué**.

**Migración de datos, declarada:** hay **5 filas** vivas. Se migran a
`(user_id, categoria, canal)` expandiendo por canal, **salvo las que expresen un
apagado ilegal** (`vacuna_vencida` en false) — **esas se descartan con su fila de
auditoría**, no se arrastran. *Migrar un dato que la ley nueva prohíbe sería
importar el defecto con sello de aprobado.*

**El wrapper:** `guardarPreferenciaNotificacion` gana `canal`. **Motor y wrapper
viajan juntos, puerta única** — como D-654.

---

## 5. ④ IDEMPOTENCIA, ESTADOS Y AUDITORÍA

**Estados de una intención** (§10.1/§10.6):

```
nacida ──► encolada ──► entregada ──► leída
   │           │            │
   └─ descartada(motivo)    └─ fallida(causa) ──► reintento | muerta
```

- **`clave_dedup` UNIQUE** — *una intención = una entrega*. La clave la compone la
  puerta desde `(tipo, destinatario, entidad, ventana)`; **un reintento jamás
  duplica** (§10.1).
- **`evento_id` FK** — toda entrega apunta al hecho que la disparó. **Es lo que
  contesta *"¿por qué me llegó esto?"***, que §10.6 declara como la pregunta que
  siempre llega.
- **Las descartadas SE GUARDAN con su motivo.** *Una intención que el gate mató
  sin dejar rastro vuelve como "el aviso no llegó" y no hay forma de contestar.*
- **`notificaciones` vieja:** se conserva. Las 26 filas son historia; el motor
  nuevo escribe en su propia tabla y la vieja queda de solo-lectura. *No se
  migran 26 filas legado a un modelo que no las contempla.*

**Kill switch (§10.3) y techo duro (§10.4):** una tabla de configuración leída
por la puerta **en cada llamada** — sin deploy, y el techo **independiente de la
config de usuario** (un bug no puede mandar 10.000 mensajes).

---

## 6. ⑤ EL MODO SOMBRA — se DECLARA lo que ya está pasando

**Hoy el sistema está en modo sombra por accidente.** El lote lo convierte en
modo sombra **declarado** (§10.2):

- Un flag por tipo: `sombra | vivo`. **Todo tipo nuevo nace en `sombra`.**
- En sombra, la puerta **corre los cinco gates y escribe la intención con
  `resuelto_como`** —a quién habría ido, por qué canal, qué la habría apagado—
  **y no entrega**.
- **Un lector legible** de eso. *Sin lector, el modo sombra es un `INSERT` que
  nadie mira — que es exactamente la situación de hoy.*
- **El primer envío real de cada tipo es gate del founder, siempre** (§10.2).

**Sobre las 26 filas existentes:** el lector las incluye como el registro
histórico que son, **marcadas como pre-motor** — no se las reinterpreta como si
hubieran pasado por gates que no existían.

---

## 7. EL DISPATCH — decisión técnica con doble check

**El problema medido:** `pg_net` **NO está instalada** ⇒ **la DB no puede hacer
una llamada saliente.**

### Lo que hay, medido

| | estado |
|---|---|
| `pg_net` | **disponible `0.20.0`, NO instalada** |
| `pg_cron` | **instalada `1.6.4`, con 4 jobs vivos** — uno corre **cada minuto** (`expirar-citas-pendientes`) |
| `supabase_vault` | **instalada `0.3.1`** |
| Edge Functions | **5 vivas** en el repo |

### Las opciones, y por qué se cae cada una

| | opción | veredicto |
|---|---|---|
| **A** | **Trigger que envía** en el momento del hecho | **NO.** Envía dentro de la transacción del negocio; no se puede limitar por techo, no lo para un kill switch sin deploy, y un pico de dominio es un pico de mensajes. **§8 y §10.3/§10.4 serían inaplicables.** |
| **B** | **Scheduler EXTERNO** (GitHub Action / servicio cron) que invoca una Edge Function | **NO.** Mete una dependencia operativa fuera del producto, **obliga a un segundo lugar donde viven los secretos**, y agrega una superficie de falla que nadie monitorea. *Y la casa ya tiene el patrón resuelto adentro.* |
| **C** | **`pg_cron` + `pg_net` → Edge Function** | **SÍ — la elegida.** |

### La decisión

> ### **`pg_cron` toca el timbre por `pg_net`; la Edge Function es la ÚNICA que habla con el transporte.**

```
pg_cron (cada minuto)
   └─► pg_net: POST tick ──► Edge Function `despachar-notificaciones`
                                 │  (service_role; lee la cola, aplica
                                 │   techo/colapso, habla con FCM/email)
                                 └─► escribe de vuelta estado + causa
```

**Los cuatro porqués, cada uno apoyado en algo medido:**

1. **`pg_cron` ya es el patrón probado de la casa** — 4 jobs vivos, uno por
   minuto. **No se estrena infraestructura para esto.**
2. **La llave del transporte NUNCA entra a la DB ni al repo** — vive como secreto
   de la Edge Function, que es la decisión de custodia que el founder ya venía
   sosteniendo (S81 R4 §4bis, camino (a)). `supabase_vault` está instalado si
   hiciera falta del lado DB.
3. **La lógica de transporte vive en TS**, donde se prueba y donde los reintentos
   con backoff se escriben sin dolor.
4. **`pg_net` se usa SOLO como timbre, jamás como transporte** — y eso es lo que
   vuelve barata su única debilidad.

### El doble check — dónde esta decisión podría estar equivocada, y por qué no

- **`pg_net` es asíncrono y fire-and-forget** (las respuestas caen en
  `net._http_response`). **Sería un problema si el estado de entrega dependiera de
  esa respuesta. No depende:** el estado lo escribe la Edge Function directo en la
  DB. **Si el tick se pierde, el tick del minuto siguiente levanta las mismas
  filas pendientes** — el diseño es auto-reparable por construcción, y esa
  propiedad es la razón de elegir "timbre" sobre "transporte".
- **Instalar una extensión toca el proyecto entero.** `pg_net` es la extensión que
  Supabase usa por debajo de sus propios Database Webhooks: **no es exótica**, y
  entra con su migración y su reversa como cualquier otra.
- **Una cadencia de un minuto es un piso, no un techo.** Para `salud_seguridad` un
  minuto puede ser mucho; **si algún día lo es, el timbre se toca ADEMÁS desde la
  puerta** (mismo `pg_net`, mismo endpoint, sin rediseño). *Se declara ahora para
  que no se lea como límite del modelo.*

> **Lo que esta decisión NO decide (§13 del modelo):** el proveedor de email y el
> de WhatsApp. **La Edge Function es la frontera exacta donde eso se cambia sin
> tocar el motor** — que es el punto de que §2 ponga al transporte último y aislado.

---

## 8. Orden de construcción propuesto

| # | pieza | por qué acá |
|---|---|---|
| 1 | **catálogo ①** | lo consumen los gates; sin esto ② no se escribe |
| 2 | **contrato ③** | el gate 4 lee consentimiento: sin la cura, el gate honra el defecto |
| 3 | **puerta ② con los 5 gates**, en **sombra** | nace apagada por definición |
| 4 | **④ estados + dedup + auditoría** | la puerta ya escribe: acá gana memoria |
| 5 | **migración de las 7 DEFINER**, una a una con discriminador | |
| 6 | **cierre de la puerta trasera** (REVOKE + trigger) | recién cuando las 7 pasaron |
| 7 | **⑤ el lector de sombra** | cierra el lote |

**El transporte (Lote 2) queda afuera, y su precondición dura es la build nativa.**

> **La prueba de que el Lote 1 terminó:** *las siete producen a través de la
> puerta, los cinco gates cortan lo que deben —con su rojo producido, L-199—, la
> puerta trasera rebota, y el lector de sombra dice qué habría salido y a quién.*
> **Cero mensajes enviados. Ese es el éxito, no un pendiente.**

---

## 9. Lo que este diseño le pide a la mesa

1. **Firma del orden de §8.**
2. **Firma del dispatch de §7** (instalar `pg_net` es la única decisión de
   infraestructura del lote).
3. **`saldo_pagado`** — sigue **a la firma** desde S80. **Si entra, entra al
   catálogo ①; si no, el catálogo nace con 6 categorías** y agregarla después es
   una migración más. *No se construye sobre una categoría no firmada.*
4. **Confirmar que el Lote 1 no toca superficie** salvo lo mínimo de §6 (la fila
   que deja de ofrecer el toggle de existencia) — **eso es de otra pista y hay
   que nombrarla.**
