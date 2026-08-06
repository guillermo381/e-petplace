# S89-C · MAPA DE DESTINOS DEL PRESTADOR — insumo para la lámina de push

> **Solo medición — este depósito SIRVE EL MAPA; la lámina la diseña la
> mesa con el founder.** Espejo del depósito de D (`083c0f5`, mapa del
> cliente), que dejó `cita_solicitada` fuera A PROPÓSITO porque su
> destino es de esta pista. Base: `apps/prestador/src/app/avisos.tsx`
> (`destinoDe`, el mapeo vivo) + el contrato vivo de `AvisoDeCampana`
> (`packages/api/src/wrappers/campana.ts`) + el catálogo y el lector
> `obtener_mis_avisos` medidos contra la DB viva (6-ago-2026).

## 0 · LAS TRES PIEZAS DEL CONTRATO, medidas (idénticas a las de D)

1. **Lo que el aviso porta hoy** (`AvisoDeCampana`): `tipo` · `mascotaId`
   · `mascotaNombre` · `eventoId` · `tieneDestino` · la voz · `categoria`
   · `creadoEn`. **NO porta `solicitudId`** — la misma rama «autorización»
   que D declaró bloqueada.
2. **Quién decide si es tocable — EL SERVER**, criterio vivo verificado
   por `pg_get_functiondef` en esta fecha:
   `(i.mascota_id IS NOT NULL OR i.evento_id IS NOT NULL) AS tiene_destino`
   ⇒ **por REFERENTE, no por tipo.** El lector es UNO para las dos apps:
   el cruce ① de D es también nuestro, y acá tiene MÁS casos (§2).
3. **Cómo rutea el prestador** (`destinoDe`, tres ramas):
   `cita_*`/`procedimiento_agendado` + `eventoId` → `/cita/[eventoId]` ·
   `liquidacion_disponible` → `/liquidaciones` ·
   fallback `mascotaId` → `/mascota/[mascotaId]` · sin nada → `null`.

**Payload mínimo de push para el prestador:** `tipo` + el referente de su
fila (`evento_id` = LA CITA para la familia `cita_*`; `mascota_id` para
los de mascota). Un push que no porte lo que su fila pide aterriza SIN
destino.

---

## 1 · LA TABLA — tipo → destino → dato que debe portar → hueco

**19 tipos vivos alcanzan al prestador** (13 `audiencia=prestador` + 6
`ambas`, catálogo medido: 37 totales, todos `activo`).

### A la cita — `/cita/[citaId]` (la ruta existe: `app/cita/[citaId]`)

| tipo | dato requerido | hueco |
|---|---|---|
| `cita_solicitada` *(productor A EN CONSTRUCCIÓN)* | `evento_id` = **LA CITA** | **🔶 REQUISITO A A — el gemelo del `mascota_id` de D, con un fork previo que es de mesa:** ver §3 |
| `cita_cancelada_cliente` | `evento_id` = la cita | sin productor hoy — mismo requisito el día que nazca |
| `cita_calificada` | `evento_id` = la cita | sin productor hoy |
| `cita_completada` (ambas) | ídem | sin productor |
| `cita_no_show` (ambas) | ídem | sin productor |

⚠️ **Nota del mapeo vivo:** la rama exige `eventoId !== null`. Un aviso
`cita_*` que nazca SOLO con `mascota_id` no cae a `null`: cae al fallback
`/mascota/[id]` — destino digno pero NO el hecho. El referente correcto
para esta familia es la cita, no la mascota.

### A liquidaciones — `/liquidaciones` (solo por TIPO)

| tipo | dato | hueco |
|---|---|---|
| `liquidacion_disponible` | ninguno (el tipo basta) | **🔴 EL CRUCE ① DE D, EN SU CASO LIMPIO DEL PRESTADOR** (gemelo exacto de `pago_confirmado` del cliente): sin productor hoy; el día que nazca, si la intención no porta referente el server marca `tiene_destino=false` y la fila NO es tocable — **aunque esta app SÍ sabe llevarla** (la rama existe en `destinoDe` desde S88). O nace con referente, o el criterio del server se ensancha — decisión de A/mesa, UNA para las dos apps; D ya la sirvió, este caso la refuerza |

### Al detalle de la mascota (fallback digno) — `/mascota/[mascotaId]`

| tipo | dato | hueco |
|---|---|---|
| `alta_asistida_vencida_soporte` | `mascota_id` | sin productor hoy. **🔶 cruce de AUDIENCIA a la mesa:** el sufijo dice `soporte` y la clasificación dice `prestador` — si el destinatario real es el operador/admin, su fila no debería llegar a esta campana. No se re-clasifica desde acá: se pregunta |
| `vacuna_vencida` (ambas) | `mascota_id` | sin productor; el detalle de mascota del prestador es destino digno (la RLS ya gobierna qué ve ahí) |
| `wearable_alerta` (ambas) | `mascota_id` | sin productor; ídem |
| `mensaje_nuevo` (ambas) | `mascota_id` (fallback) | **hueco de PANTALLA, no de dato** — el centro de mensajes no existe (D-445 angosta), mismo hueco que declaró D |

### SIN DESTINO en el mapeo vivo (fila visible, NO tocable — honesto)

| tipo | candidato natural | nota para la lámina |
|---|---|---|
| `documento_aprobado` · `documento_rechazado` | la puerta **«Tu negocio»** (fiscal · cobro · documentos — S85-C2, las cuatro puertas) o `veterinaria/verificacion` para la credencial | **doble hueco**: sin rama en `destinoDe` Y sin referente (cruce ① del server). La lámina decide la rama; el referente lo decide A/mesa |
| `prestador_aprobado` · `prestador_en_revision` · `prestador_rechazado` · `prestador_suspendido` | la raíz `/` — el guard re-resuelve y muestra el estado REAL (sala-espera / portal / voz de suspendido) | sin rama y sin referente. El candidato tiene una virtud: no inventa pantalla — el estado del negocio ya tiene su superficie por el guard |
| `registro_completado_operador` · `registro_completado_prestador` | ¿ninguno? — avisos del alta, la ceremonia ya tiene su carta (Día 1) | sin rama, sin referente; la lámina decide si merecen destino o son solo registro |
| `sistema` (seguridad_cuenta, ambas) | `cuenta/seguridad` (la pantalla existe) | mismo candidato que D dejó a la lámina en el cliente — se decide allá, el mapeo no se adelanta |

---

## 2 · LOS CRUCES SERVIDOS A LA MESA (resumen)

① **`tiene_destino` por REFERENTE vs destinos por TIPO** — en el
   prestador el cruce pega MÁS: 8 de los 13 tipos de audiencia
   `prestador` no tienen referente natural (`liquidacion_disponible`,
   los 2 de documento, los 4 de estado del negocio, los 2 de registro).
   Con el criterio vivo, TODOS nacerían no-tocables. La decisión es de
   A/mesa y es UNA para las dos apps (D la sirvió primero).

② **El fork de `cita_solicitada`** — §3, viaja a A con este depósito.

③ **La audiencia de `alta_asistida_vencida_soporte`** — ¿prestador o
   soporte/admin? (§1, tabla del fallback).

---

## 3 · EL REQUISITO A A — `cita_solicitada` (el gemelo del `mascota_id` de D)

**El fork previo, que es de modelo y no de ruteo:** «solicitada» puede
nombrar dos cosas en el motor vivo, y el referente depende de cuál sea:

- **(a) la solicitud YA ES una cita** (fila de cita en estado
  pre-confirmado / por-coordinar): la intención nace con
  `evento_id = cita.id` y **el mapeo vivo ya la lleva** a
  `/cita/[citaId]` — cero código nuevo en esta app.
- **(b) la solicitud NO es una cita todavía** (una solicitud de
  mostrador u otra entidad propia): el contrato `AvisoDeCampana` **no
  porta `solicitudId`** (rama «autorización» bloqueada, igual que en el
  cliente) y **no existe pantalla de solicitud** en esta app — el
  destino sería imposible sin (i) ensanchar el contrato del lector y
  (ii) una pantalla nueva. Ambas cosas son depósito, no construcción
  de esta orden.

**El requisito, en limpio: la intención de `cita_solicitada` debe nacer
con `evento_id = la cita` (camino (a)) — o A declara que es (b) y ese
día el destino se re-mapea con contrato y pantalla propios.** Hasta
entonces, un `cita_solicitada` sin `evento_id` cae al fallback de
mascota (si porta `mascota_id`) o a no-tocable (si no porta nada).

---

## 4 · DEPÓSITO EXTRA A A — la premisa que fija la derivación de ①

La firma de mesa «`saldo_pagado` NO se muestra al prestador» hoy se
cumple por DERIVACIÓN (par medido S89-C: `saldo_pagado` con audiencia
`prestador|ambas` = **0** ⇒ fila ausente · `salud_seguridad` = **2** ⇒
fila presente). El único camino silencioso para romper la firma es que
un tipo `saldo_pagado` nazca con audiencia `prestador|ambas` — eso no lo
ve ningún typecheck. **Cabe EXACTO en la forma `count(*) = 0` del censo
de regresión de A:**

```sql
-- premisa candidata: «la firma S88 del ocultamiento rige en el catálogo»
select count(*) as n
from cat_notificacion_tipos
where categoria = 'saldo_pagado'
  and audiencia in ('prestador', 'ambas')
  and activo;
-- inerte mientras n = 0; n > 0 = la firma se rompió en el catálogo
```

Se deposita — el registro es de A; esta pista no le agrega premisas por
su cuenta.
