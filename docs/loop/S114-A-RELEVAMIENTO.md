# S114-A · RELEVAMIENTO DE POSTVENTA Y WHATSAPP

> **Solo lectura. Cero escritura de producto, cero migraciones, cero deploys.**
>
> | | |
> |---|---|
> | **Punta de `main`** | `e516a089c3244e75c2ad153c59afced601dfce51` — *«S113-A · las ocho cuentas demo, creadas por el camino real y entrando»* |
> | **`origin/main`** | `e516a089` — **coincide con la local** (verificado con `git fetch` + `git rev-parse origin/main`) |
> | **Cerrado** | 2026-09-07 15:48 Guayaquil (`TZ=America/Guayaquil date`) |
> | **Base** | proyecto `zyltipqscdsdsxnjclhp`, `npx supabase --experimental db query --linked --file <archivo>` |
> | **Árbol** | limpio al abrir (`git status --porcelain` en 0) |

**Cómo se lee este documento.** Todo número lleva el comando que lo produjo. Todo
cero lleva su control positivo — *un instrumento que devuelve cero y no puede
demostrar que sabe encontrar algo no midió nada*. Lo que no se pudo saber está
declarado como **NULL** con su razón, y la última sección lo junta todo.

---

## ⓪ LA CADENA QUE ORDENA TODO LO DEMÁS, Y NO ESTABA EN EL PEDIDO

> ### **El ledger dejó de registrar el 9 de agosto, y por eso la postventa no tiene contra qué operar.**

Es el hallazgo que reordena las prioridades del arco, y apareció midiendo otra
cosa: contando cuántas veces corrió `aplicar_reembolso`.

| medición | número | comando |
|---|---|---|
| eventos económicos, julio | 19 · $225,50 | `select to_char(created_at,'YYYY-MM'), count(*), sum(monto_bruto) from eventos_economicos group by 1` |
| eventos económicos, agosto | **17 · $162,75 — y el último es del 9-ago** | ídem |
| eventos económicos, septiembre | **CERO** | ídem |
| intentos de pago **aprobados**, agosto | **91 · $3.945,89** | `select to_char(cerrado_en,'YYYY-MM'), count(*), sum(monto) from pagos_intentos where estado='aprobado' and cerrado_en is not null group by 1` |
| intentos de pago **aprobados**, septiembre | **12 · $387,86** | ídem |
| liquidaciones | **0 filas** | `select count(*) from liquidaciones` |

**La causa está medida y es de diseño, no un defecto suelto.** El evento
económico nace **al CERRAR con calidad** (variante (b), firmada en S54), y los
únicos productores son:

```
select p.proname from pg_proc p join pg_namespace n on n.oid=p.pronamespace
where n.nspname='public' and pg_get_functiondef(p.oid) ~* 'crear_evento_economico'
  and p.proname <> 'crear_evento_economico';
```
⇒ `cerrar_paseo_con_calidad` · `cerrar_grooming_con_calidad` ·
`cerrar_atencion_adiestramiento` · `marcar_no_show_cita` ·
`vencer_paquetes_salidas` · `resolver_fee_aplicable`.

**Y entonces:**

1. **`origen_tipo` es `'cita'` en los 36 eventos, sin una sola excepción.**
   Veterinaria, telemedicina, guardería y despensa **jamás produjeron un evento
   económico** — no porque fallen: porque ninguno de sus cierres lo crea.
2. **La última atención cerrada es de agosto** (`select to_char(cerrada_en,'YYYY-MM'), count(*) from evento_atencion where cerrada_en is not null group by 1` ⇒ jul 21 · ago 17 · **sep 0**).
3. **132 citas pasadas y pagadas siguen sin cerrar** (§3), contra 51 completadas
   — **el 72 % de lo cobrado nunca se devengó.**

> **La consecuencia para este arco, y es la que manda:** `aplicar_reembolso`
> reversa **eventos económicos**. Para casi toda la plata cobrada desde el 9-ago
> **no hay evento que reversar** — la única herramienta contable de postventa
> opera sobre un ledger que dejó de escribirse. *No es que la pieza esté rota:
> es que su insumo no existe.*

---

## ① LO QUE EXISTE DE POSTVENTA

**Instrumento.** Censo por nombre **y por comentario** sobre `pg_class`
(`relkind in ('r','v','m','p')`) y `pg_proc`, con el patrón
`(caso|reclam|disputa|queja|soporte|ticket|devoluc|reembols|saldo|credito|compensa)`.

**Control positivo del censo:** el mismo instrumento devolvió 11 tablas y 17
funciones, entre ellas objetos con 3, 11, 21 y 25 filas — *no está ciego.*

### Las tablas

| tabla | filas | último uso | callers vivos | pantalla |
|---|---|---|---|---|
| `tickets_soporte` | **0** | — | **0** en `packages/api`, **0** en `apps/`, **0** en edges | **ninguna** · el admin legado sólo la tiene en `database.types.ts` |
| `ticket_mensajes` | **0** | — | **0** | **ninguna** |
| `devoluciones` | **0** | — | **0** en el monorepo · **3 páginas del admin legado** | **🟢 SÍ — en el admin legado** (abajo) |
| `solicitudes_devolucion` | **0** | — | **0** en todo el árbol | **ninguna** |
| `caso_clinico` | 3 | 2026-08-27 | sí (`abrir_caso_clinico`, `asociar_a_caso`) | 3 archivos en `apps/` |
| `caso_clinico_consultor` | **0** | — | — | ninguna |
| `evento_caso_clinico_abierto` | 3 | — | sí | vía timeline |
| `evento_caso_clinico_cerrado` | **0** | — | — | — |
| `evento_caso_clinico_transferido` | **0** | — | — | — |
| `guarderia_documentos` | 11 | — | sí | sí (compuerta de aceptación) |
| `guarderia_estadia_actos` | 21 | 2026-09-03 | sí | sí |

Comandos: `select count(*), max(<col fecha>) from <tabla>` una por una ·
`grep -rn "<tabla>" --include="*.ts" --include="*.tsx" packages/ apps/ supabase/functions/` ·
`grep -rl "<tabla>" apps/*/src`.

### 🔴 EL HALLAZGO DEL BLOQUE: **la devolución de despensa SÍ tiene flujo, y vive en el admin legado**

El comentario de la tabla `devoluciones` dice, textual:

> *«MODELO_DESPENSA §10: la devolución NO se automatiza en v1 — se maneja por
> atención humana con criterio escrito en POLITICAS (D-744, sin redactar). La
> tabla y sus estados existen; **el flujo no**.»*

**Medido: el flujo existe.** `e-petplace-admin` corre contra **este mismo
proyecto** (`VITE_SUPABASE_URL=https://zyltipqscdsdsxnjclhp.supabase.co`, leído de
su `.env.local`) y su último commit es **`c0aee5e`, del 7-sep-2026 — o sea de
anoche**: está vivo, no es legado muerto.

| pieza | dónde | qué hace |
|---|---|---|
| crear una devolución | `src/pages/PedidoDetalle.tsx:239` | `supabase.from('devoluciones').insert({…})` |
| gestionarla | `src/pages/Logistica.tsx:563-598` | cuatro `update()`: aprobar · rechazar · marcar `recibida` · marcar `reembolsada` |
| listarla | `src/pages/Logistica.tsx:1172` | con join a `pedidos` y `profiles` |
| contarla | `src/pages/Dashboard.tsx:167` + tarjeta y CTA *«↩️ Gestionar devoluciones»* | |
| **métodos de reembolso** | `src/pages/Logistica.tsx:97` | `['transferencia','credito_tienda','efectivo','reverso_tarjeta']` |

**Vocabulario, del CHECK de la tabla:**
`estado ∈ {solicitada, aprobada, rechazada, recibida, reembolsada}` ·
`motivo ∈ {producto_defectuoso, producto_incorrecto, producto_no_llego, arrepentimiento, otro}`.

> **Y `credito_tienda` es la única mención de saldo a favor de una familia en
> todo el producto** — declarada como opción en una pantalla que nadie usó
> todavía, **sin un solo mecanismo detrás** (§2c).

### 🔴 DOS TABLAS DE DEVOLUCIÓN, CADA UNA ATADA A UN OBJETO DISTINTO, Y NINGUNA CUBRE TODO

| tabla | ancla | NOT NULL | alcance real |
|---|---|---|---|
| `devoluciones` | **`pedido_id`** | — | **sólo despensa** |
| `solicitudes_devolucion` | **`cita_id`** | **sí** | **sólo cita** |

⇒ **Estadía de guardería, bono, mensualidad, programa y suscripción no tienen
dónde registrar una devolución.** No es que falte la pantalla: falta la columna.
Y `solicitudes_devolucion` tiene **una sola policy y es de SELECT**
(`devolucion_select_propia`, `(user_id = auth.uid()) OR is_admin()`) ⇒ **nadie
puede crear una desde la app**; sólo `service_role`.

### Las edges

`npx supabase functions list` ⇒ **38 funciones ACTIVE.** Ninguna de postventa.
`chat-ayuda` **no está desplegada** — su fuente vive en el repo con un
`RESCATE.md` al lado (el rescate de S92-BIS · `D-717`), y eso queda confirmado
contra el objeto, no contra el canon.

---

## ② LA PLATA

### (a) `aplicar_reembolso()` — construida, correcta, y **jamás corrió**

`select pg_get_functiondef(oid) from pg_proc where proname='aplicar_reembolso'`
(5.988 caracteres, `SECURITY DEFINER`, `search_path` fijo).

**Qué reversa** — crea un evento inverso con **todos los montos en negativo**,
proporcionales a un factor:

| campo | cómo se calcula |
|---|---|
| `monto_bruto` | `-ROUND(original × factor, 2)` |
| `monto_kushki_fee` | `-ROUND(original × factor, 2)` |
| **`monto_plataforma`** | **`-ROUND(original × factor, 2)` — la comisión de e-PetPlace se devuelve entera** |
| `monto_payout` | `-ROUND(original × factor, 2)`, o `NULL` si el original lo era |

**Qué hace con la comisión, dicho sin rodeos: la devuelve.** En un reembolso
total el factor es 1 y `monto_plataforma` se reversa completo. *No hay una regla
que retenga la comisión — la decisión de si e-PetPlace se queda con su parte
cuando devuelve plata no está tomada en el código, y hoy el código dice que no
se la queda.*

**Parcial:** ✅ soportado. `factor = p_monto_parcial_bruto / monto_bruto`; el
original **no** se marca `reversado` (puede haber varios) y cada parcial se
anota en `metadata->reembolsos_parciales`. En un total, el original pasa a
`estado='reversado'` con `reversado_por_evento_id`.

**Dónde cae el inverso:** `pendiente_liquidar` si hay cuenta comercial,
`no_aplica` si no la hay ⇒ **se descuenta del próximo payout del prestador.**

**Validaciones que rebotan:** evento inexistente · reembolsar un reembolso ·
ya reversado · **`en_disputa`** *(un estado que la tabla admite y que nada
produce)* · `monto_bruto <= 0` · parcial ≤ 0 o mayor que el bruto.

| | número | comando |
|---|---|---|
| callers en el motor | **0** | `select proname from pg_proc where pg_get_functiondef(oid) ~* 'aplicar_reembolso' and proname <> 'aplicar_reembolso'` |
| callers en el repo | **0** | `grep -rn "aplicar_reembolso" --include="*.ts" --include="*.tsx" --include="*.mjs" packages/ apps/ supabase/functions/ scripts/` ⇒ sólo `database.types.ts` (generado) y `scripts/s95/verificar-censo.mjs` (que la censa, no la llama) |
| **veces que corrió** | **0** | `select count(*) from eventos_economicos where tipo_evento='reembolso'` ⇒ **0** · `where estado='reversado'` ⇒ **0** |
| `EXECUTE` para `authenticated` | **false** | `has_function_privilege('authenticated','aplicar_reembolso(uuid,text,uuid,numeric)','EXECUTE')` |
| `EXECUTE` para `anon` | **false** | ídem |
| `EXECUTE` para `service_role` | **true** | ídem |

> **Control positivo del cero de callers:** el mismo `grep` sobre
> `registrar_reverso_nuvei` devuelve `supabase/functions/pagos-reverso/index.ts:215`.
> **El instrumento encuentra callers cuando los hay.**
>
> **Control positivo del cero de corridas:** hay **36 eventos económicos** en la
> tabla. No está vacía — está vacía *de reembolsos*.

### (b) El reverso por riel

| | **Nuvei** | **DeUna** |
|---|---|---|
| función | `registrar_reverso_nuvei(uuid,text,text,numeric,text)` | `registrar_reverso_deuna(uuid,text,numeric,text,jsonb)` |
| consulta previa | `puede_reversar_nuvei(uuid)` | `puede_reversar_deuna(uuid)` |
| **ventana** | **mismo día calendario contra `cerrado_en`, en `America/Guayaquil`** | **24 horas contra `cerrado_en`** |
| **el brazo de las 17:00** | **✅ EXISTE y está medido**: `IF v_local::time >= TIME '17:00' THEN … 'fuera_de_ventana_corte'`, con la nota literal *«pasado el corte no es un endpoint: es un trámite con el banco»* | **no aplica** — DeUna no tiene corte horario, sólo el plazo de 24 h |
| edge | `pagos-reverso` (v6, ACTIVE, `verify_jwt:false`) | `pagos-reverso-deuna` (v6, ACTIVE, `verify_jwt:false`) |
| **PARCIAL** | **❌ no se pide nunca.** El comentario del cuerpo lo dice: *«**Nunca pedimos parcial** —la edge no manda `order.amount`»*. Si Nuvei devuelve `status_detail='34'` (parcial) el intento cae en **`reverso_fallido` ⇒ a soporte** | **❌** — exige `payment/info` en `REVERSED` (total) |

**Los rebotes fuera de ventana**, tipados y hablados: `fuera_de_ventana_otro_dia`
· `fuera_de_ventana_corte` · `fuera_de_ventana_24h` · `sin_fecha_de_cobro` ·
`intento_no_aprobado` · `ya_reversado` (idempotente, devuelve `ok:true`) ·
`proveedor_no_es_nuvei` / `proveedor_no_es_deuna` (fail-closed por riel).

**Qué sujetos mueve el trigger.** `trg_pagos_intentos_reverso_mueve_sujeto`
(existe y está `enabled='O'`, medido en `pg_trigger`) dispara sobre
`estado ∈ ('reversado','reverso_fallido')` y llama a `mover_sujeto_por_reverso`,
que resuelve **SIETE sujetos** por XOR de columnas:

`cita` · `compra` (→ además mueve el **pedido** y libera inventario) ·
`suscripcion` · `recurrencia` · `bono` · `mensualidad_guarderia` · `programa`.

El `ELSE` ciego murió: un sujeto sin rama devuelve
`sujeto_sin_rama_de_reverso` en vez de cancelar la cosa equivocada.

**Lo que corrió de verdad:**

```
select estado, count(*) from pagos_intentos group by estado;
-- aprobado 103 · pendiente 16 · rechazado 13 · reversado 6
select proveedor, count(*), max(cerrado_en) from pagos_intentos
where estado in ('reversado','reverso_fallido') group by proveedor;
-- nuvei 5 (último 2026-09-01) · deuna 1 (2026-08-25)
```

**6 reversos, todos `hallazgo='reversado_mismo_dia'`, los 6 con el sujeto movido
correctamente** (`payload_crudo ? 'sujeto_no_movido'` ⇒ `false` en los 6).
**`reverso_fallido` sigue con CERO filas** — su productor existe (`status_detail='34'`)
y nunca se disparó.

**Camino manual fuera de ventana:** ✅ **`solicitudes_devolucion`** es
exactamente eso, y su comentario lo dice: *«El registro legible para soporte de
una devolución que hay que ejecutar A MANO en el panel del proveedor. EL SISTEMA
REGISTRA, NO PROMETE.»* **Con 0 filas, 0 callers y sólo una policy de SELECT** —
o sea el camino está *nombrado* y no *transitable*.

### (c) El saldo e-PetPlace — **NO EXISTE**

```
select c.relname||'.'||a.attname, format_type(a.atttypid,a.atttypmod)
from pg_attribute a join pg_class c on c.oid=a.attrelid join pg_namespace n on n.oid=c.relnamespace
where n.nspname='public' and c.relkind='r' and a.attnum>0 and not a.attisdropped
  and a.attname ~* '(saldo|credito|monedero|wallet|balance)';
```

**Devuelve exactamente dos filas, y ninguna es de la familia:**

| columna | de quién |
|---|---|
| `cuentas_comerciales.saldo_arrastre` | **del prestador** — arrastre entre liquidaciones |
| `liquidaciones.saldo_arrastre_aplicado` | **del prestador** — ídem |

⇒ **No hay tabla de saldo, ni pasivo del ledger, ni columna de crédito a favor de
una familia. Ningún checkout lo consume porque no hay qué consumir.**
Concuerda con `D-926` (*«el motor de saldo no existe, y dos letras firmadas lo
daban por hecho»*).

> **Control positivo, con el saldo del hogar que SÍ existe:** el mismo tipo de
> consulta sobre `bonos` devuelve **25 filas** y las columnas
> `unidades_total` · `unidades_usadas` · `precio_por_unidad` · `familia_id` ·
> `fecha_vencimiento`.
> **El instrumento encuentra saldo cuando lo hay** — lo que pasa es que **el
> saldo del hogar está en UNIDADES DE SERVICIO, atado a un prestador y un
> `tipo_servicio`, jamás en plata.** *Un bono de paseos con Andrés no sirve para
> pagar una consulta en Aurora, y ése es el diseño, no una limitación.*

### (d) `D-888` — el reverso mismo-día: **su motor CERRÓ, sus tres casos siguen abiertos**

**Estado exacto, contra la ficha (`docs/DEUDAS_CANONICAS.md:21324`) y contra la base:**

| la ficha dice | medido hoy |
|---|---|
| dueño 🔴 ninguno → **enmendada 24-ago: dueño D** | — |
| disparo: *después de que el riel corra en QA* | ✅ **corrió**: 6 reversos reales, 5 Nuvei + 1 DeUna |
| ☠️ muerte: *un reverso corrió E2E dentro de la ventana de su riel* | ✅ **cumplido** |
| ☠️ muerte: *y `reverso_fallido` dejó de ser un estado sin productor* | 🔴 **NO cumplido** — 0 filas; el productor existe (`status_detail='34'`) y nunca se ejerció |
| «cero reversos de cualquier riel» (medición del 24-ago) | ❌ **vencida** — hoy son 6 |
| **los tres casos reales, $87,65** | 🔴 **LOS TRES SIGUEN `pendiente`** |

```
select proveedor_transaction_id, estado, monto, authorization_code from pagos_intentos
where proveedor_transaction_id in ('DF-2099041','DF-2099049','DF-2100043');
-- DF-2099041  pendiente  70.90  w9MeO3
-- DF-2099049  pendiente   6.00  4MBzFW
-- DF-2100043  pendiente  10.75  UacVQL
```

> **Veredicto: `D-888` está a MEDIO cerrar, y la mitad que falta es la que tiene
> plata adentro.** El motor se construyó y se ejerció; los tres pagos que
> justificaban construirlo **siguen ahí, quince días después**, y ya están
> **fuera de toda ventana de reverso de los dos rieles** ⇒ su única salida hoy es
> el camino manual, que es `solicitudes_devolucion`, que no tiene puerta.

### Un cero que conviene tener escrito

**14 intentos aprobados sin ningún sujeto** (`sujeto_indeterminado` si alguien
los reversara):

```
select proveedor, count(*) from pagos_intentos where estado='aprobado'
  and cita_id is null and compra_id is null and suscripcion_servicio_id is null
  and recurrencia_id is null and bono_id is null and guarderia_suscripcion_id is null
  and programa_contratado_id is null group by proveedor;
```

**Los 14 son sintéticos** — `seed_gate` (9), `simulado` (4), `siembra` (1).
**Cero con plata real.** *El instrumento sí distingue: los encontró y los
identificó por proveedor.*

---

## ③ LOS OBJETOS Y SU VERDAD

### Las máquinas de estado

| objeto | dónde vive la máquina | forma |
|---|---|---|
| **cita** | 🔴 **no hay tabla de transiciones** — sólo dos CHECK sobre `evento_cita_servicio` | `estado ∈ {pendiente, confirmada, en_curso, completada, cancelada, no_show, rechazada, no_realizable}` · `estado_reserva ∈ {pendiente_pago, pagada, expirada, cancelada}` |
| **estadía** | `cat_guarderia_estados` (7) + `cat_guarderia_transiciones` (**5 actos**) | dato, con `escritor`, `levanta_acta` y `tipo_notificacion` por transición |
| **pedido** | `cat_estados_pedido` (**24**) + `cat_transiciones_pedido` (**~50**) + `pedido_estados` (bitácora con `movido_por` y `movido_por_rol`) | dato, con `actor` y `exige_motivo` |

**El vocabulario real de la estadía** (el brief decía «`recoger`» — **no existe**;
el acto se llama **`a_bordo`**):

| orden | acto | desde → hasta | acta | aviso |
|---|---|---|---|---|
| 01 | `a_bordo` | `reservada → recogida_en_curso` | **recogida** | `guarderia_a_bordo` |
| 02 | `llegada` | `recogida_en_curso → en_guarderia` | — | `guarderia_llegada` |
| 03 | `retorno` | `en_guarderia → retorno_en_curso` | — | `guarderia_retorno` |
| 04 | `entregada` | `retorno_en_curso → entregada` | **devolucion** | `guarderia_entregada` |
| 05 | `no_recogida` | `reservada → no_recogida` | — | `guarderia_no_recogida` |

### Cómo se sabe HOY, desde el objeto, que el prestador no ejecutó

| pregunta | ¿se puede? | cómo, con su comando |
|---|---|---|
| **cita pasada sin cierre y sin `no_show`** | 🟢 **SÍ** | `where fecha < hoy and estado_reserva='pagada' and estado not in ('completada','no_show','cancelada','rechazada','no_realizable')` |
| **estadía sin recoger** | 🟢 **SÍ**, y con más precisión de la esperada | `guarderia_estadias.estado='no_recogida'` **+ `no_recogida_motivo`**, con vocabulario cerrado por CHECK |
| **pedido cancelado por el vendedor** | 🟢 **SÍ** | `pedidos.estado='cancelado_vendedor'` (estado propio, `activo=true`, con 4 transiciones que lo alcanzan y `exige_motivo=true` en todas) |
| **pedido no entregado en su ventana** | 🟢 **SÍ** | `envios.promesa_entrega_hasta < now() and entregado_en is null` |
| 🔴 **cancelación del prestador (de una cita)** | 🔴 **NO SE PUEDE SABER** | ver abajo |

### 🔴 LA CITA NO GUARDA QUIÉN LA CANCELÓ NI POR QUÉ

```
select coalesce(motivo,'(null)'), count(*) from evento_cita_servicio
where estado='cancelada' group by 1;                      -- (null) 26
select count(*) from evento_cita_servicio
where estado='cancelada' and metadata ? 'cancelado_por';  -- 0
```

**26 citas canceladas · `motivo` NULL en las 26 · cero con `cancelado_por` en
metadata.** Y las funciones que cancelan una cita lo confirman por su firma:

| función | argumentos |
|---|---|
| `cancelar_cita_suelta` | `p_cita_id uuid` — **y nada más** |
| `cancelar_reserva_paquete` | `p_cita_id uuid` |
| `cancelar_teleconsulta` | `p_cita_id uuid` |
| `cancelar_mensualidad_guarderia` | `p_suscripcion_id uuid` |
| **`cancelar_pedido_despensa`** | **`p_pedido_id, p_actor text, p_motivo text`** ← el único que pregunta |

> ### **El pedido sabe quién lo canceló y por qué; la cita no lo sabe y ni siquiera lo pregunta.**
>
> *Y no es un hueco de dato: es un hueco de firma.* Una función que no recibe el
> actor no puede guardarlo aunque alguien agregue la columna — **el primer paso
> de cualquier postventa sobre citas es ensanchar esas tres firmas**, y eso toca
> a todos sus llamadores.

### La evidencia que guarda cada objeto

| objeto | evidencia | dónde |
|---|---|---|
| **cita de paseo** | 🟢 track GPS + estado del GPS + motivo de fallo | `eventos_mascota_paseo.track_gps` (jsonb) · `gps_estado` · `gps_motivo_fallo` |
| **atención (paseo/grooming/adiestr.)** | 🟢 parte + mensaje a la familia + tiempos | `evento_atencion` (`iniciada_en`, `terminada_en`, `cerrada_en`, `mensaje_familia`, `estado`) — **39 filas: 38 `cerrada_con_calidad`, 1 `terminada`** |
| **grooming** | 🟢 fotos + notas + estados de pelaje | `evento_grooming_archivos` · `evento_grooming_notas` · `evento_grooming_estados_pelaje` |
| **adiestramiento** | 🟢 clips + notas | `evento_adiestramiento_clips` · `evento_adiestramiento_notas` |
| **estadía** | 🟢 **la más completa**: actos con doble reloj + actas con firma + media etiquetada | `guarderia_estadia_actos` (`ocurrido_en` = la puerta, `registrado_en` = el servidor; **append-only**) · `guarderia_actas` (13 col.: `conformidad`, `carnet_verificado`, `objetos`, `direccion`, `levantada_por`, `clave_idempotencia`) · `guarderia_media` |
| **pedido** | 🟢 bitácora de estados + foto de entrega + quién recibió | `pedido_estados` (`movido_por`, `movido_por_rol`, `motivo`) · `envios.foto_entrega_path` · `entregado_por_nombre` · `entregado_por_documento` · `intentos_entrega` |
| **cita clínica** | 🟢 caso + nota clínica + papeles | `caso_clinico` · nota sedimentada · `evento_archivo_adjunto` |
| 🔴 **cancelación de cita** | **NINGUNA** | ni actor, ni motivo, ni traza |

### Los datos vivos — medidos hoy, 2026-09-07

**132 citas pasadas y pagadas SIN CIERRE.** Contra **51 completadas** en toda la
historia ⇒ **el 72 % de lo que se cobró y ya ocurrió nunca se cerró.**

```
select c.estado, count(*) from evento_cita_servicio c
where c.fecha < (now() at time zone 'America/Guayaquil')::date
  and c.estado_reserva='pagada'
  and c.estado not in ('completada','no_show','cancelada','rechazada','no_realizable')
group by 1;   -- confirmada 131 · en_curso 1
```

**Por prestador:**

| prestador | sin cerrar | desde .. hasta |
|---|---|---|
| **Paseos Andres** | **73** | 2026-07-11 .. 2026-09-04 |
| **Clínica Aurora** | **55** | 2026-07-18 .. 2026-09-05 |
| Clínica Los Shyris | 3 | 2026-07-31 .. 2026-08-03 |
| Satori Latam sas | 1 | 2026-09-01 |

**Por oficio:** paseo 55 · **guardería (día) 25** · telemedicina 14 ·
adiestramiento 12 · consulta general 8 · grooming 8 · grooming completo 7 ·
vacunación 3.

> **Control positivo:** `select estado, count(*) from evento_cita_servicio group by 1`
> ⇒ confirmada 263 · completada **51** · pendiente 50 · cancelada 26 · en_curso 1
> · no_show 1. **El instrumento encuentra citas cerradas cuando las hay** — hay
> 51, y son todas de julio y agosto.

**Estadías:**

```
select e.estado, count(*) from guarderia_estadias e
join evento_cita_servicio c on c.id=e.cita_id
where c.fecha < (now() at time zone 'America/Guayaquil')::date
  and e.estado not in ('entregada','cancelada','no_recogida') group by 1;
-- reservada 17 · retorno_en_curso 4
```

**21 estadías pasadas y abiertas.** Del total (96): `reservada` 86 ·
`no_recogida` 5 · `retorno_en_curso` 4 · **`entregada` 1**.
**Actos registrados:** `a_bordo` 5 · `llegada` 5 · `retorno` 5 ·
`no_recogida` 5 · **`entregada` 1**.

**Los 5 `no_recogida`, con su motivo — y acá está el hueco:**

| motivo | n |
|---|---|
| `familia_cancelo_en_puerta` | 3 |
| `animal_no_entregado` | 1 |
| `nadie_en_domicilio` | 1 |

`CHECK (no_recogida_motivo ∈ {nadie_en_domicilio, animal_no_entregado, familia_cancelo_en_puerta, otro})`

> 🔴 **Los cuatro motivos culpan a la familia.** No hay uno que diga *«el
> prestador no fue a buscarlo»*. Con este vocabulario, **una estadía en la que el
> prestador nunca apareció se registra como `otro` o no se registra**, y el
> objeto no puede distinguir quién falló. *Un vocabulario cerrado que sólo tiene
> palabras para una de las dos partes no es neutral: decide.*

**Pedidos:**

| estado | n | lectura |
|---|---|---|
| `cancelado_cliente` | 28 | |
| `cancelado_sistema` | 27 | |
| **`pago_capturado`** | **25** | **pagado y nunca liberado a preparación** |
| `liberado_preparacion` | 8 | |
| `documentado` | 3 | |
| `entregado` | 3 | |
| `en_reparto` | 1 | |
| `hacia_destino` | 1 | |
| **`cancelado_vendedor`** | **0** | el estado existe y nunca se usó |
| **`entrega_fallida`** | **0** | ídem |

**Envíos fuera de ventana: 2** (de 3 con promesa, de 5 en total). El más viejo
prometía entrega el **2026-08-13 18:00 UTC** y sigue sin `entregado_en`.

### Lo que este bloque NO se puede saber hoy

1. 🔴 **Quién canceló una cita, y por qué** — ni columna, ni argumento, ni traza.
2. 🔴 **Si el prestador incumplió una estadía** — el vocabulario de
   `no_recogida_motivo` no tiene esa palabra.
3. 🟠 **Si una cita `confirmada` y pasada no se ejecutó o sólo no se cerró** —
   son indistinguibles desde el objeto. *Las 132 pueden ser 132 incumplimientos o
   132 servicios prestados sin cerrar la app, y nada en la base separa una cosa
   de la otra.*
4. 🟠 **Cuánto de esas 132 es dato de prueba** — `evento_cita_servicio` **no
   tiene `creado_por_sistema`** (la marca que S113 puso en `mascotas`), así que
   no hay forma limpia de separar seed de real.
5. ⚪ Una fila de `cat_transiciones_pedido` tiene `desde` o `hasta` en **NULL**
   con `actor='sistema'` — una transición sin origen o sin destino. No se
   investigó su origen.

---

## ④ EL HILO

### Qué es hoy

**`packages/mensajeria` es DOMINIO PURO — 632 líneas, siete archivos, sin
Supabase, sin React, sin i18n.** Su propio encabezado lo dice:

> *«El canal cuelga de la SOLICITUD, no de la cita ni del usuario suelto.»*

| módulo | líneas | qué aporta |
|---|---|---|
| `solicitud.ts` | 106 | 4 estados · 7 transiciones como dato · `puedeEscribirEnHilo` |
| `avisos.ts` | 139 | `avisosDe(hecho)` |
| `cola.ts` | 131 | reintentos, `MAX_INTENTOS`, `proximoAEnviar` |
| `silencio.ts` | 67 | días sin respuesta del publicador |
| `padrinazgo.ts` | 64 | reglas de fin |
| `privacidad.ts` | 62 | `camposVisibles(actor)` |

**Es específico de adopción, no genérico**, y lo dice el tipo:

```ts
export type RolEnHilo = 'publicador' | 'solicitante';
export type EstadoSolicitud = 'recibida' | 'en_conversacion' | 'aceptada' | 'declinada';
```

### La persistencia

| pieza | forma |
|---|---|
| `adopcion_mensaje` | `id · solicitud_id **NOT NULL** · autor_user_id · cuerpo · automatica · creado_en` — **9 filas** |
| `adopcion_lectura` | `solicitud_id · user_id · leido_hasta` — **el no-leído es un cursor por persona, no un flag por mensaje** |
| RPCs | `crear_solicitud_adopcion` · `responder_solicitud_adopcion` · `_hilo_mensajes` · `marcar_hilo_leido` · `obtener_mis_solicitudes_adopcion` · `cerrar_solicitud_adopcion` · `desistir_solicitud_adopcion` |

### Asientos: **DOS, y están cableados en la policy**

```sql
-- adopcion_mensaje_select (SELECT)
EXISTS (SELECT 1 FROM adopcion_solicitud s
        WHERE s.id = adopcion_mensaje.solicitud_id
          AND (s.solicitante_user_id = auth.uid()
               OR _user_publico_esta_publicacion(s.publicacion_id, auth.uid())
               OR is_admin()))
```

**Dos asientos nombrados** (el solicitante y quien publicó) **más admin como
puerta de servicio.** No hay tabla de participantes: *los dos asientos son dos
columnas de otra tabla.*

### Realtime · no leídos · borrador

| capacidad | estado | evidencia |
|---|---|---|
| **realtime** | 🟢 **SÍ** | `adopcion_mensaje` y `adopcion_lectura` están en la publicación `supabase_realtime` (`pg_publication_rel`) |
| **no leídos** | 🟢 **SÍ**, por cursor | `adopcion_lectura.leido_hasta` + `marcar_hilo_leido` |
| **borrador** | 🔴 **NO** | la única tabla con «borrador» en el nombre es `nota_clinica_borrador`, que es otra cosa |

### El costo de un hilo de TRES asientos colgado de cita / estadía / pedido

**No lo construyo. Lo mido.**

| pieza | qué hay que hacer | por qué |
|---|---|---|
| **el ancla** | 🔴 **lo más caro.** `adopcion_mensaje.solicitud_id` es **NOT NULL con FK a `adopcion_solicitud`**. Un hilo genérico necesita `(sujeto_tipo, sujeto_id)` o una tabla `hilos` propia | *La estructura actual hace inexpresable un hilo que no sea de adopción — eso es una virtud del diseño, y también lo que hay que pagar para ensancharlo* |
| **los asientos** | 🔴 **la policy no escala.** Hoy los dos asientos son dos columnas de `adopcion_solicitud`; tres asientos con uno de ellos «la casa» exige **tabla de participantes** con su RLS | *Agregar un tercer `OR` a la policy es el camino corto y el que se cobra tres arcos después: con 4 sujetos × 3 roles son 12 ramas en un `EXISTS`* |
| **el dominio** | 🟠 **`RolEnHilo` es un tipo cerrado de dos valores** — ensancharlo toca `solicitud.ts` y `privacidad.ts` (que decide `camposVisibles` por actor) | La máquina de estados de adopción **no sirve** para un reclamo: sus 4 estados son de adopción |
| **realtime** | 🟢 **gratis** — la publicación ya está y una tabla nueva se agrega con una línea | |
| **no leídos** | 🟢 **el patrón ya existe** y es correcto: cursor `leido_hasta` por `(hilo, user)` — se copia, no se inventa | |
| **borrador** | 🟠 **hay que construirlo** — no existe en ninguna forma | |
| **la voz** | 🟢 `avisos.ts` ya modela `IntencionAviso` / `AudienciaAviso` / `HechoDelVertical` — se ensancha con hechos nuevos | |

> **Lectura honesta del costo: la mitad barata está hecha y la mitad cara no.**
> El transporte (realtime), la cola con reintentos, el cursor de no-leídos y la
> forma de los avisos **se reusan tal cual**. Lo que hay que construir es **el
> ancla polimórfica y la tabla de participantes** — y eso *no es ensanchar
> `packages/mensajeria`: es un objeto `hilo` nuevo al lado, con el paquete
> existente como su vocabulario.*

---

## ⑤ LOS AVISOS

**Catálogo total: 70 tipos** (`select count(*) from cat_notificacion_tipos`).

### Los que hablan de pagos, reversos y cancelaciones — con productor y contador

```sql
-- productor = una función viva cuyo cuerpo nombra el código literal
select t.codigo, (select string_agg(p.proname,', ') from pg_proc p
   join pg_namespace n on n.oid=p.pronamespace
   where n.nspname='public' and pg_get_functiondef(p.oid) like '%'''||t.codigo||'''%'
     and p.proname not like '\_voz%' and p.proname <> 'obtener_avisos_del_hogar')
from cat_notificacion_tipos t where t.codigo ~* '(pago|cobro|revers|…)';
```

| tipo | categoría · audiencia | sombra | **productor vivo** | intenciones |
|---|---|---|---|---|
| `pago_confirmado` | operacion · cliente | no | ✅ `aplicar_evento_de_pago`, `resolver_consulta_activa`, `cobrar_periodo_mensualidad_guarderia` | **91** |
| **`pago_reversado`** | **operacion · ambas** | no | ✅ `mover_sujeto_por_reverso`, `obtener_cita_resuelta` | **1** |
| `programa_vencido_reembolso` | saldo_pagado · cliente | no | ✅ `vencer_programas_adiestramiento` | 4 |
| `plan_renovacion_fallida` | saldo_pagado · cliente | no | ✅ `cerrar_y_renovar_planes` | 2 |
| `plan_vencido_reembolso` | saldo_pagado · cliente | no | ✅ `cerrar_y_renovar_planes` | 2 |
| `documento_rechazado` | operacion · prestador | no | ✅ `revisar_documento_prestador` + trigger | 2 |
| `alta_asistida_vencida_soporte` | operacion · prestador | **sí** | ✅ `cleanup_pendientes_vencidos` | 2 |
| `guarderia_no_recogida` | operacion · cliente | no | ✅ **por dato** (ver nota) | 2 |
| `guarderia_entregada` | relacional · cliente | no | ✅ **por dato** | 1 |
| `pedido_entregado` | operacion · cliente | no | ✅ `_trg_pedido_avisa_familia` | 1 |
| **`pedido_entrega_fallida`** | operacion · cliente | no | ✅ `_trg_pedido_avisa_familia` | **0** |
| **`cita_cancelada_cliente`** | operacion · prestador | no | ✅ `cancelar_cita_suelta` | **0** |
| `prestador_rechazado` | operacion · prestador | **sí** | ✅ trigger | 0 |
| `solicitud_mostrador_expirada` | operacion · prestador | no | ✅ `barrer_solicitudes_expiradas` | 0 |
| 🔴 **`devolucion_estado`** | **operacion · cliente** | **sí** | 🔴 **SIN PRODUCTOR** | **0** |
| 🔴 `cita_rechazada` | operacion · cliente | sí | 🔴 **SIN PRODUCTOR** | 0 |
| 🔴 `vacuna_vencida` | salud_seguridad · ambas | sí | 🔴 **SIN PRODUCTOR** | 0 |

> ### 🔴 `pago_reversado` tiene contador **1** — y hubo **6** reversos.
> El tipo existe, tiene productor, y **emitió una sola vez sobre seis eventos que
> debieron emitirlo**. No investigué por qué; queda como medición, no como
> diagnóstico.

> ### 🔴 `devolucion_estado` — el aviso de la devolución existe, está en sombra, y **nada lo produce**.
> Es la contracara exacta del §1: la tabla `solicitudes_devolucion` no tiene
> puerta de entrada, y su aviso no tiene productor. *Las dos mitades del mismo
> camino faltan, y cada una por su lado se ve como un pendiente chico.*

### ⚠️ EL CIEGO DE MI PROPIO INSTRUMENTO, DECLARADO

**Mi censo mide productores por LITERAL en el cuerpo de una función, y eso no ve
a los que emiten POR DATO.** `guarderia_entregada` y `guarderia_no_recogida`
salieron marcados «SIN PRODUCTOR» **y tienen intenciones reales**. La causa,
verificada:

```
select p.proname from pg_proc p ... where pg_get_functiondef(p.oid) like '%cat_guarderia_transiciones%';
-- _guarderia_aplicar_acto · obtener_maquina_estadia_guarderia
```

`_guarderia_aplicar_acto` lee **`cat_guarderia_transiciones.tipo_notificacion`** y
emite lo que el catálogo diga. **Su productor es una fila, no una línea.**

> *Un censo por literal acota; no cierra.* Los tres que quedan marcados sin
> productor (`devolucion_estado`, `cita_rechazada`, `vacuna_vencida`) **no
> aparecen en ningún catálogo de transiciones**, así que su cero se sostiene —
> pero se sostiene por eso, no por el censo.

### Consentimiento por canal

| medición | valor | comando |
|---|---|---|
| `user_notificacion_prefs` | **16 filas** | `select count(*) from user_notificacion_prefs` |
| `consentimientos` | **es de documentos legales, no de canales** — `tipo · version · documento_sha256 · aceptado · ip_hash · cita_id` | `pg_attribute` |
| intenciones totales | **410**, última **2026-09-07 20:30 UTC** | `select count(*), max(created_at) from notificacion_intencion` |

**Nota honesta:** el contrato de la casa es *«fila ausente = habilitada»* (S54-B4),
así que **16 filas no son 16 habilitaciones: son 16 personas que tocaron la
perilla.** No medí cuántas de esas 16 son `false`.

### `transporte_vivo` por canal, HOY

```
select codigo, transporte_vivo, es_piso, exige_evidencia, orden from cat_notificacion_canales;
```

| canal | `transporte_vivo` | `es_piso` | `exige_evidencia` | orden |
|---|---|---|---|---|
| `in_app` | 🟢 **true** | **true** | false | 1 |
| `push` | 🟢 **true** | false | false | 2 |
| `email` | 🟢 **true** | false | false | 3 |
| **`whatsapp`** | 🔴 **false** | false | **true** | 4 |

**WhatsApp es el único canal apagado, y el único que exige evidencia.**

---

## ⑥ WHATSAPP — medido contra el objeto, y **el canon está vencido**

### (a) La edge

`supabase/functions/despachar-whatsapp/index.ts` — **439 líneas**.
Desplegada: **`despachar-whatsapp` v38, ACTIVE, `verify_jwt:false`** (guard por
`x-despacho-secret`, patrón `D-713`).

**Modo sombra, textual del encabezado:**
> *«Sin credencial corre ENTERO, reporta `habria_entregado` y NO MANDA NADA. **No
> marca filas en modo sombra.**»*

**Contadores medidos, corriendo `?verificar=1` con el secreto del llavero:**

| contador | valor |
|---|---|
| `habria_entregado` | **0** |
| `encoladas` | **0** |
| `sin_telefono` | **0** |
| `telefono_no_e164` | **0** |

> **Los cuatro ceros son legítimos y tienen su explicación en el propio código:**
> la cola se filtra por `estado='encolada' AND resuelto_como->>'canal_elegido' = 'whatsapp'`,
> y con `transporte_vivo=false` **el resolvedor nunca elige WhatsApp** ⇒ nada se
> encola para ese canal. *No es que el despachador no encuentre: es que no hay.*
> **Control positivo:** la misma tabla tiene **410 intenciones** en total.

### (b) 🟢 EL TOKEN YA NO ES EL QUE EL CANON DESCRIBE — **es válido, completo y con los dos permisos**

**El canon dice** (bloque S91): *«la credencial NO es un token de Meta (largo 23,
sin `EAA`, sin comillas ni salto ⇒ no está truncada, es otra cosa)»*.

**Medido hoy, 2026-09-07 15:40 Guayaquil, corriendo el modo verificar contra la
edge desplegada:**

```
curl -s -X POST "https://zyltipqscdsdsxnjclhp.supabase.co/functions/v1/despachar-whatsapp?verificar=1" \
  -H "x-despacho-secret: $(security find-generic-password -s epetplace-despacho-secret -w)" \
  -H "Content-Type: application/json" -d '{}'
```

| forma del token (**metadatos, jamás el valor**) | |
|---|---|
| `largo` | **196** *(el canon decía 23)* |
| `empieza_con_EAA` | 🟢 **true** *(el canon decía false)* |
| `tiene_espacios` / `tiene_comillas` / `tiene_salto` | false / false / false |
| `parece_un_id_numerico` | false |

| | |
|---|---|
| `token_valido` | 🟢 **true** |
| `whatsapp_business_messaging` (enviar) | 🟢 **true** |
| `whatsapp_business_management` (leer) | 🟢 **true** |
| `permisos_completos` | 🟢 **true** |
| `http_debug_token` / `http_plantillas` / `http_numero` | **200 / 200 / 200** |

> **La fecha lo confirma:** los tres secrets se cargaron el **25-ago-2026**
> (`META_WHATSAPP_TOKEN` 03:34, `META_WABA_ID` 03:48, `META_PHONE_NUMBER_ID`
> 03:48 — leído de `supabase secrets list`, que devuelve **digest**, jamás el
> valor). **El founder ya lo recargó, y el canon quedó atrás.**

### 🟢 LAS 8 PLANTILLAS — la lista exacta, medida en Meta

**`plantillas_total: 8` · `plantillas_aprobadas: 8` · `plantillas_en_marketing: 0`
· `plantillas_en_utility: 8`**

| # | nombre | idioma | **categoría** | estado | vars |
|---|---|---|---|---|---|
| 1 | `pedido_confirmado` | `es` | **UTILITY** | ✅ APPROVED | 5 |
| 2 | `entrega_proxima` | `es` | **UTILITY** | ✅ APPROVED | 3 |
| 3 | `pedido_no_se_pudo_entregar` | `es` | **UTILITY** | ✅ APPROVED | 3 |
| 4 | `plan_renovacion_fallida_u` | `es` | **UTILITY** | ✅ APPROVED | 3 |
| 5 | `plan_renovado_v` | `es` | **UTILITY** | ✅ APPROVED | 4 |
| 6 | `cita_recordatorio_hoy_v` | `es` | **UTILITY** | ✅ APPROVED | 4 |
| 7 | `cita_recordatorio_manana_v` | `es` | **UTILITY** | ✅ APPROVED | 4 |
| 8 | `cita_confirmada_v` | `es` | **UTILITY** | ✅ APPROVED | 4 |

> ### 🟢 **La re-categorización MARKETING→UTILITY que el canon marca como crítica YA NO APLICA: cero plantillas en MARKETING.**
> El canon la describe como *«crítica — un número pausado se recupera por
> APELACIÓN, no por corrección»*. **Medido: las ocho ya están en UTILITY y
> aprobadas.** *Esa deuda está pagada y el canon no se enteró.*
>
> **Nada para corregir en la consola por categoría.** Lo que sí hay que mirar
> está abajo.

### 🔴 Lo que el modo verificar SÍ encontró mal

```json
"numero": { "verified_name": "E-PetPlace",
            "display_phone_number": "+593 98 733 0099",
            "code_verification_status": "EXPIRED",
            "quality_rating": "UNKNOWN",
            "platform_type": "CLOUD_API" }
```

| hallazgo | qué significa |
|---|---|
| 🔴 **`code_verification_status: EXPIRED`** | **el código de verificación del número venció.** Es una acción del founder en la consola de Meta, y **no la cubre ninguna plantilla ni ningún permiso** |
| ⚠️ `quality_rating: UNKNOWN` | esperable — el número nunca envió nada |
| ⚠️ **`waba_alcanzables: []` · `waba_configurado_alcanzable: false`** | **NO CONCLUYENTE, y lo declaro como tal** — el propio comentario del código dice que esto sale de `granular_scopes` de `/debug_token`. **Pero `http_plantillas` dio 200 y devolvió las 8 plantillas de ese WABA**, o sea el token SÍ lo alcanza. *Dos lecturas del mismo objeto no coinciden; la que se apoya en un resultado real (200 + 8 plantillas) gana sobre la que se apoya en un campo de metadatos que puede venir vacío para este tipo de token.* **No es un hallazgo: es un ciego del diagnóstico.** |

### (c) `§11bis` de `MODELO_FINANCIERO` — su fecha y qué de ahí sigue vigente

**`docs/MODELO_FINANCIERO.md:1135` — sección escrita en S91, 8-ago-2026.**

| # | lo que dice §11bis | estado hoy |
|---|---|---|
| ① | **Meta empieza a cobrar los mensajes `utility` desde el 1-oct-2026** | 🟢 **vigente** — quedan **~3 semanas** de gracia |
| ② | **Ecuador cuesta ~17× lo que cuesta Colombia por mensaje** | 🟢 **vigente**, y es el número que cambia decisiones |
| ③ | *«Las 6 plantillas están categorizadas MARKETING y deben ser UTILITY»* | 🔴 **VENCIDO** — hoy son **8, todas UTILITY, todas aprobadas** |

**El costo por mensaje en EC: NULL.** §11bis **no publica una cifra a propósito**,
y lo dice con todas las letras:

> *«**Ningún número de gasto proyectado.** Falta el volumen —cuántos avisos por
> familia por mes— y ese dato no existe todavía: el canal nunca corrió. Estimar
> un gasto sobre un volumen inventado es exactamente el tipo de número que este
> modelo existe para no tener.»*

⇒ **Lo único cuantificado es la RELACIÓN (~17× Colombia), no el precio absoluto.**
*No lo completo con una tarifa de internet: sería exactamente el número que esa
sección existe para no tener.*

---

## ⑦ LAS DEUDAS DE S113 QUE ESTE ARCO CRUZA — **estado, no cura**

### (a) Los sitios que hablan en presente de una mascota en memorial

`pnpm verify:habla-en-presente` ⇒ **🔴 8 sitios fuera del guard** (la salida
aclara: *«2 repetidos del mismo sitio, no se cuentan»*; **el canon de S113 dice
11** — el número bajó o el contador cambió, no lo investigué).

**Los 8 viven todos en el mismo archivo:**
`apps/cliente/src/app/(tabs)/hogar/mascota/[mascotaId].tsx`

| línea | símbolo | qué dice el gate |
|---|---|---|
| 989 | `edadMeses` | la edad viajando a una pieza que la va a mostrar |
| 1074 | `pesoVigente` | dice cuánto pesa — un peso vigente de quien no está |
| 1088 | `pesoVigente` | ídem |
| 1089 | `pesoVigente` | ídem |
| 1090 | `pesoVigente` | ídem |
| 1092 | `pesoVigente` | ídem |
| **1411** | `vozEdad` | **dice la edad en presente («~11 años»)** |
| 1439 | `pesoVigente` | ídem |

Y el propio gate explica por qué sobrevivieron:
> *«Ninguno de éstos le PIDE nada —su hermano está verde— y por eso sobrevivieron:
> un dato en presente sobre alguien que no está no dispara ninguna regla de
> acción y se lee perfectamente normal.»*

### (b) Los tipos de evento de la línea de vida sin voz

`pnpm verify:tipos-vivos-vs-diccionario` ⇒ **🔴 7 tipos · 130 eventos · 20 % del
expediente** *(el canon de S113 decía 128 — subieron 2)*.

| tipo | eventos | eje |
|---|---|---|
| `hito_narrativo` | **87** | identidad |
| `foto_guarderia` | 15 | cuidado_externo |
| `bitacora_familia` | 10 | identidad |
| 🔴 **`fin_vida`** | **8** | identidad |
| `observacion_comportamiento` | 7 | comportamiento |
| `producto_asignacion` | 2 | alimentacion |
| **`transferencia_familia`** | **1** | identidad |

**Y el gate distingue tres cosas que no son lo mismo:** *voz propia* (6 tipos ·
94 ev.) · **comparten voz con todo su eje** (7 tipos · 35 ev. — `peso_medicion`,
`medicacion_prescrita`, `examen_diagnostico`…, «no es rojo, y es por qué cosas
distintas se leen igual en el timeline») · *ausente a propósito* (1 tipo · 377 ev.).

> **Los dos que cruzan este arco son `fin_vida` (8) y `transferencia_familia` (1)**
> — la muerte y el traspaso, los dos hechos donde la postventa toca lo más
> delicado, **dibujados con una voz genérica**.

### (c) Los resultados de búsqueda de tipo `papel` sin juicio

**✅ CERRADO**, y verificado corriendo su gate:

```
pnpm verify:papel-sin-valores
⇒ brazo de 692 chars · 0 proyección(es) prohibida(s)
✅ el brazo indexa analitos para ENCONTRAR y no proyecta ningún valor
```

`docs/loop/S113-A-CIERRE-DE-SESION.md:62` lo declara cerrado y **se volvió
inexpresable, no sólo corregido**. *«Hematocrito» y «Ehrlichia» encuentran el
papel sin revelar el resultado; «41» y «negativo» no traen nada.*

---

## ⑧ QUÉ REUSAR Y QUÉ NO

| pieza | existe | veredicto | por qué |
|---|---|---|---|
| **`aplicar_reembolso()`** | 🟢 | 🟡 **sirve con cura** | Correcta y completa (total, parcial, arrastre a liquidación). **Le falta insumo (§⓪) y le falta una decisión: hoy devuelve la comisión entera y nadie firmó eso.** |
| **Reverso Nuvei / DeUna + trigger de sujeto** | 🟢 | 🟢 **sirve tal cual** | Ejercido 6 veces, 7 sujetos, ventanas correctas por riel, rebotes tipados, idempotente. **Es la pieza más madura de todo el arco.** |
| **`solicitudes_devolucion`** | 🟢 tabla | 🟡 **sirve con cura** | Su idea es la correcta (*«el sistema registra, no promete»*). **Le falta puerta de INSERT y le sobra el ancla: `cita_id NOT NULL` la deja inútil para estadía, bono y pedido.** |
| **`devoluciones` + `Logistica.tsx` del admin** | 🟢 **y con pantalla** | 🟢 **sirve tal cual, para despensa** | Flujo completo y vivo (commit de anoche). **No se reescribe: se conecta.** Su límite es `pedido_id`. |
| **`credito_tienda` como método de reembolso** | 🟠 sólo como opción de UI | 🔴 **no sirve** | **No hay motor de saldo** (`D-926`). Ofrecerlo es prometer algo que ninguna tabla puede cumplir. |
| **`tickets_soporte` / `ticket_mensajes`** | 🟢 tablas | 🔴 **no sirven** | 0 filas · 0 callers · 0 pantallas · su comentario promete un SLA («<2 h primera respuesta») que nada mide. **Cascarón heredado.** |
| **`packages/mensajeria` (dominio)** | 🟢 | 🟡 **sirve con cura** | Cola, silencio, avisos y privacidad se reusan. **`RolEnHilo` (2 valores) y la máquina de 4 estados son de adopción y no sirven para un reclamo.** |
| **`adopcion_mensaje` + `adopcion_lectura` (persistencia)** | 🟢 | 🟡 **el PATRÓN sirve, la TABLA no** | El cursor `leido_hasta` y el realtime se copian. **`solicitud_id NOT NULL` con FK a adopción hace inexpresable cualquier otro hilo.** |
| **`notificacion_intencion` + canales + techos** | 🟢 | 🟢 **sirve tal cual** | 410 intenciones, 4 canales con `transporte_vivo` por canal, categorías con techo. |
| **`despachar-whatsapp` + modo sombra + `?verificar=1`** | 🟢 | 🟢 **sirve tal cual** | Desplegada, con guard, con diagnóstico que no manda nada. **Y su token ya es válido con los dos permisos.** |
| **Las 8 plantillas de Meta** | 🟢 | 🟢 **sirven tal cual** | Todas UTILITY, todas aprobadas. **3 son de pedido, 3 de cita, 2 de plan — ninguna de postventa.** |
| **Máquina de estados del PEDIDO** | 🟢 | 🟢 **sirve tal cual, y es el modelo a copiar** | 24 estados · ~50 transiciones como dato · `actor` · `exige_motivo` · bitácora con `movido_por_rol`. **Es lo que la cita no tiene.** |
| **Máquina de la ESTADÍA + actas + actos** | 🟢 | 🟢 **sirve tal cual** | Doble reloj, append-only, actas con firma, media etiquetada. **La evidencia más fuerte del producto.** |
| **`no_recogida_motivo`** | 🟢 vocabulario | 🟡 **sirve con cura** | **Los 4 motivos culpan a la familia.** Falta la palabra para el incumplimiento del prestador. |
| **Cancelación de cita (`cancelar_cita_suelta` y hermanas)** | 🟢 | 🔴 **no sirve** | **No recibe actor ni motivo.** No es un dato faltante: es una firma que hay que ensanchar en 3 funciones y todos sus llamadores. |
| **`en_disputa` (estado de `eventos_economicos`)** | 🟢 vocabulario | 🔴 **no sirve todavía** | `aplicar_reembolso` lo respeta y **nada lo produce**. Cajón con etiqueta y sin fondo. |
| **`chat-ayuda`** | 🟠 fuente con `RESCATE.md` | 🔴 **no sirve** | **No está desplegada** (medido contra `functions list`). Borrada en S92-BIS por `D-717`. |
| **`caso_clinico`** | 🟢 | 🟢 **sirve, pero es otra cosa** | Es el caso **clínico**, no un caso de soporte. Reusar su nombre para postventa sería trasplantar un criterio correcto a otra pregunta (`D-976`). |

---

## ⑨ LO QUE NO SE PUDO MEDIR, Y POR QUÉ

| # | qué | por qué |
|---|---|---|
| 1 | 🔴 **Quién canceló una cita y por qué** | **No existe el dato ni el argumento.** 26 canceladas, `motivo` NULL en las 26, cero `metadata->cancelado_por`, y las tres funciones que cancelan reciben sólo `p_cita_id`. |
| 2 | 🔴 **Si el prestador incumplió una estadía** | El CHECK de `no_recogida_motivo` no tiene esa palabra. Sólo se puede saber que la estadía no ocurrió, no de quién fue la falta. |
| 3 | 🟠 **Si las 132 citas sin cierre son incumplimiento o sólo falta de cierre** | Indistinguibles desde el objeto. Habría que preguntarle al prestador. |
| 4 | 🟠 **Cuánto de esas 132 es dato de prueba** | `evento_cita_servicio` **no tiene `creado_por_sistema`** (la marca que S113 puso en `mascotas`). Los prestadores son `Paseos Andres`, `Clínica Aurora`, `Clínica Los Shyris` y `Satori Latam sas` — con nombre de demo, pero **eso es una impresión, no una medición**. |
| 5 | 🟠 **Por qué `pago_reversado` emitió 1 vez sobre 6 reversos** | Medido el número; no seguí la cadena. Sería medir `resuelto_como` de esas intenciones y las condiciones del emisor. |
| 6 | 🟠 **`waba_configurado_alcanzable: false` con `http_plantillas: 200`** | Dos lecturas del mismo objeto que no coinciden. **Declaro el ciego en vez de elegir una** — la que se apoya en un 200 con 8 plantillas es la que tiene evidencia. |
| 7 | 🟠 **El costo real por mensaje de WhatsApp en EC** | §11bis **no lo publica a propósito**. Sólo hay la relación ~17× Colombia. **No lo completo con una tarifa de internet.** |
| 8 | 🟠 **Cuántas de las 16 filas de `user_notificacion_prefs` son `false`** | Medí las filas, no su valor. Con el contrato «ausente = habilitada», 16 filas no son 16 habilitaciones. |
| 9 | ⚪ **La fila de `cat_transiciones_pedido` con `desde` o `hasta` NULL** | La encontré (`actor='sistema'`) y no la investigué. |
| 10 | ⚪ **El productor de los avisos emitidos por DATO** | Mi censo mide por literal y por eso marcó tres tipos «sin productor» que sí lo tienen (§5). **Los tres que quedan rojos se sostienen porque no están en ningún catálogo de transiciones — pero por eso, no por el censo.** |
| 11 | ⚪ **Si el admin legado puede ESCRIBIR `devoluciones` bajo la RLS real** | Medí que la tabla tiene RLS con 4 policies y que el código hace `insert`/`update`. **No ejercí el camino con una sesión real** — sería escribir, y esta pista no escribe. |
| 12 | ⚪ **Nada en aparato** | Relevamiento de solo lectura contra la base y el código. **Ninguna pantalla se abrió en un teléfono.** |

---

*Pista A · S114 · relevamiento cerrado el 2026-09-07 a las 15:48 Guayaquil, sobre
`main` en `e516a089`, con `origin/main` en el mismo commit.*
