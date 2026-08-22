# S102-B · LA TANDA DE APLICACIÓN — servida para UNA firma del founder

> **🔴 NADA DE ESTO ESTÁ APLICADO.** Ambiente: **SANDBOX de punta a punta**.
>
> **Qué se firma acá: EL APPLY.** El contenido ya tiene sus firmas — la #1 de la
> fila CO, el dictamen de variante B para el pagador, y las dos curas de
> seguridad del relevo 2. **Esto es la orden de ejecutar, no la de decidir.**
>
> **Secuencia adoptada por dictamen de mesa (relevo 5): TRES ACTOS, sin ventana
> roja.** *La de dos actos y su ventana quedan al pie como **registro
> declarado, no como plan**.*

---

## ⓪ · LA TANDA EN UNA PANTALLA

| # | pieza | territorio | depende de | estado |
|---|---|---|---|---|
| **1** | columna `pagador_user_id` + `pagador_origen` + **backfill de 7** | DB · **A aplica** | — | ✅ lista |
| **2** | **deploy de `pagos-cobro` cableado** | edge de pago · **B** | 1 | ✅ construido |
| **3** | **CHECK validado + policy ensanchada** | DB · **A aplica** | 1 y 2 | ✅ lista |
| **4** | **fila CO** cerrada con marca | DB · **A aplica** | — *(independiente)* | ✅ lista |
| **5** | `v_ranking_usuarios` **fuera de `anon`** · `D-860` | DB · **A aplica** | **🔒 el censo de los 5 repos** | ⏸ **BLOQUEADA** |

**Los pasos 1→3 son una cadena y van en ese orden.** El **4** es independiente y
puede ir en cualquier momento. El **5 no entra a esta ventana**: espera evidencia.

---

## ① · PASO 1 — LA COLUMNA DEL PAGADOR *(migración A)*

**Artefacto:** `…-s102b-CURA-3-rls-pagos-intentos-cita.sql`, **desde el guard
hasta la marca `═══ FIN MIGRACIÓN A ═══`** (bloques ①·②·③). *El corte es
mecánico: está escrito en el archivo.*

**Qué hace:** crea `pagador_user_id` (nullable, FK a `auth.users`) y
`pagador_origen`, con el CHECK que los obliga a viajar juntos, y **backfillea
las 7 filas históricas de cita marcándolas `backfill_s102`**.

> **La marca no es prolijidad: es lo que permite, dentro de seis meses,
> distinguir un pagador REGISTRADO por la puerta de uno que DERIVAMOS
> nosotros.** *Un dato del que no se puede decir si se midió o se dedujo no
> sirve para responder una contracargo.*

**🔴 VEDA 76(g): RIGE.** Es la única pieza de la tanda con backfill sobre datos
vivos. **Nadie dispara un cobro** entre el snapshot-ancla y el veredicto del
cinturón. **El guard aborta si la población cambió** (espera exactamente 7 citas
y 34 pedidos).

**Reversa:** escrita en el archivo.
⚠️ **`DROP COLUMN` se lleva los pagadores que la puerta ya haya escrito** — y
**el orden de reversa es en piedra: primero la function, después la columna**
(regla 78). Al revés, el INSERT va contra una columna inexistente y el cobro cae.

**Evidencia esperada:** `pagador_origen='backfill_s102'` → **7 filas** · intentos
de cita sin pagador → **0**.

**Por qué NO rompe nada:** la columna nace **nullable** y **sin CHECK de
obligatoriedad** — el CHECK llega recién en el paso 3.

---

## ② · PASO 2 — EL DEPLOY DE `pagos-cobro` CABLEADO

**Artefacto:** `supabase/functions/pagos-cobro/index.ts` — **ya construido en
`pista/s102-b`**. Dos INSERT tocados: ≈205 (el rechazo por IVA) y ≈236 (el
intento real).

**Qué escribe:** `pagador_user_id: userId, pagador_origen: 'sesion'`.

**🔴 Explícito, jamás `DEFAULT auth.uid()`.** Medido, y el propio archivo ya lo
decía en su comentario: **`db` corre con `service_role` y ahí `auth.uid()` es
NULL** ⇒ un default habría escrito NULL en cada fila **sin fallar y sin avisar**.

**Por qué el rechazado también lo lleva:** es la fila que prueba que **esa
persona** intentó pagar y no pudo. *Justo la que va a querer ver.*

**Reversa:** redeploy de la versión anterior. **Se revierte ANTES que la
columna, nunca después.**

**Evidencia esperada:** un **cobro de cita real en sandbox** cuya fila nace con
`pagador_origen='sesion'`. **Sin ese cobro, el paso 3 se puede aplicar igual —
pero la tanda NO queda probada** (ver §⑤).

---

## ③ · PASO 3 — EL CHECK Y LA POLICY *(migración B)*

**Artefacto:** el mismo `.sql`, **desde `═══ FIN MIGRACIÓN A ═══` hasta el
final** (bloques ③bis y ④ + cinturón).

**Qué hace:**
- `chk_intento_de_cita_declara_pagador` **VALIDADO** — una fila de cita sin
  pagador pasa a ser **inexpresable**.
- La policy `pagos_select` **ensanchada, no reemplazada**: el brazo del pedido
  **se conserva** porque 34 filas históricas tienen pagador NULL y solo se
  resuelven por ahí. *Un ensanche que rompe lo que ya funcionaba no es un
  ensanche.*

> **🔴 EL CHECK HACE DOS TRABAJOS, y en esta secuencia hace el segundo MEJOR que
> en la de dos actos:**
> ① **valida el backfill** — y además **las filas nacidas entre el paso 1 y el
> paso 2**, que la secuencia de dos actos ni siquiera podía tener.
> ② **prueba que el cableado funcionó**: si el deploy del paso 2 falló, **la
> creación del CHECK ABORTA y nombra las filas ofensoras.**

**Reversa:** escrita, con la policy de hoy **copiada verbatim de `pg_policies`**,
no reescrita de memoria.

**Evidencia esperada:** el CHECK **se crea sin abortar** · y el **par del
discriminador**: el pagador ve **≥1** intento de cita **y sigue viendo** sus
intentos de pedido. *Sin el segundo brazo, un verde no distingue «ensanché» de
«reemplacé».*

---

## ④ · PASO 4 — LA FILA CO CERRADA CON MARCA *(firma #1 ya dada)*

**Artefacto:** `…-s102b-CURA-1-fila-co-14pct.sql`. **Independiente de todo lo
anterior.**

**Qué hace:** `activo=false` + `vigencia_hasta=now()` + la marca en `notas`.
**Desactivada, jamás borrada** — y el trigger `trg_audit_fee_configs` (AFTER
INSERT OR DELETE OR UPDATE, verificado en el objeto) deja la fila en
`fee_configs_historial`.

**Guard de identidad:** aborta si la fila no es la medida el 21-ago
(`pct=14.00`, `CO`, `pedido`, activa, sin `vigencia_hasta`). *La firma se dio
sobre un estado; si el estado cambió, la firma no cubre.*

**Reversa:** escrita. ⚠️ **No deshace el historial — y eso es deseable:** la
marca del cierre sobrevive aunque se revierta.

**Evidencia esperada:** `resolver_comision_despensa('CO', now())` → **NULL** ·
**y el discriminador**: `('EC', now())` → **`pct 10`, `base total_con_impuesto`**.
*Sin el segundo brazo, el cinturón no distingue «cerré CO» de «rompí todo».*

---

## ⑤ · PASO 5 — `v_ranking_usuarios` FUERA DE `anon` · **⏸ BLOQUEADA, NO ENTRA A ESTA VENTANA**

**Artefacto:** `…-s102b-CURA-2-ranking-fuera-de-anon.sql`. **Listo y esperando.**

> ### 🔒 **BLOQUEO: el censo de los otros CINCO repos, que corre A** *(dictamen de mesa, relevo 5 — territorio y acceso)*.
>
> `e-petplace-admin` · `e-petplace-v2` · `epetplace-web` ·
> `e-petplace-prestadores` · `e-petplace-sistema-pruebas`.
>
> **En ESTE monorepo el censo dio CERO consumidores** (grep sobre `apps/`,
> `packages/`, `supabase/functions/`). **Afuera no está medido, y ese censo es
> parte de la cura, no un trámite previo** (L-215).
>
> **Precedente que lo justifica:** `D-759` y `D-760` aparecieron **mirando
> afuera del monorepo**, y `v_pitch_metrics` sostiene un tablero que nadie de
> acá lee. *Un REVOKE es barato de aplicar y caro de descubrir: rompe en otra
> pantalla, otro día, sin decir por qué.*

**Se desbloquea con:** el censo de A **con su evidencia** (los cinco repos
nombrados y su conteo). **Con cero consumidores, se aplica; con alguno, vuelve a
la mesa.**

**Evidencia esperada al aplicarse:** `has_table_privilege('anon',
'public.v_ranking_usuarios','SELECT')` → **false** · y el discriminador:
`authenticated` y `service_role` **siguen en true** (el cinturón lo exige y
aborta si no).

---

## ⑥ · LA EVIDENCIA POST — un comando, y su condición de verde

```
node scripts/s102/verificar-pagador.mjs --desde <ISO del deploy del paso 2>
```

### El estado de partida, medido hoy y no supuesto

**Corrido el 21-ago contra la base real, con nada aplicado: 7 fallos, `EXIT=1`**,
cada línea nombrando qué falta. *El exit se leyó del comando, no de un pipe*
(L-191). **Un guard que nunca falló no es un guard: éste falló antes de que
nadie confiara en él** (L-192).

### 🔴 LA CONDICIÓN DE VERDE, y es la parte que no se puede aflojar

> **El arnés tiene que pasar de 7 fallos a VERDE *con un cobro de cita posterior
> al deploy*. Si dice `SIN CASO`, LA TANDA NO ESTÁ PROBADA.**

**Por qué no alcanza con que la estructura esté puesta:** su discriminador es
**`pagador_origen`**. Las 7 filas del backfill tienen `pagador_user_id` poblado y
**ninguna pasó por la puerta**. **Solo `'sesion'` prueba que `pagos-cobro`
escribió.**

> *Es la lección del gate de S101 hecha instrumento: **verificar la MATERIA
> PRIMA no prueba el ARTEFACTO.*** Ahí la intención llevaba los dos códigos y el
> correo salía genérico; acá la columna podría estar poblada y la puerta muerta.

**Y sale ROJO si no puede medir** (L-197), nunca verde por ausencia de datos.

---

## ⑦ · LO QUE **NO** ENTRA A ESTA TANDA — declarado

1. **El patch del admin** — repo aparte, **tanda propia con compilación y
   verificación en runtime**. **Su código no existe en ningún lado todavía.**
2. **La cura del comprobante** (`D-862`) — el dictamen está dado (va a quien
   pagó) y **esta tanda le construye la pieza que le faltaba**. La cura en sí es
   trabajo sobre `aplicar_evento_de_pago`.
3. **El `0.14` embebido en `v_gmv_mensual` y `v_metricas_tiempo_real`** — es DB.
   **Va junto con el patch del admin o el número sobrevive en la fuente.**
4. **Las cinco vistas restantes de `D-863`**, con su freno heredado de `L-328`:
   **no se curan con un patrón de clase sin medir el consumidor real de CADA
   una** — y acá el riesgo tiene nombre: **`v_pitch_metrics` sostiene el pitch
   deck**.
5. **Validar `chk_fee_pedido_declara_base`** — posible recién después del paso 4,
   y merece su propia firma.
6. **El cableo del pedido al ledger** — **sigue BLOQUEADO** por el candado de dos
   condiciones: el número está firmado, **falta que `crear_evento_economico`
   honre `base`**.

---

## ⑧ · 📋 REGISTRO DECLARADO — LA SECUENCIA DE DOS ACTOS Y SU VENTANA ROJA

> **NO ES EL PLAN.** Se conserva porque la mesa la aceptó primero y **una
> versión descartada sin su porqué obliga a re-litigarla**.

**Era:** `[1] migración completa (con CHECK) → 🔴 ventana → [2] deploy`.

**Su ventana roja:** desde el `COMMIT` hasta el deploy sirviendo, **1-3 min y
alargable sin aviso si el deploy falla**; **todo cobro de CITA rebotaba** por
violación de constraint (los de PEDIDO quedaban exentos).

**Por qué se descartó:** la de tres actos **da las mismas garantías y ninguna
ventana** — y el CHECK, al llegar último, **valida además las filas nacidas
entre medio**. *Prueba más, no menos.*

> ### **Entre romperle el cobro a un cliente y hacer abortar una migración, el costo va del lado del que puede leerlo.**

---

## ⑨ · LO QUE LA FIRMA AUTORIZA, EXACTAMENTE

**Aplicar los pasos 1 → 2 → 3 en ese orden, y el paso 4 cuando convenga.**
**El paso 5 NO** — espera el censo de A.

**Y una condición que va con la firma:** si el paso 3 **aborta**, no se
reintenta a mano — **significa que el cableado no cubrió todo**, y eso se
diagnostica antes de volver a correrlo. *El aborto no es un obstáculo del
procedimiento: es su resultado más informativo.*
