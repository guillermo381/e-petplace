# S73-B · RELEVAMIENTO DE EQUIPO contra DB VIVA (esqueleto §5, L-141)

> **Solo lectura. CERO propuestas de migración** — la letra fina se
> escribe en mesa sobre este literal. Proyecto `zyltipqscdsdsxnjclhp`,
> corrido 21-jul-2026 vía `supabase db query --linked`. Muestras
> anonimizadas a 8 hex.

---

## (a) `prestador_empleados` — schema completo (10 filas vivas)

**Columnas** (information_schema, literal):

| columna | tipo | null | default |
|---|---|---|---|
| id | uuid | NO | gen_random_uuid() |
| prestador_id | uuid | NO | — |
| user_id | uuid | NO | — |
| **rol** | text | NO | — |
| nombre | text | NO | — |
| descripcion | text | YES | — |
| foto_url | text | YES | — |
| especialidades | jsonb | YES | '[]' |
| activo | boolean | NO | true |
| modelo_pago | text | NO | 'manual' |
| porcentaje_comision | numeric | YES | — |
| datos_bancarios | jsonb | NO | '{}' |
| invitado_en | timestamptz | YES | — |
| activado_en | timestamptz | YES | — |
| created_at | timestamptz | NO | now() |
| created_by | uuid | NO | — |

**Constraints (pg_get_constraintdef, literal):**
- `prestador_empleados_rol_check`: `CHECK ((rol = ANY (ARRAY['dueño'::text, 'empleado'::text])))` ← **el discriminador que EXISTE: solo dos valores**
- `prestador_empleados_unique`: `UNIQUE (prestador_id, user_id)` ← una fila por persona por negocio (los roles acumulables NO caben como filas: serían columna/valores nuevos o tabla puente — decisión de mesa)
- `prestador_empleados_modelo_pago_check`: `('manual','comision','sueldo')`
- `prestador_empleados_porcentaje_check`: `NULL OR 0..100`
- FKs: `prestador_id → prestadores ON DELETE CASCADE` · `user_id → auth.users ON DELETE RESTRICT` · `created_by → auth.users`

**Policies (RLS habilitada = true):**
- `empleados_accept_invitation` INSERT: `user_id = auth.uid() AND existe_invitacion_pendiente(prestador_id)`
- `empleados_admin` ALL: `is_admin()`
- `empleados_dueño_crea/actualiza/ve_todos` (INSERT/UPDATE/SELECT): `prestador_id IN (SELECT id FROM prestadores WHERE user_id = auth.uid())` ← **"dueño" acá = dueño de la FILA de prestadores, no el rol de la tabla**
- `empleados_self` SELECT + `empleados_self_actualiza` UPDATE: `user_id = auth.uid()`

**Muestra (10 filas, anonimizada):** 5 filas `rol='empleado'` del legacy
`2052f109` (mayo 2026; 3 activas, 2 inactivas; todas `modelo_pago=
'manual'`, cero descripcion) + **5 filas `rol='dueño'` creadas
2026-07-17/18 (la materialización S67)** — una por prestador, sin
`invitado_en` (nacieron directas, no por invitación).

## (b) RPCs/funciones que cargan `empleado_id` — 48 en total

`_agenda_ocupacion` · `_agendar_cita_desde_presupuesto` ·
`_crear_evento_padre_auto` · `_generar_citas_plan` ·
`_generar_citas_programa` · `_inicios_disponibles_prestador` · los 13
`_trg_*_crear_evento` (alergia/certificado/condicion/examen/hc/
intervencion/medicacion×2/microchip/peso/temperamento/vacuna/
auto_log_atencion) · `abrir_caso_clinico` ·
`aceptar_invitacion_pendiente_login` · `completar_cita_servicio` ·
`completar_historia_clinica` · `confirmar_cita_servicio` ·
`contratar_plan_paseo` · `convertir_horarios_a_por_servicio` ·
`crear_bloqueo_agenda` · `crear_empleado_directo` ·
`crear_presupuesto_borrador` · `fijar_fecha_procedimiento` ·
`iniciar_atencion_{adiestramiento,grooming,paseo}` ·
`obtener_citas_por_coordinar` · `obtener_inicios_paseo_disponibles` ·
`obtener_paseadores_disponibles` · `obtener_slots_disponibles` ·
`reagendar_cita_suelta` · `reagendar_sesion_programa` ·
`rechazar_invitacion_pendiente_login` · `registrar_archivo_atencion` ·
`registrar_atencion_mostrador` · `reservar_salida_paquete` ·
`saltar_cita_plan` · `sedimentar_nota_clinica` · `simular_*` ×3.

**CÓMO lo cargan (patrones literales):**
- El motor de agenda ocupa POR PERSONA: `_agenda_ocupacion(p_empleado_id …) WHERE c.empleado_id = p_empleado_id`; los generadores de citas JOIN `prestador_empleados pe ON pe.id = h.empleado_id AND pe.activo` (+ `prestador_empleado_servicios` cuando el horario es por servicio).
- La procedencia clínica lo ESTAMPA: todos los `_trg_*_crear_evento` insertan `NEW.prestador_id, NEW.empleado_id` al evento padre — **la salida del empleado NO rompe la historia (§4 del esqueleto ya es verdad de motor)**.
- `confirmar/completar_cita_servicio` tienen backfill perezoso: `empleado_id = CASE WHEN v_empleado_id IS NULL AND p_empleado_id_actual IS NOT NULL THEN p_empleado_id_actual ELSE empleado_id`.
- `abrir_caso_clinico(p_empleado_id …)` deriva el prestador DESDE el empleado: `SELECT pe.prestador_id FROM prestador_empleados pe WHERE pe.id = p_empleado_id`.
- **El handshake de entrada YA tiene motor**: `crear_empleado_directo` + `aceptar_invitacion_pendiente_login` + `rechazar_invitacion_pendiente_login` + policy `empleados_accept_invitation`.

## (c) `cuenta_roles` y los titulares S67 — LO QUE REALMENTE SON

**HALLAZGO L-158 (el nombre engaña):** `cuenta_roles` NO es roles de
personas. Columnas literales: `id · cuenta_comercial_id · tipo_actor
(enum) · estado (enum, default 'activo') · activado_en · suspendido_en ·
suspension_motivo · cerrado_en · metadata · created_at · updated_at` —
**NO tiene `user_id`**. `UNIQUE (cuenta_comercial_id, tipo_actor)`.
Es "qué tipos de actor opera la CUENTA". Estado vivo post-backfill S54:
**4 filas, todas `tipo_actor='prestador_servicios'` · `estado='activo'`.**

**Los titulares rol='dueño' de S67 viven en `prestador_empleados`**
(las 5 filas del 17-18 jul de la muestra (a)) — no en cuenta_roles.

**El resto del mapa de roles por tabla (literal):**
- `familia_miembro.rol`: 12 filas, todas `adulto_titular`
- `user_roles.role`: admin 1 · pet_parent 13 · prestador 7 · seller 2
- `empleado_invitaciones` (5 filas): `id · prestador_id · email · nombre · rol (CHECK **solo 'empleado'**) · token UNIQUE · expira_en · estado ('pendiente','aceptada','expirada','cancelada','pendiente_aceptacion_login','rechazada') · created_at · created_by`
- `admin_users.rol` / `admin_roles` / `admin_usuarios_roles` (backoffice, fuera de alcance)

## (d) ¿Existe discriminador recepción/profesional HOY? — **NO**

- **Cero enums** con labels recepcion/profesional/dueño (query a `pg_enum`: null).
- **Cero CHECKs** con esas palabras salvo `prestador_documentos_tipo_check` — que es LA CREDENCIAL, no el rol: `('cedula','ruc','titulo_profesional','registro_senescyt','permiso_funcionamiento','certificado_vacunas','seguro','otro')` ← **la capa de credencial del esqueleto §1.2 ya tiene tabla de depósito (`prestador_documentos`) con el ciclo admin §14.2 vivo (S68)**.
- El único rol de persona-en-negocio es `prestador_empleados.rol IN ('dueño','empleado')` — **'empleado' no distingue recepción de profesional**.
- `prestador_empleado_servicios (empleado_id, servicio_id)` — **el ACTO por persona EXISTE como tabla y está VACÍA (0 filas)**: la infraestructura de D-463 (el otorgamiento carga el oficio/acto) tiene dónde vivir, hoy sin productor que la llene desde las apps (la conspiración de NULLs S66 sigue).
- Contexto: `prestadores.tipo` vive con datos (`clinica_veterinaria` 2 · `paseador` 3) — el eje que A3 declaró muerto sigue poblado; no se toca sin mesa.

## (e) Policies RLS que leen rol/empleados HOY — 28 (lista completa)

`bonos` (empleado_own SELECT · empleado_update UPDATE · walkin INSERT) ·
`caso_clinico` (insert_vet — owner O empleado activo de la cuenta
tratante, + acceso vigente a la mascota) · `caso_clinico_consultor`
(select consultor) · `cuenta_roles` (owner_select) · `estadias` (×3
espejo de bonos) · `evento_cita_servicio` (**select/update/insert:
`prestador_id IN (dueño de fila prestadores) OR empleado_id IN (mis
filas activas de prestador_empleados)`**) · `eventos_mascota` (insert:
si trae empleado_id exige que sea MI fila activa DEL MISMO prestador) ·
`familia_miembro` (insert titular) · `mascota_acceso_prestador`
(select: dueño O empleado activo de la cuenta) · `notificaciones`
(insert prestador cita) · `prestador_atencion_log` (select) ·
`prestador_empleado_servicios` (select/insert/delete — escribe el
DUEÑO de la fila de prestadores) · `prestador_horarios`
(ph_empleado_own ALL) · `presupuesto` (select familia) ·
`suscripciones_servicio` (×3) · `user_roles` (×3 self).

**LA FOTO DEL HUECO D-464 (literal):** las policies de LECTURA clínica
NO miran rol:
- `eventos_mascota_select`: `user_tiene_acceso_a_mascota(mascota_id)`
- `medicacion_select` (evento_medicacion_prescrita): ídem
- `caso_clinico_select_clinica_tratante/consultor`: helpers por CUENTA
  (cualquier empleado activo califica)

`user_tiene_acceso_a_mascota` resuelve familia O acceso de prestador —
y "prestador" incluye a TODO empleado activo sin distinción. **La
recepcionista (cuando exista como rol) leería el expediente clínico
completo: el hueco de A3.0 es literal en el motor hoy.** (Diagnóstico,
no propuesta — la cura es letra de mesa + escritor A.)

## Síntesis para la mesa (hechos, no propuestas)

1. El rol de persona-en-negocio existe (`prestador_empleados.rol`) con
   DOS valores; los tres del esqueleto (dueño/profesional/recepción)
   exigen ampliar el CHECK o una forma nueva — y `UNIQUE(prestador_id,
   user_id)` fuerza que la ACUMULACIÓN de roles sea por valor/columna,
   no por filas.
2. La CREDENCIAL ya tiene depósito (`prestador_documentos`:
   titulo_profesional, registro_senescyt) y ciclo admin §14.2 con
   lector vivo desde S68.
3. El ACTO por persona tiene tabla (`prestador_empleado_servicios`) —
   vacía, 0 filas.
4. El handshake de entrada tiene motor completo (invitaciones + 3 RPCs
   + policy), con `rol` CHECK-eado a solo 'empleado'.
5. La salida ya preserva actos (`empleado_id` estampado en 13 triggers
   de procedencia; FK user_id RESTRICT).
6. `cuenta_roles` NO es la tabla de esta letra (es tipo_actor por
   cuenta) — el nombre invita al error (esta sesión lo cometió en la
   primera query: `column "rol" does not exist`).
7. D-464 es literal: cero gate de rol en la lectura clínica.
