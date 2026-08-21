# S102-B · LA TANDA DE APLICACIÓN — servida a la mesa para firma del founder

> **🔴 NADA DE ESTO ESTÁ APLICADO.** Cuatro piezas, cada una con su reversa
> escrita ANTES y su evidencia esperada. **Ambiente: SANDBOX de punta a punta.**
>
> **Lo que se pide firmar es el APPLY**, no el contenido: el contenido ya tiene
> sus firmas (#1 la fila CO · el dictamen de variante B · las dos curas de
> seguridad del relevo 2).

---

## 🔴 FRENO DECLARADO ANTES DE LA TABLA — el orden pedido NO ES CONSTRUIBLE

**La orden de mesa lista:** *(a) ranking · **(b) RLS de `pagos_intentos`
ensanchada** · **(c) migración pagador + deploy** · (d) fila CO.*

**(b) NO PUEDE IR ANTES QUE (c), y no es preferencia: es dependencia.** El brazo
nuevo de la policy es literalmente `pagador_user_id = auth.uid()`, y **esa
columna la crea (c)**. Aplicar (b) primero **falla con «column does not
exist»** — la migración ni siquiera corre.

> *Se declara en vez de reordenarse en silencio: si la mesa quería otra cosa que
> lo que yo entendí, tiene que poder verlo antes de firmar y no descubrirlo
> chocando* (§5 del método: hallazgos, nunca veredictos).

**Y al mirarlo de cerca aparece algo mejor que resolver el orden. Ver la
sección siguiente.**

---

## ⓪ · DOS SECUENCIAS PARA LA CURA 3, Y CAMBIO MI VOTO

**El relevo 4 aceptó el costo del CHECK «CON FORMA»:** migración y deploy
contiguos, con **un rojo esperado entre ambos**. **Al armar la tanda encontré
una secuencia que NO TIENE ESE ROJO y no pierde ninguna garantía.** *Lo traigo
porque los datos cambiaron mi voto, no para re-litigar la decisión* (regla 12).

### SECUENCIA ① — la aceptada por la mesa (2 actos)

```
 [1] migración: columna + backfill + CHECK + policy      ← el CHECK ya frena
 ── 🔴 VENTANA ROJA: todo cobro de CITA rebota ──
 [2] deploy de pagos-cobro cableado
```

**Ventana roja: desde el COMMIT de la migración hasta que el deploy queda
sirviendo.** Duración realista **1 a 3 minutos** (`supabase functions deploy`),
y **puede alargarse sin aviso** si el deploy falla y hay que reintentar.
**Durante la ventana, `pagos-cobro` rebota con violación de constraint en todo
cobro de cita.** Los cobros de PEDIDO **no se ven afectados** (el CHECK los
exime por `pedido_id IS NOT NULL`).

### SECUENCIA ② — **MI VOTO** (3 actos, sin ventana roja)

```
 [1] migración A: columna + backfill          ← nullable, NO rompe nada
 [2] deploy de pagos-cobro cableado           ← desde acá toda fila nueva trae pagador
 [3] migración B: CHECK validado + policy     ← valida TODO y abre la lectura
```

**Por qué no pierde ninguna garantía, punto por punto:**

| garantía del CHECK | ¿sobrevive en ②? |
|---|---|
| **valida el backfill** | ✅ **y valida MÁS**: al crearse en [3] mira también las filas nacidas entre [1] y [2] |
| **obliga al cableado** | ✅ **con mejor forma**: si el deploy de [2] falló, **la creación del CHECK en [3] ABORTA y nombra las filas** — el fallo sigue siendo ruidoso, y llega **antes** de que nadie cobre en rojo |
| **hace inexpresable la cita sin pagador** | ✅ idéntico de [3] en adelante |

**Lo único que ② admite y ① no:** una ventana entre [1] y [2] donde un cobro de
cita nacería con `pagador NULL`. **No es silenciosa: [3] la encuentra y aborta
nombrándola.** *Y es la misma clase de ventana que ① tiene al revés — solo que
en ① el que paga el costo es el cliente que no puede pagar, y en ② lo paga la
migración que no termina.*

> ### **Entre romperle el cobro a un cliente y hacer abortar una migración, la casa ya tiene criterio: el costo va del lado del que puede leerlo.**

**Recomiendo ②. Si la mesa prefiere ① por atomicidad, se aplica ① y la ventana
roja queda declarada abajo con su reloj — como el relevo 4 ordenó.**

---

## ① · LA TANDA, EN ORDEN

### PASO 1 — `v_ranking_usuarios` fuera del alcance anónimo · **`D-860`** 🔴

| | |
|---|---|
| **Artefacto** | `docs/relevamientos/2026-08-21-s102b-CURA-2-ranking-fuera-de-anon.sql` |
| **Qué hace** | `REVOKE ALL … FROM anon` **y `FROM PUBLIC`** (L-216: revocar de `anon` dejando `PUBLIC` no cierra nada) |
| **Reversa** | escrita, en el mismo archivo. ⚠️ **Revertir REABRE la exposición** — dice esa frase en su propio texto |
| **Depende de** | nada |
| **🔴 FRENO PREVIO, obligatorio** | **censar los otros CINCO repos** (`e-petplace-admin`, `e-petplace-v2`, `epetplace-web`, `e-petplace-prestadores`, `e-petplace-sistema-pruebas`). En **este** monorepo son cero consumidores. **El censo es parte de la cura** (L-215) |
| **Evidencia esperada** | `has_table_privilege('anon','public.v_ranking_usuarios','SELECT')` → **false** · y el discriminador: `authenticated` y `service_role` **siguen en true**. El cinturón de la migración lo exige y aborta si no |

### PASO 2 — la columna del pagador *(secuencia ②: migración A)*

| | |
|---|---|
| **Artefacto** | `…-CURA-3-rls-pagos-intentos-cita.sql`, bloques ①·②·③ (**sin** ③bis ni ④) |
| **Qué hace** | `pagador_user_id` + `pagador_origen` + su CHECK de coherencia + **backfill de las 7 históricas marcado `backfill_s102`** |
| **Reversa** | escrita. ⚠️ **`DROP COLUMN` se lleva los pagadores que la puerta haya escrito**, y **el orden de reversa es en piedra: primero la function, después la columna** (regla 78) |
| **🔴 VEDA 76(g)** | **RIGE** — tiene backfill sobre datos vivos. **Nadie dispara un cobro** entre el snapshot-ancla y el veredicto. El guard de la migración **aborta si la población cambió** (espera 7 citas / 34 pedidos) |
| **Evidencia esperada** | `pagador_origen='backfill_s102'` → **7 filas** · citas sin pagador → **0** |

### PASO 3 — el deploy de `pagos-cobro` cableado

| | |
|---|---|
| **Artefacto** | `supabase/functions/pagos-cobro/index.ts` — **YA CONSTRUIDO** en esta rama, dos INSERT (≈205 el rechazo por IVA · ≈236 el intento real) |
| **Qué hace** | escribe `pagador_user_id: userId, pagador_origen: 'sesion'` **explícito** |
| **🔴 Por qué explícito** | medido: `db` corre con **`service_role`** y ahí `auth.uid()` es NULL — **un `DEFAULT` habría escrito NULL en cada fila sin fallar y sin avisar** |
| **Reversa** | redeploy de la versión anterior. **Se revierte ANTES que la columna, nunca después** |
| **Depende de** | paso 2 (si no, el INSERT va contra una columna inexistente y **el cobro cae entero**) |
| **Evidencia esperada** | un cobro de cita real en sandbox → su fila nace con `pagador_origen='sesion'` |

### PASO 4 — el CHECK y la policy *(secuencia ②: migración B — incluye el punto (b) de la orden)*

| | |
|---|---|
| **Artefacto** | `…-CURA-3-…sql`, bloques ③bis y ④ |
| **Qué hace** | `chk_intento_de_cita_declara_pagador` **VALIDADO** + la policy `pagos_select` **ensanchada, no reemplazada** (el brazo del pedido se conserva: 34 filas sin pagador dependen de él) |
| **Reversa** | escrita, con la policy de hoy copiada verbatim de `pg_policies` |
| **Depende de** | pasos 2 y 3 |
| **Evidencia esperada** | el CHECK se crea **sin abortar** (⇒ prueba que backfill + cableado cubrieron todo) · y el par del discriminador: el pagador ve **≥1** intento de cita **y sigue viendo** sus intentos de pedido |

### PASO 5 — la fila CO cerrada con marca · firma #1 ya dada

| | |
|---|---|
| **Artefacto** | `…-CURA-1-fila-co-14pct.sql` |
| **Qué hace** | `activo=false` + `vigencia_hasta=now()` + la marca en `notas`. **Desactivada, jamás borrada** |
| **Reversa** | escrita. ⚠️ **No deshace el historial** — y eso es deseable: la marca del cierre sobrevive |
| **Depende de** | nada |
| **Evidencia esperada** | `resolver_comision_despensa('CO', now())` → **NULL** · **y el discriminador**: `('EC', now())` → **`pct 10`, `base total_con_impuesto`**. Sin el segundo brazo, el cinturón no distingue «cerré CO» de «rompí todo». Además el cierre deja fila en `fee_configs_historial` |

---

## ② · LA EVIDENCIA POST — un solo comando

```
node scripts/s102/verificar-pagador.mjs --desde <ISO del deploy del paso 3>
```

**Cinco bloques:** estructura · backfill y cobertura · **el camino real** ·
el comprobante tiene de dónde leer · la policy por brazo.

> **🔴 Su discriminador es `pagador_origen`, y por eso el arnés no se conforma
> con que la columna esté poblada:** las 7 del backfill la tienen y **ninguna
> pasó por la puerta**. Solo `'sesion'` prueba que `pagos-cobro` escribió.
> *Es la lección del gate de S101 hecha instrumento: verificar la MATERIA PRIMA
> no prueba el ARTEFACTO.*

**Y sale ROJO si no puede medir** (L-197), nunca verde por ausencia de datos.
**Sin un cobro de cita posterior al deploy, el bloque ③ dice `SIN CASO` y
FRENA** — *un arnés sin caso no da verde.*

### ✅ SU ROJO YA ESTÁ PRODUCIDO — 21-ago, contra la base real

Corrido hoy, con la migración sin aplicar: **7 fallos, `EXIT=1`**, cada línea
nombrando qué falta (*«faltan columnas (hay 0 de 2)»*, *«el CHECK no existe»*,
*«la policy NO nombra pagador_user_id»*). **El exit se leyó del comando, no de
un pipe** (L-191).

> *Un guard que nunca falló no es un guard* (L-192). **Este falló antes de que
> nadie confiara en él.**

---

## ③ · 🔴 LA VENTANA ROJA — declarada ANTES de ejecutar, como se ordenó

**Aplica SOLO si la mesa elige la secuencia ①.** Con la ② no existe.

| | |
|---|---|
| **Qué se rompe** | todo **cobro de CITA**: `pagos-cobro` rebota con violación de `chk_intento_de_cita_declara_pagador` |
| **Qué NO se rompe** | los cobros de **PEDIDO** (el CHECK los exime) · la despensa entera · toda lectura |
| **Desde** | el `COMMIT` de la migración |
| **Hasta** | que `supabase functions deploy pagos-cobro` queda sirviendo |
| **Duración esperada** | **1-3 min**, y **puede alargarse sin aviso** si el deploy falla |
| **Atenuante medido** | el ambiente es **sandbox de punta a punta**: no hay tarjeta de una persona real del otro lado |
| **Si el deploy falla** | **se revierte la migración** (su reversa está escrita) antes de reintentar. *No se deja la ventana abierta «un rato más» mientras se depura* |

---

## ④ · LO QUE **NO** ENTRA A ESTA TANDA — declarado

1. **El patch del admin** (`e-petplace-admin`) — repo aparte, **tanda propia con
   compilación y verificación en runtime**, como quedó ordenado. **Su código no
   existe en ningún lado todavía.**
2. **La cura del comprobante** (`D-862`) — el dictamen está dado (va a quien
   pagó) y **esta tanda le construye la pieza que le faltaba**. La cura en sí es
   trabajo aparte, sobre `aplicar_evento_de_pago`.
3. **El `0.14` embebido en `v_gmv_mensual` y `v_metricas_tiempo_real`** — es DB y
   es de A. **Va junto con el patch del admin o el número sobrevive en la
   fuente.**
4. **Las cinco vistas restantes de `D-863`** — **y su freno heredado de `L-328`:
   no se curan con un patrón de clase sin medir el consumidor real de CADA una.**
   `v_ranking_usuarios` ya probó que el patrón correcto puede ser la cura
   equivocada para un miembro, y acá el riesgo tiene nombre: **`v_pitch_metrics`
   sostiene el pitch deck**.
5. **Validar `chk_fee_pedido_declara_base`** — posible recién después del paso 5,
   y merece su propia firma.

---

## ⑤ · LO QUE LA MESA TIENE QUE DECIDIR

1. **¿Secuencia ① o ②?** Mi voto: **②** — misma garantía, sin ventana roja.
2. **¿Se corre el censo de los cinco repos antes del paso 1?** Es el freno de
   `L-215` y **no lo puedo levantar yo**.
3. **La ventana roja de ① queda declarada arriba** con su reloj, por si se elige.
