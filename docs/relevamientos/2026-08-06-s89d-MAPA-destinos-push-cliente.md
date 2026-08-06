# S89-D · MAPA DE DESTINOS DEL CLIENTE — insumo para la lámina de push

> **Solo medición — este depósito SIRVE EL MAPA; la lámina la diseña
> la mesa con el founder.** Base: `apps/cliente/src/lib/destino-aviso.ts`
> (el mapeo vivo, par 13/13) + el contrato vivo de `AvisoDeCampana`
> (`packages/api/src/wrappers/campana.ts`) + el lector
> `obtener_mis_avisos` y los productores, leídos por
> `pg_get_functiondef` (6-ago-2026).

## 0 · LAS TRES PIEZAS DEL CONTRATO, medidas

1. **Lo que el aviso porta hoy** (`AvisoDeCampana`): `tipo` ·
   `mascotaId` · `mascotaNombre` · `eventoId` · `tieneDestino` ·
   la voz (`titulo`/`mensaje`) · `categoria` · `creadoEn`.
   **NO porta `solicitudId`** (rama «autorización» — §3).
2. **Quién decide si es tocable — EL SERVER**, y su criterio vivo:
   ```sql
   (i.mascota_id IS NOT NULL OR i.evento_id IS NOT NULL) AS tiene_destino
   ```
   ⇒ **por REFERENTE, no por tipo.** La consecuencia está en §2-cruce ①.
3. **Cómo rutea el cliente** (`destinoDeAviso`): por TIPO con
   `mascotaId` como llave donde el destino es de una mascota, y por
   TIPO SOLO donde el destino es un hub. Fallback: aviso con mascota
   sin rama propia → su expediente. Sin nada → `null` (no tocable).

**Para push, el payload mínimo es el mismo trío del mapeo:**
`tipo` + `mascota_id` + `mascota_nombre` *(el nombre es para el
título del hub de citas; cae a `''` sin romper — opcional pero
deseable)*. Un push que no porte lo que su fila de abajo pide
aterriza en la app SIN destino.

---

## 1 · LA TABLA — tipo → destino → dato que debe portar → hueco

**24 tipos vivos alcanzan al cliente** (18 `audiencia=cliente` + 6
`ambas`, catálogo medido en el relevamiento D-539 de esta fecha).

### Al hub de citas de la mascota — `/citas/[mascotaId]`

| tipo | dato requerido | hueco |
|---|---|---|
| `cita_confirmada` *(A produciendo)* | `mascota_id` (+`mascota_nombre`) | **REQUISITO A A: la intención debe nacer con `mascota_id`** — sin él la rama no matchea y NO hay fallback (cae a `null`: ni campana tocable ni push con destino |
| `cita_recordatorio` *(A produciendo)* | ídem | ídem |
| `cita_rechazada` | ídem | sin productor hoy (fuera de los tres de A) — mismo requisito el día que nazca |
| `cita_completada` (ambas) | ídem | sin productor |
| `cita_no_show` (ambas) | ídem | sin productor |
| `procedimiento_agendado` | ídem | ✅ productor vivo (`fijar_fecha_procedimiento`) estampa `mascota_id` real — cero hueco |

### A los hubs de lo pagado — solo por TIPO

| tipo | destino | dato | hueco |
|---|---|---|---|
| `plan_renovado` · `plan_renovacion_proxima` · `plan_renovacion_fallida` · `plan_vencido_reembolso` · `paquete_vence` | `/hogar/paseos` | ninguno (el tipo basta) | ✅ los productores vivos estampan `mascota_id` igual ⇒ `tiene_destino=true` — cero hueco HOY. ⚠️ pero el destino NO depende de la mascota: ver cruce ① |
| `programa_vence` · `programa_vencido_reembolso` | `/hogar/adiestramiento` | ninguno | ídem ✅ / cruce ① |

### Al historial de pagos — `/cuenta/pagos`

| tipo | dato | hueco |
|---|---|---|
| `pago_confirmado` · `devolucion_estado` | ninguno (el tipo basta) | **🔴 EL CRUCE ① EN SU CASO LIMPIO:** sin productor hoy; el día que nazcan, si la intención no porta referente el server marca `tiene_destino=false` y la fila NO es tocable — **aunque el cliente SÍ sabe llevarla.** O nacen con referente, o el criterio del server se ensancha (decisión de A/mesa, no de esta pista) |

### Al expediente de la mascota (fallback honesto) — `/hogar/mascota/[mascotaId]`

| tipo | dato | hueco |
|---|---|---|
| `vacuna_vencida` | `mascota_id` → **rama propia: `/hogar/vacunas/[mascotaId]`** (el carnet) | sin productor hoy |
| `wearable_alerta` (ambas) | `mascota_id` (fallback expediente) | sin productor; sin rama propia — el expediente es destino DIGNO, la lámina decide si merece una |
| `mensaje_nuevo` (ambas) | `mascota_id` → fallback expediente; sin mascota → SIN DESTINO | **hueco de PANTALLA, no de dato**: el centro de mensajes no existe (D-445 angosta) |

### SIN DESTINO en el mapeo vivo (fila visible, NO tocable — honesto por lámina)

| tipo | por qué | nota para la lámina |
|---|---|---|
| `sistema` (seguridad_cuenta, ambas) | sin rama y sin mascota | candidata natural: la pantalla de contraseña/seguridad — **la lámina decide, el mapeo no se adelanta** |
| `promocion` | sin rama | ¿Explorar? — decisión de lámina; hoy honesto sin destino |
| `pedido_estado` · `pedido_recurrente` | sin rama, sin mascota | hueco de PANTALLA: la tienda no existe en el cliente (VTEX post-portal) |
| `alta_asistida_completada_por_cliente` · `alta_asistida_pendiente_enviar_email` | sin rama; su productor estampa `mascota_id => NULL` en alguna de sus ramas | avisos de onboarding — si la lámina les quiere destino (¿el Hogar?), se decide allá |

---

## 2 · LOS CRUCES QUE LA LÁMINA DEBE RESOLVER (servidos, no resueltos)

**① `tiene_destino` por REFERENTE vs destinos por TIPO.** El server
concede tocable solo con `mascota_id`/`evento_id`; el cliente rutea
los hubs de plata y pagos por TIPO SOLO. Hoy no choca porque los
productores vivos estampan mascota igual — **pero `pago_confirmado`/
`devolucion_estado` van a nacer sin mascota natural** y quedarían
no-tocables con destino sabido. Dos salidas (de A/mesa): la intención
nace con referente, o el criterio del server aprende de tipos.

**② El nombre en el push.** El hub de citas recibe
`nombre` como param y cae a `''` — un push sin `mascota_nombre`
LLEGA pero el título del hub pierde a la mascota. Deseable que el
payload lo lleve; no bloquea.

**③ `cita_solicitada` NO está en este mapa** — audiencia
`prestador` (va al negocio, D-673): su destino es del mapeo del
prestador (pista C), se declara para que nadie lo busque acá.

**④ La rama «autorización» sigue BLOQUEADA** — la lámina del
cliente nombra `/autorizacion/[solicitudId]` y `AvisoDeCampana` no
porta `solicitudId`; además ningún tipo del catálogo la produce hoy.
El dato (y el tipo) son de A — no se adivina. Cuando el lector lo
porte, la rama y su par se agregan (declarado en la cabecera de
`destino-aviso.ts` desde S88).

**⑤ Los «sin destino» son honestos A PROPÓSITO** (lámina: «un aviso
sin destino no se pinta como si lo tuviera») — para push, un tipo
sin destino abre la app en la CAMPANA y eso ya es un destino digno;
la lámina lo confirma o dibuja rutas nuevas, y cada ruta nueva es
construcción con su gate.

---

**Orden 3 · ②:** el literal de C1/C2/C4 NO llegó en esta orden —
nada que medir; el freno del depósito anterior sigue en pie.

**Origen: S89-D orden 3 · ① · alimenta la lámina de push (② del foco).**
