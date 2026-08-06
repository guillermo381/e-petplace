# S89-A · ORDEN 1 — MEDICIÓN D-673: los productores de cita

**Fecha:** 2026-08-06 · **Pista:** A · **Método:** todo contra el objeto vivo
(`information_schema`, `pg_proc.prosrc`, `pg_get_functiondef` del presente —
L-208) y por **FORMA DE LLAMADA** (`.rpc('…')` en `packages/api`), jamás por
menciones. Horas en UTC. **Este depósito MIDE; no diseña ni decide.**

---

## 0. Veredicto en cinco líneas

1. Los tres tipos existen en el catálogo, `activo=true`, `en_sombra=true`, **con
   su audiencia ya clasificada** — el freno de la columna de audiencia que C
   declaró en S88 **ya no existe**.
2. El timbre (`registrar_intencion_notificacion`) existe, con 8 productores
   vivos. **Ninguno es de cita.** Cero productores CONFIRMADO en el objeto.
3. La tabla `notificacion_intencion` lo ratifica desde el otro lado: **cero
   intenciones `cita_*` jamás nacieron** — y **cero `procedimiento_agendado`
   tampoco**: el único productor "✅" de la familia **jamás disparó en
   producción**.
4. 🔴 Y no es solo que no disparó: **tiene una bomba de runtime** — la rama de
   notificación de `fijar_fecha_procedimiento` referencia `p_presupuesto_id`,
   que **no es parámetro de la función**. Rojo producido: `42703`. En cuanto
   corra con dueño real, **la RPC entera revienta y la fecha NO se fija**.
5. Para el recordatorio, la infra de tiempo existe entera (pg_cron + pg_net +
   tick por minuto + dedup UNIQUE); falta el scan, su voz, y **la ventana — que
   es decisión del founder y está pedida**.

---

## 1. El catálogo (medido)

Estructura de `cat_notificacion_tipos`: `codigo · categoria · descripcion ·
en_sombra (bool, NOT NULL, default true) · activo (bool, NOT NULL, default
true) · audiencia (text, NOT NULL, default 'ambas')`.

| codigo | categoria | audiencia | en_sombra | activo |
|---|---|---|---|---|
| `cita_confirmada` | operacion | **cliente** | true | true |
| `cita_recordatorio` | operacion | **cliente** | true | true |
| `cita_solicitada` | operacion | **prestador** | true | true |
| `procedimiento_agendado` | operacion | cliente | true | true |

**La voz:** `_voz_notificacion` **NO tiene entradas para los tres** — la
búsqueda exhaustiva por `prosrc` en toda la DB devuelve exactamente DOS
funciones que mencionan esos códigos, y ninguna es la voz (§3).

**Nota medida sobre audiencia:** hoy la consumen `_voz_notificacion` y
`_trg_completar_pendiente_registro`. `obtener_mis_avisos(p_limite)` y
`hay_avisos_sin_leer()` **no filtran por audiencia** — la campana lee por
`destinatario_user_id` a secas. Con cuentas separadas por rol no sangra; se
deja medido para el diseño de `cita_solicitada`.

---

## 2. El ciclo de vida real de la cita — por FORMA DE LLAMADA

Estados del CHECK vivo: `pendiente · confirmada · en_curso · completada ·
cancelada · no_show · rechazada`. **`solicitada` NO es un estado.** Y
`estado_reserva`: `pendiente_pago · pagada · expirada · cancelada`.

**No existe el paso "el prestador confirma": el PAGO confirma** (decisión S49,
viva en el motor). Las puertas que materializan cita, con su llamada real desde
`packages/api`:

| función (DB) | wrapper que la llama | qué materializa |
|---|---|---|
| `crear_bloqueo_agenda` | `agendamiento.ts` | hold: nace `pendiente / pendiente_pago`, `expira_en` 15' |
| `confirmar_cita_pagada` | `agendamiento.ts` | **la transición `pendiente→confirmada` + `pagada`** — EL punto del camino principal |
| `reservar_salida_paquete` | `paquetes.ts` | nace `confirmada / pagada` (salida de paquete) |
| `contratar_plan_paseo` → `_generar_citas_plan` | `planes.ts` (+ cron `cerrar_y_renovar_planes`) | citas del plan nacen `confirmada / pagada` |
| `_agendar_cita_desde_presupuesto` | (interna, al aprobar presupuesto) | nace `confirmada / pendiente_pago`, **SIN fecha** |
| `fijar_fecha_procedimiento` | `veterinaria-presupuesto.ts` | le pone fecha/hora/persona a la de arriba |
| `registrar_atencion_mostrador` | `veterinaria-mostrador.ts` | walk-in: nace `confirmada / pendiente_pago` (origen `mostrador`) |
| `crear_cita_negocio` | `pizarra.ts` | nace `confirmada / pendiente_pago` (origen `agenda_negocio`, la crea el negocio) |
| `tomar_cita` | `pizarra.ts` | asigna `empleado_id` — **no toca estado** |
| `reagendar_cita_suelta` / `cancelar_cita_suelta` | `citaSuelta.ts` | mueve/cancela una `confirmada` |

**La trampa que el censo S88 pagó dos veces, evitada acá:**
`confirmar_cita_servicio`, `rechazar_cita_servicio`, `completar_cita_servicio`
y `simular_cliente_agenda_cita` **existen en la DB con CERO llamadas desde el
monorepo** (grep de `.rpc(` en `packages/api/src`: 0 hits). Son legado del
portal viejo. Cualquier diseño que las cuente como camino real repite el error.

---

## 3. Cero productores — confirmado en el objeto vivo

**(a) Por el lado de los códigos:** `prosrc ILIKE '%cita_solicitada%' |
'%cita_confirmada%' | '%cita_recordatorio%'` en toda la DB ⇒ **2 matches**, los
dos leídos con `pg_get_functiondef` del presente:

- `_trg_otorgar_acceso_por_cita_confirmada` — el match es el string
  `'otorgado_por_cita_confirmada'` de su audit interno. Otorga acceso
  mascota↔cuenta al confirmar. **No notifica nada.**
- `fijar_fecha_procedimiento` — el match es el COMENTARIO del rename S87 (*"El
  tipo DECIA 'cita_confirmada'"*). Produce `procedimiento_agendado`, no los
  tres.

**(b) Por el lado del timbre:** los productores vivos de
`registrar_intencion_notificacion` son 8: `_notificar_dueño_prestador` ·
`_trg_completar_pendiente_registro` · `_trg_notificaciones_solo_lectura`
(guard) · `cerrar_y_renovar_planes` · `cleanup_pendientes_vencidos` ·
`fijar_fecha_procedimiento` · `vencer_paquetes_salidas` ·
`vencer_programas_adiestramiento`. **Ninguno registra un tipo `cita_*`.**

**(c) Por el lado del hecho:** `notificacion_intencion` agrupa así —
`paquete_vence` (5 leídas) · `plan_renovado` (6) · `programa_vencido_reembolso`
(6) · `registro_completado_prestador` (5). **Cero `cita_*`. Cero
`procedimiento_agendado`.**

---

## 3bis. 🔴 LA BOMBA — el único productor de la familia revienta al ejecutarse

En el body VIVO de `fijar_fecha_procedimiento` (firma real: `p_cita, p_fecha,
p_hora, p_empleado`):

```sql
p_datos => jsonb_build_object('cita_id', v_cita.id,
                              'presupuesto_id', p_presupuesto_id)  -- ← NO EXISTE
```

- **Rojo producido** (repro semántico en `pg_temp`, ROLLBACK):
  `SQLSTATE=42703 · column "p_presupuesto_id" does not exist`.
- **Cuándo entró:** `20260805080000` (S87 · lote 1), copiada verbatim a
  `20260805320000` (lote de voces). El original S70 escribía al canal viejo
  `notificaciones` y no tenía esta rama.
- **Consecuencia real:** la rama corre cuando `v_cita.user_id IS NOT NULL` — es
  decir, **con dueño real**. Sin handler alrededor: **la RPC entera revienta y
  la fecha del procedimiento NO SE FIJA.** No es "no suena el timbre": es que
  el negocio no puede coordinar el procedimiento.
- **Por qué ningún gate lo vio:** hoy hay **0 citas de presupuesto sin fecha**
  en la DB — nadie recorrió la rama desde S87. plpgsql resuelve identificadores
  al ejecutar, no al crear: el CREATE pasó verde. **Clase L-192.**
- **Segundo defecto en el mismo sitio** (para cuando se cure): la voz arma
  `'fecha', to_char(v_cita.fecha,…), 'hora', to_char(v_cita.hora,…)` — pero
  `v_cita` es el snapshot **PRE-update**, donde `fecha`/`hora` son NULL **por
  definición** (el gate de elegibilidad exige `fecha IS NULL`). La voz debe
  leer `p_fecha`/`p_hora`.

*(La cura no se escribe acá — la orden es medir. Queda señalada como la primera
línea del arco de productores: el patrón a copiar tiene la bomba adentro.)*

---

## 4. La sombra del productor real — qué hay en la mano donde el timbre debería sonar

### `cita_confirmada` (al dueño)

En el punto principal (`confirmar_cita_pagada`, justo después del UPDATE) hay
en scope: `v_cita` completa — `id · user_id (el dueño, garantizado: es quien
paga) · mascota_id · prestador_id · empleado_id · tipo_servicio · fecha · hora
· duracion_minutos · precio · modalidad · direccion_snapshot · country_code` —
más `v_cuenta.moneda` y `v_pagado_en`. La voz puede decir, con un join barato
cada uno: nombre de la mascota (`mascotas`), nombre del negocio
(`prestadores.nombre_comercial`), fecha `DD/MM`, hora `HH24:MI` — **el mismo
molde que ya usa la voz de `procedimiento_agendado`**. `clave_dedup` natural:
`'cita-confirmada:' || cita_id`.

En los otros nacimientos firmes la sombra es igual de rica (todos insertan
`user_id, mascota_id, prestador_id, fecha, hora, tipo_servicio, precio,
duracion` y retornan `v_cita_id`), con dos asteriscos medidos:
`_agendar_cita_desde_presupuesto` nace **sin fecha** (el aviso con fecha es el
de `fijar_fecha_procedimiento`, que ya tiene su tipo propio) y
`registrar_atencion_mostrador` puede nacer con dueño fantasma (`user_id` del
walk-in puede ser NULL — el patrón "se notifica cuando hay dueño real" ya está
escrito en `fijar_fecha_procedimiento`).

### `cita_solicitada` (al negocio)

El destinatario es resoluble en TODOS los puntos: `prestadores.user_id` (el
titular) vía `v_cita.prestador_id`; `empleado_id` también viaja en la fila.
Los puntos donde al negocio *le entra* una cita que él no creó: la transición
de `confirmar_cita_pagada`, `reservar_salida_paquete`, `_generar_citas_plan` y
la aprobación del presupuesto. Los caminos creados POR el negocio (`mostrador`,
`agenda_negocio`) tienen el mismo dato disponible — **si timbran o no al que
las creó es letra del founder, no de esta medición**. Dato de borde medido: el
hold (`crear_bloqueo_agenda`) es **invisible al prestador por diseño firmado**
(S54, gate doble) y expira a los 15'.

### `cita_recordatorio` (al dueño)

La sombra existe HOY: **6 citas `confirmada` con fecha futura (2026-08-06 →
2026-08-12), 6/6 con dueño en app.** Todo lo que la voz necesita está en la
fila (`fecha, hora, tipo_servicio, mascota_id, prestador_id`).

---

## 5. El recordatorio — qué existe hoy para disparos por tiempo

**Existe (medido en `cron.job` y en el objeto):**

| pieza | estado |
|---|---|
| pg_cron | vivo, 5 jobs activos (`expirar-citas-pendientes` cada minuto · `cleanup_pendientes_vencidos` 03:00 · `cerrar-renovar-planes` 08:00 · `vencer-programas-adiestramiento` 08:00 · **`despachar-notificaciones-tick` cada minuto**) |
| pg_net | vivo — el tick hace `net.http_post` a la Edge Function `despachar-correo` con la anon key |
| el despacho | `despachar_notificaciones(p_seco)` + `despachar-correo` desplegada |
| idempotencia | **GRATIS**: `clave_dedup` es UNIQUE y el timbre hace `ON CONFLICT DO NOTHING` — un scan que corra N veces con `'cita-recordatorio:' || cita_id` registra UNA vez |
| índices del despacho | `idx_intencion_pendientes (estado, created_at)` parcial + `idx_intencion_techo` |

**Falta (huecos, sin diseñar):**

1. **La función-scan no existe** — nada en la DB recorre citas por ventana de
   tiempo (`expirar_citas_pendientes` solo mata holds vencidos por
   `estado_reserva/expira_en`).
2. Su job de cron.
3. La voz de los tres tipos en `_voz_notificacion`.
4. **LA VENTANA (el cuándo)** — decisión del founder, ya pedida. **No se decide
   acá.**
5. Menor, declarado no bloqueante: `evento_cita_servicio` no tiene índice
   `(estado, fecha)` — el scan de hoy sería seq scan sobre tabla chica.

---

## 6. LA TABLA PEDIDA

| tipo | punto de disparo (el HECHO) | función que debería tocar el timbre | datos disponibles ahí | hueco |
|---|---|---|---|---|
| `cita_confirmada` | la cita queda FIRME para el dueño | `confirmar_cita_pagada` (transición principal) · nacimientos firmes: `reservar_salida_paquete`, `_generar_citas_plan`, `crear_cita_negocio`, (`registrar_atencion_mostrador`, `_agendar_cita_desde_presupuesto` con asteriscos §4) | fila entera de la cita + moneda + pagado_en; mascota/negocio a un join; molde de voz ya existente | productor: NO EXISTE · voz: NO EXISTE · qué nacimientos timbran: letra founder |
| `cita_solicitada` | al negocio le ENTRA una cita que no creó | las mismas puertas, con destinatario `prestadores.user_id` | `prestador_id` (→ titular) + `empleado_id` + fila entera | productor: NO EXISTE · voz: NO EXISTE · campana no filtra por audiencia (§1) · auto-aviso de mostrador/pizarra: letra founder |
| `cita_recordatorio` | se acerca la hora de una `confirmada` futura | **no existe función**: falta el scan + su job (la infra pg_cron+pg_net+dedup está entera, §5) | 6 citas futuras confirmadas hoy, 6/6 con dueño app; todo en la fila | scan: NO EXISTE · job: NO EXISTE · voz: NO EXISTE · **la VENTANA: decisión founder, pedida** |
| *(contexto)* `procedimiento_agendado` | fijar fecha del procedimiento | `fijar_fecha_procedimiento` — el único productor de la familia | las del §4 | 🔴 **BOMBA 42703 (§3bis): jamás disparó y revienta al primer uso real; + la voz leería fecha/hora NULL** |

---

*Depositado por la pista A, S89 · ORDEN 1. Nada de lo de arriba se construyó:
es medición. El diseño de los productores arranca cuando este depósito esté en
mesa.*
