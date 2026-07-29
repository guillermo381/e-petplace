# S81-C1 — RELEVAMIENTO DEL MOTOR DE NOTIFICACIONES (solo lectura)

> **Sesión C-S81 (29 Jul 2026).** Territorio: DB + packages/api + docs.
> **CERO escritura, CERO migración. 76(g) NO RIGE — declarada** (ningún
> statement de este relevamiento muta datos; todas las consultas fueron
> `SELECT` sobre catálogo y tablas, vía `db query --linked`).
> **CERO cura propuesta** (mandato del brief). Proyecto verificado:
> `zyltipqscdsdsxnjclhp`. Método: catálogo (`pg_*`/`information_schema`)
> + grep literal en el monorepo — jamás memoria ni doc como fuente de
> schema (L-084/L-158).

---

## 1. La tabla (son TRES, todas con RLS)

### `notificaciones` — 24 filas

| Columna | Tipo | Null | Default |
|---|---|---|---|
| `id` | uuid | NO | `gen_random_uuid()` |
| `user_id` | uuid | NO | — (FK `profiles(id)` ON DELETE CASCADE) |
| `country_code` | text | NO | `'EC'` |
| `tipo` | text | NO | — (CHECK de 26 valores, abajo) |
| `canal` | text | NO | `'in_app'` (CHECK: `push · email · whatsapp · in_app`) |
| `titulo` / `mensaje` | text | NO | — |
| `datos` | jsonb | SÍ | `'{}'` |
| `url_accion` | text | SÍ | — |
| `leida` / `leida_en` | bool / tstz | NO / SÍ | `false` / — |
| `enviada` / `enviada_en` / `error_envio` | bool / tstz / text | NO / SÍ / SÍ | `false` / — / — |
| `created_at` | tstz | NO | `now()` |
| `rol_destino` | text | NO | CHECK: `pet_parent · prestador · seller · admin` (o NULL — el CHECK admite NULL pero la columna es NOT NULL: el OR IS NULL del CHECK es letra muerta) |

**CHECK de `tipo` (los 26 valores literales):** `pedido_estado ·
cita_recordatorio · cita_confirmada · vacuna_vencida · wearable_alerta ·
mensaje_nuevo · promocion · sistema · pago_confirmado ·
devolucion_estado · pedido_recurrente · cita_rechazada ·
cita_completada · cita_no_show · cita_solicitada ·
cita_cancelada_cliente · cita_calificada · prestador_aprobado ·
prestador_rechazado · prestador_suspendido · documento_aprobado ·
documento_rechazado · liquidacion_disponible ·
alta_asistida_pendiente_enviar_email ·
alta_asistida_completada_por_cliente · alta_asistida_vencida_soporte`.
**`saldo_pagado` NO está en el CHECK** (verificado literal). No existe
columna `categoria`.

**RLS (4 policies):** `notif_owner` SELECT own-or-admin ·
`notif_update` UPDATE own-or-admin · `notif_admin` ALL `is_admin()` ·
`notif_insert_prestador_cita` INSERT (un prestador/empleado activo
puede insertarle una notificación al dueño de una cita suya — la
puerta del INSERT desde cliente autenticado).

**Grants (medidos, tabla-nivel):** `anon` tiene **SELECT, INSERT,
UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER** sobre `notificaciones`
Y sobre `push_tokens` (grants default legacy; `authenticated` y
`service_role` igual). La RLS bloquea DML de `anon` (ninguna policy lo
nombra), **pero TRUNCATE no pasa por RLS** — un rol con grant TRUNCATE
truncaría la tabla con RLS encendida. Se registra como hecho medido, no
se propone cura (mandato). `user_notificacion_prefs` NO tiene grants a
`anon` (solo authenticated/service_role).

**Volumen real:** 24 filas (2-may-2026 → 27-jul-2026). Tipos vivos:
`cita_confirmada`=8 · `cita_completada`=5 · `prestador_aprobado`=3 ·
`documento_aprobado`=3 · y 1 de c/u: `vacuna_vencida`,
`pedido_estado`, `cita_recordatorio`, `promocion`,
`alta_asistida_completada_por_cliente`. **`enviada=true` en 5 filas,
TODAS del 2-may-2026** (pre-monorepo: `cita_confirmada·push`,
`cita_recordatorio·push`, `vacuna_vencida·push`, `pedido_estado·in_app`,
`promocion·in_app`) — huella de un emisor del stack legado que ya no
corre; todo lo posterior quedó `enviada=false` para siempre.

### `push_tokens` — **0 filas**

`id · user_id (FK profiles, CASCADE) · token (UNIQUE) · plataforma
(CHECK ios/android/web) · activo default true · created_at ·
last_used_at`. RLS: 1 policy `pt_own` ALL own-or-admin (WITH CHECK
own). **Cero filas, cero registrador** (§4).

### `user_notificacion_prefs` — 5 filas

`user_id (FK auth.users, CASCADE) · tipo (PK compuesta con user_id,
CHECK no-vacío) · habilitada default true · updated_at`. RLS: 3
policies own (SELECT/INSERT/UPDATE, rol `public` con `auth.uid()`).
Filas vivas: `cita_recordatorio=true` ×2, `promocion=true`,
`cita_confirmada=true`, `cita_completada=true`.

**Sin triggers propios ninguna de las tres tablas** (0 no-internos).

## 2. Censo de PRODUCTORES (por prosrc, con verificación de que el match es código)

**8 funciones matchean `%notificaciones%`; los productores REALES son
6 escritores directos + 2 triggers que escriben vía helper.** Dos
atrapes L-170 en este mismo censo (el grep lee comentarios como
código): ① `trg_prestadores_notif_cambio_estado` matcheó por un
COMENTARIO — pero ES productor real porque llama al helper ② la
"llamada" a `cerrar_y_renovar_planes` dentro de
`vencer_programas_adiestramiento` es un comentario (`--
cerrar_y_renovar_planes).`) — NO es caller.

| Productor | Cómo escribe | `tipo` que estampa | ¿Corre hoy? |
|---|---|---|---|
| `fijar_fecha_procedimiento` | INSERT directo ("notificación al dueño SIEMPRE", D-439) | `cita_confirmada` | SÍ — camino vivo del presupuesto coordinado |
| `_notificar_dueño_prestador` (helper) | INSERT directo | el que le pasen | vía sus 2 triggers |
| `trg_prestadores_notif_cambio_estado` → trigger `trg_prestadores_notif_estado` ON `prestadores` | vía helper | `prestador_aprobado/rechazado/suspendido/sistema` | SÍ (las 3 filas `prestador_aprobado` son de esto) |
| `trg_prestador_documentos_notif_cambio_estado` (trigger ON `prestador_documentos`) | vía helper | `documento_aprobado/rechazado` | SÍ (las 3 filas `documento_aprobado`) |
| `cerrar_y_renovar_planes` | 4 INSERTs directos | `sistema` (aviso 72 h con `datos.subtipo='plan_renovacion_72h'` + los de renovación/no-renovación) | **SÍ — cron `cerrar-renovar-planes` @ `0 8 * * *`** |
| `vencer_paquetes_salidas` | 1 INSERT directo | `sistema` | **NO — sin cron, cero callers en DB** (confirma S80: cero breakage en la historia, el aviso jamás enviado) |
| `vencer_programas_adiestramiento` | 2 INSERTs directos | `sistema` | SÍ — cron `vencer-programas-adiestramiento` @ `0 8 * * *` |
| `_trg_completar_pendiente_registro` / `cleanup_pendientes_vencidos` (alta asistida legacy; `cliente_pendiente_registro` porta su propio contador `notificaciones_enviadas`) | INSERT directo | `alta_asistida_completada_por_cliente` / `alta_asistida_vencida_soporte` | SÍ — cron `cleanup_pendientes_vencidos_diario` @ `0 3 * * *` + trigger |

**cron.job literal (pg_cron 1.6.4, 4 jobs):**
`expirar-citas-pendientes @ * * * * *` ·
`cleanup_pendientes_vencidos_diario @ 0 3 * * *` ·
`cerrar-renovar-planes @ 0 8 * * *` ·
`vencer-programas-adiestramiento @ 0 8 * * *`.
**`vencer_paquetes_salidas` NO está** — la precondición ① del 1-oct
(SOFTLAUNCH §3.5: encender el reloj = aplicar la enmienda P14/P16, un
solo acto) sigue intacta y sin encender.

## 3. Censo de CONSUMIDORES (grep literal en apps + packages)

**CERO lectores de `notificaciones` en el monorepo.**
`from('notificaciones')` y `from('push_tokens')`: **cero hits** en
`apps/`, `packages/`, `supabase/functions/`. No existe wrapper
`notificaciones.ts` en `packages/api/src/wrappers/` (censo del
directorio completo: 50+ wrappers, ninguno de notificaciones). Las
únicas menciones en apps son: strings i18n ("Notificaciones"), la
pantalla de preferencias de cada app, y un comentario del Hogar.

⇒ **La afirmación de SOFTLAUNCH §3.5 ("hoy ambos escriben a una tabla
que ninguna superficie del cliente muestra con push real") queda
VERIFICADA LITERAL en su mitad "ninguna superficie la muestra"** — ni
push real ni siquiera in-app: no hay centro de lectura (D-445 sigue en
cero). Su otra mitad ("ambos escriben") es imprecisa y la propia
precondición ① lo corrige: **solo el aviso 72 h del plan escribe hoy**;
el de paquetes está construido y nadie lo corre (ver §6).

**Límite declarado del censo:** el portal admin legado comparte esta
DB (hallazgo S49) y queda FUERA del grep — las 5 filas `enviada=true`
del 2-may y el tipo `alta_asistida_*` son huella de ese stack, no del
monorepo.

## 4. LA PATA NATIVA — ¿push remoto exige BUILD NATIVA?

**SÍ. Respuesta exigida: push remoto EXIGE BUILD NATIVA en ambas
apps.** Las piezas, medidas una por una:

- **`expo-notifications` NO está instalado**: cero hits en
  `apps/*/package.json`, `packages/`, y `pnpm-lock.yaml`. Es módulo
  NATIVO ⇒ L-134: paquete nativo nuevo = subir `version` + build nueva
  + reinstalar APK. No viaja por OTA.
- **Plugins en `app.json`/`app.config.ts`**: cliente lleva
  expo-router/splash/image-picker; prestador suma
  speech-recognition/location/camera/video. **Ningún plugin de
  notificaciones en ninguna de las dos.** Los `app.config.ts` solo
  inyectan `GOOGLE_MAPS_API_KEY`.
- **FCM: no existe.** Cero `google-services.json` en el repo, campo
  `android.googleServicesFile` ausente en ambas apps. Sin FCM
  configurado, Android no recibe push ni con el JS instalado. (Y la
  lección D-574 aplica de lleno el día del build: un secret que se
  omite en silencio ya costó el mapa — el `google-services.json`
  entraría al mismo régimen de "toda build declara qué secrets
  encontró".)
- **projectId de EAS: SÍ existe en ambas** (`extra.eas.projectId` —
  cliente `7f357bfa-43c2-4c8c-983b-0bcfff40ce7d`, prestador
  `83a4d295-764e-4067-add2-e91512c06649`) — es el parámetro que
  `getExpoPushTokenAsync` exige; esa pieza ya está.
- **Tabla de push token: existe (`push_tokens`, §1) con RLS own y 0
  filas. Registrador: NADIE** — cero código en apps/packages toca
  `push_tokens`; ninguna función de DB la menciona salvo cero (censo
  prosrc `%push_tokens%`: vacío).
- Lo que NO exige build: el canal `in_app` (el centro de lectura
  D-445) es JS puro sobre una tabla que ya tiene RLS de lectura own —
  podría viajar por OTA. El PUSH remoto, no.

## 5. MODELO_NOTIFICACIONES §3 vs lo que el motor escribe hoy: NO COINCIDEN

**§3 literal (transcripción exigida por el brief):**

> | Categoría | Qué es | Meta | Apagable |
> |---|---|---|---|
> | `seguridad_cuenta` | acceso, cambios de credencial | authentication | **NO** (canal sí elegible) |
> | `salud_seguridad` | urgencia, alerta de la mascota, retiro de lote | utility | **NO** (canal sí elegible) |
> | `operacion` | cita, servicio, pedido, autorización | utility | sí, por canal |
> | `relacional` | mensajes, respuesta a una solicitud | utility | sí, por canal |
> | `resumen` | digests (§8) | utility | sí, opt-in |
> | `comercial` | promos, ofertas, novedades | **marketing** | sí — **OPT-IN, apagado por defecto** |
> | `saldo_pagado` *(ENMIENDA S80 — A LA FIRMA)* | saldo pagado que vence: paquetes, planes (el aviso de P16(e)) | utility | **NO en existencia** — sí en canal |

**Lo que el motor escribe hoy:** un vocabulario plano de 26 `tipo`
legacy (§1) sin columna de categoría, sin unidad
(categoría × canal), y con los avisos de plata viajando como
**`sistema`** — que en la taxonomía §3 no existe. Ninguna de las 7
categorías de §3 existe en DB (incluida `saldo_pagado`, coherente con
su estado "a la firma"). El mapeo tipo→categoría no está escrito en
ningún lado. **El motor de S73 (§2: intención/destinatario/
consentimiento/transporte) no está construido — lo que hay es la tabla
legacy del stack anterior con productores nuevos escribiendo adentro.**

## 6. Las tres dependencias declaradas — escritor vivo vs letra sola

| Dependencia | Estado MEDIDO |
|---|---|
| **P14 — aviso de renovación 72 h del plan** | **ESCRITOR VIVO Y CORRIENDO**: `cerrar_y_renovar_planes` (cron diario 8:00) escribe el aviso con dedupe por `pago_metadata` (`aviso72h_<periodo_fin>`), `tipo='sistema'`, `datos.subtipo='plan_renovacion_72h'`, precio mensual de la reforma S79 declarado (y la variante honesta "no va a poder renovarse" si el plan ya no se ofrece). **Lo que falta no es el escritor: es que ALGUIEN LO MUESTRE (§3) y el push (§4).** |
| **P16(e) — aviso de vencimiento del paquete (`saldo_pagado`)** | **ESCRITOR CONSTRUIDO, RELOJ APAGADO**: `vencer_paquetes_salidas` existe e inserta (`tipo='sistema'`), pero SIN cron y con cero callers — jamás corrió (cero breakage en la historia, confirma S80). La categoría `saldo_pagado` NO existe en DB (a la firma). Precondición ① del 1-oct intacta: encender el reloj = aplicar la enmienda payout, un solo acto. |
| **Vitrina por persona (S78) — aviso de reasignación** | **LETRA SOLA**: `to_regprocedure('public.notificar_reasignacion_cita(uuid, uuid)')` ⇒ **NO EXISTE**. Coherente por diseño: el guard `trg_prestadores_gate_vitrina` rebota el encendido de la vitrina hasta que ese artefacto exista (L-171 — el gate se abre solo el día que se construya). `expone_personas` sigue sin poder encenderse. |

## 7. Preferencias del usuario (D-316, contrato "ausente = habilitada")

- **Existen en DB**: `user_notificacion_prefs` (§1), 5 filas reales,
  RLS own correcta. Escritura viva desde el cliente:
  `packages/api/src/wrappers/preferencias.ts` (lee y upserta por
  `tipo`; pantalla `cuenta/preferencias.tsx` en ambas apps —
  el prestador solo dibuja el "Pronto").
- **¿Algo las consulta antes de emitir? NO — CERO.** Censo prosrc
  `%user_notificacion_prefs%` en funciones de DB: **vacío**. Ninguno
  de los 8 productores del §2 mira preferencias antes del INSERT: hoy
  toda emisión ignora la voluntad guardada. La voz de la pantalla del
  cliente ya lo declara honesta: *"Cuando las notificaciones lleguen
  al teléfono, vamos a respetar esto."* — la promesa es a futuro y hoy
  es verdad: no llegan al teléfono (push_tokens=0, §4), así que no hay
  emisión que la esté traicionando. El día que un transporte se
  encienda, el gate §5/§6 del MODELO (estructural, no filtro de UI)
  sigue todo en cero.
- Nota de contrato: las prefs guardan por `tipo` legacy (unidad
  persona×tipo), no la unidad **(persona × categoría × canal)** que
  MODELO_NOTIFICACIONES §6 exige — misma brecha del §5.

---

**Resumen en una línea:** la tabla legacy existe y tiene 8 productores
nuevos escribiendo adentro (2 con cron vivo), pero **nadie la lee,
nadie la envía, nadie registra tokens, nadie consulta preferencias, y
el push remoto exige build nativa** (expo-notifications + FCM
ausentes); las categorías §3 y la unidad de consentimiento §6 del
MODELO no existen en DB. Cero cura propuesta — este reporte es insumo
de mesa.
