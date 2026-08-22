# S102-B · C0 — LOS TRES NÚMEROS DE LA COMISIÓN

> **Estatuto: CENSO, TODO LECTURA.** Cero migraciones, cero escritura, cero cableo.
> Proyecto medido: `zyltipqscdsdsxnjclhp`. Fecha de corrida: **21-ago-2026**.
> Todo número de este relevamiento se leyó **del objeto**, no de una ficha.

---

## ⓪ · EL TITULAR, EN UNA LÍNEA

> ### **Los tres números NO conviven: uno está firmado y desconectado, otro está muerto como objeto, y el tercero es el ÚNICO que hoy le llega a una pantalla.**

**Y esa pantalla es la de inversores.**

---

## ① · EL 10 % — FIRMADO, DEPOSITADO, CORRECTO… Y SIN UN SOLO CONSUMIDOR

### La letra

`docs/MODELO_DESPENSA.md:114` — literal:

> **2. Comisión de e-PetPlace: 10% sobre el TOTAL CON IVA.**

y `:322`, que es la mitad que importa para el motor:

> **Parámetro configurable con valor inicial 10%. Jamás constante en código**

### El objeto (medido en `fee_configs`)

| campo | valor |
|---|---|
| `id` | `e2f7514c-a908-4459-89e8-b772e7b9285c` |
| `country_code` | `EC` |
| `tipo_actor` · `tipo_origen` | `seller_productos` · `pedido` |
| `parametros` | `{"pct": 10, "base": "total_con_impuesto"}` |
| `vigencia_desde` → `hasta` | `2026-08-11` → **NULL (abierta)** |
| `activo` | `true` |

**La fila está bien hecha, y hay que decirlo:** es la única de las tres de
`pedido` que **declara su base**. *El defecto que D-759 nombra como «dos ejes»
—la tasa y la base— está resuelto en el dato.*

### 🔴 EL HALLAZGO — **MOTOR SIN PUERTA (`L-318`), en su forma limpia**

**`resolver_comision_despensa(country_code, fecha)` existe, es `STABLE SECURITY
DEFINER`, con `search_path` fijo, revocada de `anon`, y devuelve el número
correcto.** Medido en cuatro casos, con discriminador:

| caso | qué devolvió |
|---|---|
| `('EC', now())` | **`pct 10` · `base total_con_impuesto`** ✅ |
| `('EC','2026-08-11 00:00Z')` | `pct 10` — **el corte NO solapa** |
| `('EC','2026-08-10')` | `pct 14.00` · `base null` |
| `('CO', now())` | 🔴 **`pct 14.00` · `base null`** |
| `('US', now())` | `NULL` |

**Y su censo de consumidores dio CERO:**

```
menciona_resolver_despensa = 1   →   quienes = resolver_comision_despensa
```

**Uno, y es ella misma.** Fuera de la DB, el barrido por `grep` sobre
`apps/**`, `packages/**`, `supabase/functions/**` y `scripts/**` **no encontró
un solo llamador**: todas las apariciones son la migración que la creó
(`20260811160000_s95_m5_plata.sql`), su reversa, el barrido `m8`, y un script
de medición de S95.

> **La pieza está construida, probada y desconectada del único lugar donde su
> resultado importa.** Es exactamente `L-318`, y conviene decir por qué acá es
> **peor que en S101**: en S101 la puerta faltaba y el motor devolvía algo que
> nadie usaba. **Acá, además, hay OTRO número —el 14 %— que sí está llegando a
> una pantalla.** *No es un motor sin puerta: es un motor sin puerta mientras
> el número viejo entra por otra.*

### El borde de la fecha, MEDIDO y no razonado

La hipótesis obvia al ver `hasta = 2026-08-11` y `desde = 2026-08-11` es que el
**11 de agosto las dos filas matchean**. **Es FALSA**, y se probó corriéndola:
el predicado de los dos resolutores es **semiabierto** —
`p_fecha >= vigencia_desde AND (vigencia_hasta IS NULL OR p_fecha < vigencia_hasta)`
— así que el corte es limpio y `('EC','2026-08-11 00:00Z')` devuelve **10**.

*Se deja escrito porque una hipótesis descartada por medición es lo que evita
que la próxima sesión la vuelva a abrir.*

---

## ② · EL 20 % — **EL OBJETO ESTÁ MUERTO; SU CONSUMIDOR NO SE ENTERÓ**

### La ficha decía

`DEUDAS_CANONICAS` **D-748** 🔴 — *«el 20 % vivo en `seller_comisiones` contra
el 10 % firmado»*, con la nota que lo agravaba: *«es plata viva y es tabla
NUESTRA: la decisión de S95 no la toca»*.

### Lo medido hoy

**`seller_comisiones` NO EXISTE.** `to_regclass('public.seller_comisiones')` →
`NULL`. Murió con todas las letras en:

```
supabase/migrations/20260811120000_s95_m1_limpieza_comercio.sql:129
DROP TABLE public.seller_comisiones;          -- D-748: el 20 % vivo
```

⇒ **D-748 está PAGADA por eliminación del objeto**, y su ficha en el canon
**todavía dice `VIVE`**. *Hallazgo de canon, no de código.*

### 🔴 PERO LA MUERTE DE LA TABLA CREÓ UN DEFECTO NUEVO, Y ES EL MÁS FINO DEL CENSO

**`e-petplace-admin` sigue leyendo y ESCRIBIENDO esa tabla** (HEAD del admin:
`79eb141`, **10-may-2026** — no se toca hace tres meses):

| línea | qué hace |
|---|---|
| `src/pages/Sellers.tsx:410` | `.from('seller_comisiones').select('*')` |
| `src/pages/Sellers.tsx:414` | `setGlobalRate(String(global?.take_rate_pct ?? 14))` |
| `src/pages/Sellers.tsx:419` | `initRates[p.code] = String(com?.take_rate_pct ?? 14)` |
| `src/pages/Sellers.tsx:169-172 · 460` | **INSERT / UPDATE** sobre la tabla |
| `src/pages/Liquidaciones.tsx:197` | `setTakeRate(String(data?.take_rate_pct ?? 14))` |

> ### 🔴 **UN `?? 14` DEJÓ DE SER UN FALLBACK Y PASÓ A SER UNA CONSTANTE.**
>
> **D-759 describe estos tres como *«se activan justo cuando la tabla de
> configuración no responde»*. Hoy la tabla NO EXISTE ⇒ no es *«justo
> cuando»*: es SIEMPRE.** *La ficha está bien escrita para el mundo en que se
> escribió; el mundo cambió debajo y la ficha no tiene forma de enterarse.*

**Y la mitad de escritura es peor que la de lectura, aunque no la mido acá:**
la pantalla de comisiones del admin hace `INSERT`/`UPDATE` contra una tabla
inexistente. **Un admin que entre a bajar la tasa al 10 % opera sobre un
formulario que no puede guardar.** *Si esa pantalla muestra el error o lo come
en silencio es cosa de la UI y NO se midió — se declara como pregunta abierta,
no como veredicto.*

### El resto del cementerio, medido de una

| tabla que el admin cita | ¿existe en DB? | archivos del admin que la citan |
|---|---|---|
| `seller_comisiones` | ❌ | 3 |
| `seller_liquidaciones` | ❌ | 4 |
| `seller_inventario` | ❌ | 2 |
| `liquidacion_pedidos` | ❌ | 1 |
| `mensajes_admin_seller` | ❌ | 3 |
| `resenas_productos` | ✅ | 1 |
| `seller_perfil` · `productos` · `pedidos` · `pedido_items` | ✅ | — |

*Cruza con **D-758** (el portal desalineado), y **le agrega el número por
tabla** que la ficha no tenía.*

---

## ③ · EL 14 % — **EL ÚNICO DE LOS TRES QUE HOY LLEGA A UNA PANTALLA**

### Los diez lugares de D-759, RE-MEDIDOS uno por uno

**Los OCHO del admin siguen vivos, verbatim, en la misma línea que la ficha:**

```
src/pages/Dashboard.tsx:391    label="Revenue del mes (14%)"
src/pages/Dashboard.tsx:392    value={fmtUSD(gmvMes != null ? gmvMes * 0.14 : null)}
src/pages/Dashboard.tsx:393    sub="14% take rate"
src/pages/Sellers.tsx:414      ?? 14
src/pages/Sellers.tsx:419      ?? 14
src/pages/Sellers.tsx:820      "producto > categoría > país > global (14% default)"
src/pages/Financiero.tsx:16    const TAKE_RATE = 0.14
src/pages/Financiero.tsx:254   const revenueNeto = gmvTotal * TAKE_RATE
src/pages/Liquidaciones.tsx:197 ?? 14
```

**Y las DOS vistas siguen con el `0.14` embebido en su SQL**, leído de
`pg_get_viewdef`:

```
v_gmv_mensual           →   (sum(total) * 0.14) AS revenue,
v_metricas_tiempo_real  →   (gmv_mes.gmv_mes_actual * 0.14) AS revenue_mes,
```

⇒ **DIEZ DE DIEZ SIGUEN VIVOS.** *El disparo de la ficha —«ANTES de mostrar
`/inversores` o el Dashboard a cualquier persona fuera de la casa»— no se ha
consumido.*

### 🔴 Y UNA ONCEAVA QUE LA FICHA NO TIENE: **EL 14 % SIGUE VIVO EN `fee_configs`, PARA COLOMBIA**

| campo | valor |
|---|---|
| `id` | `3b75b736-a0c1-4a4a-ba70-a749b08b1554` |
| `country_code` | **`CO`** |
| `parametros` | `{"pct": 14.00}` — **sin `base`** |
| `vigencia_hasta` | **NULL — abierta** · `activo` = `true` |

**La cura de S95 cerró la fila de EC (`vigencia_hasta = 2026-08-11`) y dejó la
de CO abierta.** Medido: `resolver_comision_despensa('CO', now())` devuelve
**`pct 14.00`, `base null`**.

**Y el candado que debería haberlo atrapado NO lo atrapa, por cómo nació:**

```
chk_fee_pedido_declara_base
CHECK ((tipo_origen <> 'pedido') OR (parametros ? 'base'))  NOT VALID
convalidated = false
```

> **El CHECK nació `NOT VALID`** — o sea que **protege lo que entre desde hoy y
> exime a lo que ya estaba.** *Es la decisión correcta para poder crearlo sin
> romper filas históricas, y su costo es exactamente este: **la única fila de
> `pedido` viva sin base es la que el CHECK no mira**.*

**Lectura honesta del riesgo, sin inflarlo:** `MODELO_DESPENSA` firma **v1 =
USD/Ecuador**, así que hoy **nadie resuelve un fee de CO**. **No es plata
perdiéndose ahora — es una fila que dice 14 y espera.** *Y como el único
consumidor del resolutor es nadie, el día que se conecte la puerta va a
conectarse contra un resolutor que ya sabe contestar 14 para un país.*

---

## ④ · LA TABLA DE LOS TRES NÚMEROS

| # | número | fuente literal | estado del objeto | **quién lo consume HOY** |
|---|---|---|---|---|
| ① | **10 %** + base `total_con_impuesto` | `MODELO_DESPENSA:114` y `:322` | `fee_configs` `e2f7514c…`, EC, vigencia abierta | 🔴 **NADIE** — `resolver_comision_despensa` tiene 0 llamadores |
| ② | **20 %** | `seller_comisiones.take_rate_pct` | ☠️ **tabla DROPeada** (`20260811120000:129`) | ☠️ nadie puede — **pero 3 pantallas del admin la siguen consultando y caen a `?? 14`** |
| ③ | **14 %** | 8 literales del admin + 2 vistas + 1 fila `fee_configs` CO | **VIVO en los once** | ✅ **el Dashboard, `/inversores`, Financiero y Liquidaciones del admin** |

> ### **El número firmado es el único que no llega a ninguna pantalla. El número derogado es el único que llega a todas.**

---

## ⑤ · LO QUE ESTE CENSO **NO** MIDIÓ — declarado, no omitido

1. **Si la pantalla de comisiones del admin muestra el error o lo come.** Exige
   correr la UI del admin; **no se hizo** y no se infiere.
2. **`e-petplace-v2` y `epetplace-web`** no se barrieron para el 14 % — la
   ficha D-759 los ubica en el admin y ahí se re-midió. *Queda como hueco
   declarado, no como cero.*
3. **Nada se tocó.** Ni una fila, ni un grant, ni una vista.

---

## ⑥ · LA PREGUNTA QUE ESTE CENSO LE DEVUELVE A LA MESA

**El freno de la orden dice: *«nada se cablea al ledger antes de la firma del
número único (C0)»*.** El censo dice que **el número único ya está firmado y
depositado en el objeto correcto** (10 % · base `total_con_impuesto` · EC).

**Lo que falta firmar no es el número — son sus DOS BORDES:**

- **(a)** ¿la fila **CO al 14 % sin base** se cierra, se corrige a 10, o se
  deja abierta a propósito porque CO no está en v1?
- **(b)** ¿el `?? 14` de los tableros del admin pasa a **leer `fee_configs`**,
  o los tableros se apagan hasta que exista el motor de fee de despensa?

*Las dos son de la mesa: la (a) es dinero y la (b) es qué número ve alguien de
afuera. **Ninguna es técnica.***
