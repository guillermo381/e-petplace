# RELEVAMIENTO S76-A0 — el modelo de chips, el predicado de agenda, roles y gobierno

> SOLO LECTURA. Cero migración, cero commit de código. Todo lo de abajo salió de
> `pg_get_functiondef`, `pg_policies`, `pg_constraint` e `information_schema`
> contra la DB viva (`zyltipqscdsdsxnjclhp`), más grep del árbol de wrappers.
> Sin propuesta de cura. Fecha: 24 Jul 2026 (S76-A0).
>
> Citado por: `LETRA_RECEPCION_S76.md` (piso de literal) · D-522 (enmienda) ·
> D-486 (enmienda) · D-526 (nace).

---

## 1. `empleado_roles` — CHECK y censo

CHECK literal de `rol` (`empleado_roles_rol_check`):
```sql
CHECK ((rol = ANY (ARRAY['dueño'::text, 'administrador'::text, 'profesional'::text, 'recepcion'::text])))
```
`administrador` YA está en el CHECK (la migración `20260723173914` de S75 aterrizó).

Censo `GROUP BY rol`:
| rol | n |
|---|---|
| dueño | 5 |
| recepcion | 1 |
| administrador | 0 |
| profesional | **0** |

Shape: `id uuid PK` · `empleado_id uuid NOT NULL → prestador_empleados(id) ON DELETE CASCADE` · `rol text NOT NULL` · `asignado_por uuid NOT NULL → auth.users(id)` · `asignado_en timestamptz DEFAULT now()` · `UNIQUE (empleado_id, rol)`.

## 2. `prestador_empleado_servicios` — el canon acierta a medias

Shape: `empleado_id uuid → prestador_empleados(id) ON DELETE CASCADE` + `servicio_id uuid → prestador_servicios(id) ON DELETE CASCADE` + `created_at`; **PK compuesta `(empleado_id, servicio_id)`** (ese es el único UNIQUE); índices sueltos por cada FK.

- **0 filas: VERIFICADO** (`count(*) = 0`).
- **"0 lectores": FALSO.** 0 policies y 0 vistas la mencionan, pero **8 funciones de `public` la leen** (grep sobre `prosrc`): `_generar_citas_plan` · `obtener_slots_disponibles` · `reservar_salida_paquete` · `_generar_citas_programa` · `_inicios_disponibles_prestador` · `crear_bloqueo_agenda` · `obtener_inicios_paseo_disponibles` · `obtener_paseadores_disponibles`. Es el motor entero de disponibilidad/generación de citas. Cómo la usan por dentro se detalla en A0bis punto 1.

## 3. Las tres policies de agenda (`evento_cita_servicio`) — el predicado, contestado

Las tres comparten el MISMO predicado, byte-idéntico (SELECT en USING; INSERT en WITH CHECK; UPDATE en ambos):
```sql
(
  (prestador_id IN ( SELECT prestadores.id
     FROM prestadores
    WHERE (prestadores.user_id = auth.uid())))
  OR
  (empleado_id IN ( SELECT prestador_empleados.id
     FROM prestador_empleados
    WHERE ((prestador_empleados.user_id = auth.uid()) AND (prestador_empleados.activo = true))))
)
```
Las tres son `PERMISSIVE`, rol `authenticated`.

**Respuesta a la pregunta explícita:** la rama del empleado **SÍ restringe a los `empleado_id` PROPIOS** del usuario (subquery anclada a `auth.uid()` + `activo=true`). No hay rama `is_admin`, ni subquery sin `auth.uid()`, ni nada que abra la agenda entera del negocio a un empleado. La única rama "agenda entera" es la de **titularidad** (`prestadores.user_id = auth.uid()`), que es para el titular.

Dos consecuencias de hecho (registro, no cura):
- Un empleado activo no-titular **solo ve las citas donde ÉL es el `empleado_id`**. Una cita con `empleado_id` NULL o asignada a un compañero le es invisible por RLS. D-522 se resuelve así contra la fuente: la agenda NO está abierta al negocio entero — está **cerrada de más** para el empleado (ve solo lo propio, y hoy casi nada porta `empleado_id`).
- `registrar_atencion_mostrador` es DEFINER (salta esta policy al escribir) y en el caso ambiguo N>1 deja `empleado_id = NULL` → la recepcionista puede crear una cita que después **no puede leer** por la rama de empleado.

## 4. Los dos helpers clínicos — el ARRAY exacto

**`user_acceso_clinico_a_mascota(p_mascota_id)`** (plpgsql, DEFINER, `search_path 'public'`): sin sesión → false · `is_admin()` → true · dueño de la mascota (`mascotas.user_id`) → true · después la pata prestador vía `mascota_acceso_prestador` vigente, donde la cuenta comercial se resuelve por:
```sql
SELECT cuenta_comercial_id FROM prestadores
WHERE user_id = v_user_id
UNION
SELECT p.cuenta_comercial_id
FROM prestador_empleados pe
JOIN prestadores p ON p.id = pe.prestador_id
WHERE pe.user_id = v_user_id AND pe.activo = true
  AND empleado_tiene_rol(pe.prestador_id, ARRAY['dueño','profesional'])
```
**ARRAY: `['dueño','profesional']`** en la rama empleado. Ojo al literal: la rama del **titular** (primera pata del UNION) pasa **sin chequeo de rol** — la titularidad basta. + caducidad lazy de `cita_automatica` con ventana `acceso_prestador_caducidad_meses` (default 6).

**`user_puede_escribir_clinico(p_prestador_id, p_mascota_id)`** (sql, DEFINER):
```sql
SELECT
  p_prestador_id IS NOT NULL
  AND user_tiene_acceso_a_mascota(p_mascota_id)
  AND (
    is_admin()
    OR empleado_tiene_rol(p_prestador_id, ARRAY['dueño', 'profesional'])
  );
```
**ARRAY: `['dueño','profesional']`** — idéntico. Y el `empleado_tiene_rol` subyacente tiene una segunda rama: **`'dueño' = ANY(p_roles)` + ser `prestadores.user_id` → true sin fila de rol** — el titular pasa por hardcode de titularidad, no por chip. Es el "brazo 2" que el canon de S75 ya describía.

## 5. `registrar_atencion_mostrador` — el guard mira el NEGOCIO, no el chip

Del functiondef literal, la cadena de guards es:
1. `auth.uid()` no nulo;
2. **`user_puede_acceder_prestador(p_prestador_id)`** — literal: admin OR **titular** OR **empleado activo, SIN mirar rol/chip**;
3. acceso vigente de la cuenta a la mascota (`mascota_acceso_prestador`);
4. `tipos_servicio.es_medico = true` para el código;
5. **`prestador_servicios ps WHERE ps.prestador_id = p_prestador_id AND ps.tipo_servicio = ... AND ps.activo = true`** — el menú vivo **del NEGOCIO**.

**Respuesta: el guard mira el servicio activo del NEGOCIO y la membresía activa de la persona; el chip de la PERSONA no aparece en ningún guard.** `p_empleado_id` es solo dato de asignación (N=1 auto-resuelve al único activo; N>1 queda lo que vino explícito, típicamente NULL). Ningún `empleado_tiene_rol` en toda la función: cualquier empleado activo —recepción incluida— puede registrar atención de mostrador (coherente con "Registrar atención es la puerta de la recepcionista", S72-P1).

## 6. Filas `profesional` con user distinto del titular: CERO

`count(*)` de `empleado_roles.rol='profesional'` = **0** en toda la tabla (la revocación del founder de S75-A48 dejó cero). El join `pe.user_id IS DISTINCT FROM pr.user_id` devuelve `[]`. **Nadie pierde acceso clínico hoy con un flip del gate.** (Los 5 `dueño` ni dependen de la fila: el brazo 2 de `empleado_tiene_rol` los cubre por titularidad.)

## 7. Policies de `prestador_empleados` — el empleado NO ve a sus compañeros

Las 7 policies, literal:

| policy | cmd | USING | WITH CHECK |
|---|---|---|---|
| `empleados_self` | SELECT | `(user_id = auth.uid())` | — |
| `empleados_dueño_ve_todos` | SELECT | `prestador_id IN (SELECT prestadores.id FROM prestadores WHERE prestadores.user_id = auth.uid())` | — |
| `empleados_admin` | ALL | `is_admin()` | `is_admin()` |
| `empleados_accept_invitation` | INSERT | — | `(user_id = auth.uid()) AND existe_invitacion_pendiente(prestador_id)` |
| `empleados_dueño_crea` | INSERT | — | mismo subquery de titularidad |
| `empleados_dueño_actualiza` | UPDATE | subquery de titularidad | subquery de titularidad |
| `empleados_self_actualiza` | UPDATE | `(user_id = auth.uid())` | `(user_id = auth.uid())` |

**Respuesta: un empleado activo no-titular solo puede leer SU PROPIA fila** (`empleados_self`). No existe ninguna policy que le abra las filas de sus compañeros del mismo negocio — eso es exclusivo del titular (`empleados_dueño_ve_todos`) y del admin. La precondición de "ver con qué empleado" **no existe hoy para nadie que no sea el titular**: aun si una cita portara `empleado_id`, el empleado no podría resolver ese id a un nombre por RLS directa.

## 8. ¿Existe un lector de citas del negocio CON empleado? — NO para la jornada; es construcción

Barrido en las tres capas:

- **RPCs:** las únicas cuyo RETURNS incluye empleado son `obtener_citas_por_coordinar` (devuelve `empleado_id` — pero es la lista de por-coordinar, no la jornada), `obtener_casos_activos_mascota` (`empleado_tratante_id`, casos, no citas) y `obtener_empleados_cuenta` (lista del equipo, no citas). **Ninguna RPC devuelve la jornada/agenda con su empleado asignado.**
- **Vistas:** cero vistas que crucen `evento_cita_servicio` con `empleado_id`.
- **Wrappers (los lectores reales de la jornada):** ninguno selecciona `empleado_id` —
  - `paseo.ts` → `obtenerCitasPaseoDelDia` select literal: `'id, fecha, hora, estado, tipo_servicio, suscripcion_servicio_id, duracion_minutos, direccion_snapshot, mascota:mascotas(...), tipo:tipos_servicio!inner(...), atencion:evento_atencion(...)'` — sin `empleado_id`;
  - `veterinaria-atencion.ts` → `SELECT_CITA` (mismo patrón + `metadata` + presupuesto) — sin `empleado_id`;
  - `grooming-atencion.ts` (los dos selects) — sin `empleado_id`.
  - Las únicas ocurrencias de `empleado_id` en wrappers no-tipos son de **escritura** (`iniciarAtencionPaseo` y el input del mostrador pasan `p_empleado_id`).

**Conclusión del punto 8: no existe — es CONSTRUCCIÓN, no cura.** Hoy la cadena entera está muda: la jornada no trae el `empleado_id` de la cita, y aunque lo trajera, el punto 7 muestra que un no-titular no puede resolverlo a persona.

## 9. Check-in / llegada / sala de espera: **NO EXISTE**

**Estados reales del CHECK de citas** (`evento_cita_servicio_estado_check`, literal):
```sql
CHECK ((estado = ANY (ARRAY['pendiente'::text, 'confirmada'::text, 'en_curso'::text,
  'completada'::text, 'cancelada'::text, 'no_show'::text, 'rechazada'::text])))
```
Y el de reserva (`chk_estado_reserva_valida`):
```sql
CHECK ((estado_reserva = ANY (ARRAY['pendiente_pago'::text, 'pagada'::text, 'expirada'::text, 'cancelada'::text])))
```
Ningún estado intermedio entre `confirmada` y `en_curso`. **No hay "llegó"**: el salto es directo de cita firme a atención iniciada (`en_curso` lo estampa iniciar la atención).

Barrido de "cualquier cosa parecida a llegó" en todo `public`:
- **Columnas de `evento_cita_servicio`** (las 31): nada de llegada/check-in. Lo más cercano en semántica temporal es `evento_atencion.iniciada_en` — pero eso es el INICIO de la atención, no la llegada al mostrador.
- **Tablas** con nombre `%llegad%/%checkin%/%espera%/%arrib%`: apareció **`lista_espera`** — inspeccionada para no reportar falso positivo: es la **waitlist de demanda del portal legado** (tipos `camada|producto|servicio|prestador`, FKs a `criaderos`/`criadero_camadas`/`productos`, estados `activo|notificado|convertido|cancelado`, policy `le_owner` por `user_id`). **0 filas, 0 funciones que la toquen.** No tiene nada que ver con sala de espera clínica.
- **Columnas en todo public** con esos patrones: solo `_test_resultado_d242.esperado` (residuo de harness).
- **Funciones** con `llegad/checkin/sala_de_espera` en nombre o body: **cero**.

**Conclusión: el check-in no existe en ninguna capa — ni estado, ni columna, ni tabla, ni función. Si S76 lo quiere, es construcción desde cero** (incluido decidir si es estado del CHECK, timestamp propio, o entidad aparte).

## 10. `registrar_cobro_presencial` — recepción SÍ puede

La cadena de guards, literal:
1. `auth.uid()` no nulo;
2. la cita existe (resuelve `cuenta_comercial_id` + `country_code` de la fila);
3. **`_user_opera_cuenta_comercial(v_cuenta, v_uid)`** — cuyo literal:
```sql
SELECT EXISTS (
  SELECT 1 FROM cuentas_comerciales cc WHERE cc.id = p_cuenta_id AND cc.owner_profile_id = p_uid
  UNION
  SELECT 1 FROM prestador_empleados pe
    JOIN prestadores p ON p.id = pe.prestador_id
    WHERE p.cuenta_comercial_id = p_cuenta_id AND pe.user_id = p_uid AND pe.activo = true
);
```
4. monto ≥ 0, medio en `('efectivo','tarjeta','transferencia')`, UNIQUE por cita (`cobro_ya_registrado`).

**Respuesta: el guard es owner de la cuenta O empleado ACTIVO — sin mirar `empleado_roles` en ningún punto.** Ni `empleado_tiene_rol`, ni ARRAY de roles, ni chip: **un empleado activo sin ningún rol clínico (recepción, o incluso el aceptado-sin-rol) puede registrar el cobro presencial.** Es el espejo exacto del mostrador (punto 5): ambas puertas DEFINER de la ventanilla gatean por membresía activa del negocio, jamás por chip.

Nota de coherencia: consistente con la letra de S69 ("cobro presencial como DATO") y con `LETRA_EQUIPO` (recepción = el piso sin chips que igual opera el mostrador). Contraste servido: la escritura **clínica** gatea por `['dueño','profesional']` (punto 4); la ventanilla (mostrador + cobro) gatea por **membresía sola**. Dos varas distintas, hoy ambas deliberadas según el canon.

---

**Síntesis en una línea por punto:** (1) el CHECK ya admite los 4 roles; en data solo viven `dueño`×5 y `recepcion`×1 · (2) 0 filas verificado, "0 lectores" refutado — 8 funciones del motor la leen · (3) las policies restringen al `empleado_id` PROPIO; la agenda entera es solo del titular; la cita sin asignar es invisible al empleado · (4) ambos helpers clínicos gatean por `ARRAY['dueño','profesional']`, con el titular pasando por titularidad sin fila · (5) el mostrador gatea por negocio + membresía activa, jamás por chip · (6) cero `profesional` no-titular: el flip no le quita acceso a nadie hoy · (7) el empleado solo lee su propia fila del equipo · (8) el lector de citas-con-empleado no existe en ninguna capa · (9) el check-in no existe en ninguna forma · (10) recepción puede registrar el cobro presencial (gatea por membresía, no por chip).
