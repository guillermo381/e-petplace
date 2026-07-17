# Bloque 0 fino del motor — relevamiento solo-lectura (2026-07-17)

Relevamiento literal del corazón compartido de agenda, previo a la generalización por persona.
DB viva vía `npx supabase --experimental db query --linked` + grep del monorepo. Cero escritura en DB.

Archivos de este directorio:

- `funciones_motor_prosrc.sql` — texto literal completo (`pg_get_functiondef`) de las 17 funciones relevadas.
- `snapshot/` — el "ANTES" de regresión (punto 9), entradas fijas documentadas abajo.
- `datos_prestador_horarios.json` — las 23 franjas vivas (generales + empleado).
- `datos_oferta_viva.json` — prestadores activos × ofertas activas de los 3 oficios.
- `datos_tipos_servicio.json` — catálogo completo de tipos_servicio.

## 1. prosrc literal del motor

En `funciones_motor_prosrc.sql`: `_agenda_ocupacion`, `_inicios_disponibles_prestador`,
`_prestador_bloqueado`, `obtener_slots_disponibles`, `obtener_paseadores_disponibles`,
`obtener_inicios_paseo_disponibles`, `obtener_groomers_disponibles`,
`obtener_inicios_grooming_disponibles`, `obtener_adiestradores_disponibles`,
`obtener_inicios_adiestramiento_disponibles`, `crear_bloqueo_agenda`, `contratar_programa`,
`_generar_citas_programa`, `confirmar_cita_pagada`, `reagendar_cita_suelta`,
`reagendar_sesion_programa`, cierres de los 3 oficios, `_trg_programa_cierre_en_orden`,
`_grooming_ofertas_cobrables`, `_adiestramiento_ofertas_cobrables`, `_mascota_elegible_servicio`.

Hechos estructurales que el texto literal fija:

- `_agenda_ocupacion` cuenta ocupación **por `prestador_id` exclusivamente** — no existe
  `empleado_id` en su WHERE. Ocupantes = citas `confirmada`/`en_curso` + holds
  `pendiente`+`pendiente_pago`+`expira_en > now()` (expiración perezosa), con exclusión
  `IS DISTINCT FROM p_excluir_cita` (D-349). Devuelve el MÁXIMO de solapamiento simultáneo
  en la ventana (barrido por instantes de inicio).
- `_inicios_disponibles_prestador` y todos los lectores de `prestador_horarios` filtran
  `(h.servicio_id IS NULL OR h.servicio_id = p_servicio_id)` y **NO filtran `h.empleado_id`**:
  una franja de empleado entra al motor como capacidad del prestador (ver punto 5).
- Cupo: `COALESCE(h.max_citas_por_slot, 1)`, chequeado como
  `cupo - _agenda_ocupacion(...) > 0` sobre TODO el recorrido de la ventana (S55-B2).

## 2. Callers de ocupación — exhaustivo

Funciones pg cuyo body referencia las internas (query a `pg_proc.prosrc`):

Llaman `_agenda_ocupacion` (12): `_generar_citas_plan`, `_generar_citas_programa`,
`_inicios_disponibles_prestador`, `crear_bloqueo_agenda`, `obtener_inicios_paseo_disponibles`,
`obtener_paseadores_disponibles`, `obtener_slots_disponibles`, `reagendar_cita_suelta`,
`reagendar_sesion_programa`, `reservar_salida_paquete`, `saltar_cita_plan`,
`vencer_programas_adiestramiento`.

Llaman `_inicios_disponibles_prestador` (4): `obtener_adiestradores_disponibles`,
`obtener_groomers_disponibles`, `obtener_inicios_adiestramiento_disponibles`,
`obtener_inicios_grooming_disponibles`.

Wrappers de `packages/api` que filtran `.is('empleado_id', null)` (exhaustivo):

- `packages/api/src/wrappers/horarios-modo.ts:128` (`eliminarFranjasPrestador`), `:192`
  (`obtenerFranjasDeServicios`), `:243` (pre-chequeo de solape de `crearFranjaServicio`).
- `packages/api/src/wrappers/configuracionPaseo.ts:307` (`obtenerFranjasHorario`), `:353`
  (pre-chequeo de solape de `crearFranjaHorario`), `:465` (pre-chequeo de solape de
  `editarFranjaHorario`).
- `packages/api/src/wrappers/paseo.ts:441/:450` menciona `empleado_id` pero como parámetro
  opcional de `confirmar_cita_servicio` (identidad del ejecutante al confirmar), no como filtro.

Callsites TS de los RPCs del motor: `agendamiento.ts:207/264/309/357/415`,
`grooming-reserva.ts:227/286`, `adiestramiento-reserva.ts:125/176/247`, `citaSuelta.ts:84`,
`paquetes.ts:187`, `planes.ts:288`, cierres en `paseo.ts:585`, `grooming-atencion.ts:679`,
`adiestramiento-atencion.ts:432`. `reagendar_sesion_programa` no tiene wrapper en
`packages/api` (se invoca desde otro lado o aún sin caller TS).

## 3. Snapshot de precio — evidencia literal

`crear_bloqueo_agenda`: el precio se congela EN EL INSERT del hold —
`INSERT INTO evento_cita_servicio (..., precio, duracion_minutos, ...) VALUES (...,
v_servicio.precio, v_servicio.duracion_minutos, ...)`. Para grooming, antes del insert
`v_servicio.precio := v_precio_talla` (talla del perfil + extra pelaje largo + recargo
domicilio, todo server-side) y `v_servicio.duracion_minutos := v_duracion_talla`.

`contratar_programa` → `_generar_citas_programa`: el total se congela en
`programas_contratados (precio_total, precio_unitario_efectivo = round(total/n, 2))` y cada
sesión nace con `v_precio` donde **la última absorbe el residuo**:
`v_precio := v_prog.precio_total - v_prog.precio_unitario_efectivo * (n_sesiones - 1)`.

Ningún camino re-resuelve: `confirmar_cita_pagada` solo VALIDA el snapshot
(`IF v_cita.precio IS NULL OR v_cita.precio < 0 THEN RAISE 'cita_sin_precio'`) y no lo toca;
`reagendar_cita_suelta` / `reagendar_sesion_programa` actualizan solo `fecha`, `hora` y
`metadata` — el precio viaja con la cita. Los cierres devengan `v_cita.precio` tal cual.

## 4. Guards de cierre vs ocupación

**NO.** Ni `cerrar_paseo_con_calidad`, ni `cerrar_grooming_con_calidad`, ni
`cerrar_atencion_adiestramiento`, ni ningún trigger consulta `_agenda_ocupacion` ni estado de
agenda. Evidencia: el scan de `pg_proc.prosrc` por `_agenda_ocupacion` lista exactamente las
12 funciones del punto 2 (ningún `cerrar_*`); los 12 triggers de las tablas del motor dan
`lee_ocupacion = no`. `sesion_anterior_abierta` vive en un único lugar:
`_trg_programa_cierre_en_orden` (trigger sobre `evento_cita_servicio`), que mira el ESTADO de
las citas hermanas del programa (`c.estado NOT IN ('completada','no_show','cancelada')` para
`sesion_numero` menores), jamás la ocupación.

## 5. prestador_horarios.empleado_id — las 5 filas

Las 5 filas no-NULL (ver `datos_prestador_horarios.json`): todas del prestador
**Satori Latam sas** (`2052f109-…`), todas del empleado **"Test Empleado"**
(`2e989931-…`, rol `empleado`, activo), lun-vie (dia 1-5) 08:00-18:00, slot 30,
`max_citas_por_slot=1`, `servicio_id NULL`, activas. Duplican exactamente las franjas
GENERALES lun-vie del mismo prestador.

Cómo nacieron: **NO** las produjo la clave UNIQUE de D-386. Las escribió la app legacy
`e-petplace-prestadores/src/lib/horarios.ts` → `saveHorarioDia(..., empleadoId)` que inserta
`empleado_id: empleadoId ?? null` (el empleado se creó/activó el 2026-05-10; datos de prueba).
La clave `prestador_horarios_franja_unica UNIQUE NULLS NOT DISTINCT (prestador_id,
servicio_id, empleado_id, dia_semana, hora_inicio)` solo les PERMITE coexistir con la franja
general idéntica (el empleado_id distinto separa las tuplas).

Riesgo vivo relevado: como el motor no filtra `empleado_id` (punto 1), esas franjas cuentan
como capacidad del prestador. Hoy es inocuo por partida doble — duplican franjas generales
idénticas con cupo chequeado por fila, y Satori está fuera de oferta (cuenta
`pendiente_validacion`, regla 7.13) — pero una franja de empleado en horas sin franja general
abriría oferta fantasma. La generalización debe decidir esto explícitamente.

Costo del backfill (`evento_atencion` por oficio): **13 filas totales** — paseo 10,
grooming 2, adiestramiento 1; las 13 con `empleado_id NULL`. `evento_cita_servicio`: 56 filas,
0 con `empleado_id`. El backfill al titular es trivial.

## 6. La entidad empleado

La tabla se llama **`prestador_empleados`** (no `empleados` — `empleados` no existe). Shape:
`id, prestador_id (FK prestadores CASCADE), user_id (FK auth.users RESTRICT), rol, nombre,
descripcion, foto_url, especialidades jsonb, activo, modelo_pago
('manual'|'comision'|'sueldo'), porcentaje_comision, datos_bancarios jsonb, invitado_en,
activado_en, created_at, created_by`. Satélites: `prestador_empleado_servicios
(empleado_id, servicio_id)` y `empleado_invitaciones`.

**Sí existe noción de titular en el schema**: `CHECK (rol = ANY ('dueño','empleado'))` — pero
**ninguna fila viva usa `'dueño'`**. Filas vivas: 5, todas de Satori Latam sas, todas rol
`empleado` (2 activas+activadas: "Test Empleado", "Nuevo 2"; 1 activa: "Diana";
2 inactivas sin activar: "Guillermo S", "Diana S"). El titular real hoy vive en
`prestadores.user_id`, fuera de la tabla de personas.

FKs entrantes a `prestador_empleados` (29): `prestador_horarios` (CASCADE) y 28 con
`ON DELETE SET NULL` — `evento_atencion`, `evento_cita_servicio`, `eventos_mascota`,
los 3 heads de oficio (`eventos_mascota_paseo/grooming/adiestramiento`), los ~14 eventos
clínicos (`evento_vacuna_aplicada`, `evento_historia_clinica_registrada`, …), `bonos`,
`estadias`, `suscripciones_servicio`, `prestador_atencion_log`, `prestador_empleado_servicios`.
`prestador_resenas` NO tiene columna `empleado_id` (consistente con la deuda declarada).

## 7. max_citas_por_slot — valores vivos y lectores

Valores vivos (franjas activas): [DEMO S44] Paseos Andres — dom 08-16 **cupo 4**;
mar/mié/jue/vie/sáb 08-12 **cupo 3**; lun 08-12 y tardes 14-18 **cupo 1**. Satori — todo
cupo 1 (generales y empleado). Es el único dato de concurrencia >1 del sistema.

Lectores en pg (scan `prosrc`, 11): `_generar_citas_plan`, `_generar_citas_programa`,
`_inicios_disponibles_prestador`, `crear_bloqueo_agenda`, `obtener_inicios_paseo_disponibles`,
`obtener_paseadores_disponibles`, `obtener_slots_disponibles`, `reagendar_cita_suelta`,
`reagendar_sesion_programa`, `reservar_salida_paquete`, `saltar_cita_plan` — es decir,
exactamente los callers de ocupación: la pregunta cupo-vs-ocupación se hace SIEMPRE junta.
En TS lo escriben los wizards (`configuracionPaseo.ts` crear/actualizar/editar franja,
`horarios-modo.ts` crearFranjaServicio) con validación `1..4` hardcodeada en el wrapper.

Dato para la tensión franja-vs-servicio: el cupo de Andres varía POR FRANJA del mismo
servicio (mañana 3, tarde 1, domingo 4) — hoy expresa capacidad operativa del horario, no
semántica del servicio.

## 8. tipos_servicio y cat_especies

`tipos_servicio` columnas: `id, codigo, nombre, descripcion, icono, categoria,
duracion_default_minutos, requiere_historia_clinica, requiere_resultado (default true),
es_medico, activo, orden_display, country_codes jsonb, created_at,
requiere_validacion_admin, especies_elegibles jsonb (nullable)`.
**No existe ninguna columna de concurrencia** — la semántica exclusiva/cupo no tiene casa hoy.

Los 11 tipos médicos (`es_medico=true`: emergencia, telemedicina, certificado_apoyo,
certificado_viaje, cirugia, consulta_general, ecografia, laboratorio, radiografia,
vacunacion, vacunacion_internacional): **los 11 con `especies_elegibles` NULL** (confirmado
D-424) y **los 11 con `requiere_resultado=true`** (confirmado el hueco D-418; el único
`false` del catálogo es `registro_evento`). No-médicos con especies: paseo* = ["perro"],
grooming* = ["perro","gato"], adiestramiento = ["perro"].

`cat_especies` shape: `codigo (PK texto), nombre, activo, orden_display, created_at,
nivel_soporte (default 'C'), acepta_nuevos_registros, motivo_estado, updated_at`. 11 filas;
activas 6: perro, gato, conejo, ave, roedor, pez (A,A,B,B,C,C); inactivas: reptil, huron,
cobaya, otro, equino.

## 9. Snapshot de regresión (el ANTES)

Tomado: **2026-07-17 15:07:05 UTC** (10:07 America/Guayaquil). Archivos en `snapshot/`.

Contexto de auth simulado: `request.jwt.claims.sub = dd024680-3d1c-4465-b38b-dedab45da037`
(dueño de la mascota de prueba). Mascota fija: **Zeus** `a3332037-c487-45c1-875f-83caf342f59e`
(perro, talla M, pelaje normal, EC).

Entradas fijas: fecha `2026-07-24` (viernes, DOW 5), hora `10:00`; paseo duraciones 30 y 60;
grooming `grooming` y `grooming_completo`, modalidad `local`; adiestramiento comprable NULL;
slots del prestador Andres (`de300000-…-00e5`) rango `2026-07-20..2026-07-26` para paseo 30'
(`de300000-…-a5e0`), grooming (`388fbd60-…`) y adiestramiento (`8fc664dd-…`).

Prestador vivo con oferta real: solo **[DEMO S44] Paseos Andres** (cuenta activa). Satori
Latam sas queda fuera por cuenta `pendiente_validacion` (7.13) — el snapshot lo confirma:
ninguna función lo devuelve.

Resultados (literales en los .json):
- inicios paseo 30': 15 horas (08:00-11:30, 14:00-17:00 — falta 17:30: cita firme real
  paseo 17:30 ese viernes); paseo 60': 13 horas.
- paseadores 10:00: 30'→ 1 fila ($6.00, `precio_plan` NULL); 60'→ 1 fila ($8.00).
- inicios grooming local: 13 horas; groomers 10:00: Baño $8.00/60' y Baño y corte
  $48.75/90', desglose `precio_base`/`extra_pelaje 0`/`recargo_domicilio 0`.
- inicios adiestramiento: 13 horas; adiestradores 10:00: 3 ofertas — programas "Obediencia
  desde cero" ($90, 6 ses., 35d) y "Programa básico" ($160, 6 ses., 56d) + sesión suelta $25.
- slots por rango: en los .json 10-12 con `cupos_restantes` por slot (se ve el cupo 3 de
  mañanas, el 4 del domingo, y el descuento por las citas firmes 17:30 y adiestramiento 08:00
  del 23-24; la cancelada del 25 no ocupa).

Ocupación real detrás del ANTES (contexto): 8 citas de Andres en el rango — 5 paseos firmes
17:30 (lun-vie 20-24/07), 2 adiestramientos firmes 08:00 (23 y 24/07), 1 paseo cancelado
25/07 17:30.

CAVEAT del juez: estas funciones dependen de `now()` (corte "solo futuro" y holds vigentes).
La prueba de identidad post-migración debe re-correr el ANTES y el DESPUÉS en la MISMA
transacción de la migración (asserts imperativos), usando este archivo como referencia de
forma, no como igualdad byte a byte contra otro instante.
