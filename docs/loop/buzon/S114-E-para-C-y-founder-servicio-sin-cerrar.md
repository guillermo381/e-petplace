# E → C y al founder · la línea «servicios sin cerrar» YA tiene sujeto (y contaba 62, no 0)

**8-sep-2026 · Pista E · un solo asunto: el sujeto para caminar la línea**

## ① La premisa del pedido era falsa, y conviene saberlo antes de caminar

Me pidieron sembrar porque *«hoy sale en cero legítimamente: el corte de F1 dejó
el backlog viejo fuera»*. **Medido por el camino real** —`obtener_servicios_sin_cerrar()`
desde la sesión de `demo-prestador@epetplace.dev`, no replicando el predicado—:

```
cantidad = 62   ·   accionables (vencido=false) = 6   ·   vencidos = 56
```

**La causa: el corte NO vive en el lector.** `obtener_servicios_sin_cerrar()` no
consulta `app_config.f1_corte_cierre_ausente`; el corte lo aplica **sólo el
reloj** (`expirar_objetos_sin_cierre`, que hoy reporta `saltados_por_corte: 109`).
⇒ el prestador ve el backlog entero; el reloj no lo mira nunca.

## ② El sujeto sembrado, para que la ventana no se cierre antes del recorrido

Los 6 accionables **decaen** —a las 48 h de su fin pasan a `vencido`— y yo no
controlo la fecha del recorrido:

| sujeto | deja de ser accionable |
|---|---|
| 3 paseos del 7-sep (fin 10:30) | **9-sep 10:30** |
| 1 paseo del 7-sep (fin 18:00) | **9-sep 18:00** |
| 2 adiestramientos del 8-sep (fin 11:00) | **10-sep 11:00** |

Por eso sembré uno más, **por la puerta real**:

```
cita 601a53b8-92b5-4b65-bb39-12a0873cd954 · Zeus · paseo 30' · hoy 17:30
entra a la cuenta a las 18:00 de hoy  ·  accionable hasta el 10-sep 18:00
```

**Es SIEMBRA, no tráfico.** Marca `metadata->>'siembra' = 'S114-E'`; el censo:

```sql
select id, fecha, hora from evento_cita_servicio where metadata->>'siembra' = 'S114-E';
```

⚠️ **Ningún número de acá es línea base.** Ningún dato de servicio de esta base
es real y producción es octubre.

⚠️ **Nota de camino, para el próximo que siembre una cita:**
`confirmar_cita_pagada` **está revocada de `authenticated`** desde S101
(`D-855`) — rebota `permission denied for function`, medido, no leído. La puerta
viva es **el motor de pagos** (`pagos-cobro` con `cita_id`). Y su `ok:true` se
declara a sí mismo `"señal":"optimista"`: **el acto 2 lo aplica el webhook,
asíncrono**. Mi primera versión chequeó el estado inmediatamente, lo encontró
`pendiente_pago` y abortó **sobre un pago que sí entró unos segundos después**.
*Un guard correcto que mide antes de tiempo produce un rojo verdadero sobre una
premisa falsa.* El script ahora sondea 40 s y, si no llega, **lo dice**.

## ③ 🔴 LA CONSECUENCIA A LAS 48 H, DICHA ANTES DE QUE PASE

**El reloj ya está vivo y corriendo:** `cron.job` 52 `expirar-objetos-sin-cierre`,
`0 * * * *`, `active=true`, corridas `succeeded`; **ya emitió 3 avisos
`servicio_sin_cerrar`** (8-sep 16:00 UTC = 11:00 Guayaquil).

⇒ **La cita sembrada va a recibir su aviso de 24 h el 9-sep ~18:00, y el 10-sep
~18:00 el reloj la va a marcar `no_ejecutado` y le va a abrir su caso de clase 1.**

**Eso es el comportamiento firmado de F1, no un defecto y no residuo de la
siembra.** Queda escrito acá para que, si aparece un caso automático de la nada,
nadie lo lea como falla del producto.

## ④ 🔴 Y UN DEFECTO DE COPY QUE EL FOUNDER VA A VER, con su medición

Lo que la pantalla dice hoy, con los números de hoy:

> **«Tienes 62 servicios sin cerrar. Ciérralos para cobrarlos.»**
> «56 quedaron sin cerrar: no se cobran y la familia recibió su devolución.»

**Las dos líneas afirman cosas que el objeto no sostiene:**

**(a)** De los 62, **sólo 6 son cobrables si los cierra**. Los otros 56 ya pasaron
las 48 h. La línea primaria promete cobro sobre 56 objetos que no lo tienen.

**(b)** 🔴 **«la familia recibió su devolución» es falso para las 56.** Medido:

```
las 56 vencidas → casos_postventa: 0 · eventos_economicos: 0
el reloj, corrido ahora → saltados_por_corte: 109 · no_ejecutadas: 0
```

Ninguna fue marcada `no_ejecutado`, ninguna generó caso, ninguna devolvió un
centavo — **y el reloj las salta para siempre**, porque son anteriores al corte.
*La pantalla le está afirmando al prestador que se devolvió plata que no se
devolvió.*

**Por qué pasa, y por qué no es culpa de la copy:** la copy describe **lo que
hace el reloj**, y el lector muestra **objetos que el reloj no mira**. Son dos
cortes distintos sobre el mismo universo. La cura es de criterio y hay al menos
tres caminos (que el lector aplique el corte · que separe «vencido» de «vencido
y resuelto» · que la copy no afirme la devolución sin verla), y **elegir es de C
y de A, no mío**.
