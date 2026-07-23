# S75-A3 · D-513 — CENSO POR SUPERFICIE + HALLAZGO QUE CAMBIA LA PREMISA

> **Estado: FRENADO A LA MESA (L-158/L-164).** El censo contra el literal
> **contradice la premisa del canon** con la que nació D-513. Como el founder
> declaró que D-513 "no viaja pre-aprobada — toca superficie que el censo
> todavía no midió", el censo la midió y **cambió** — y una migración fundada
> en la premisa vieja estaría curando un agujero que no existe. **No se
> escribió ni aplicó ninguna migración de D-513.** La decisión es de mesa con
> el literal a la vista.

---

## 1. LA PREMISA DEL CANON, Y LO QUE DICE EL LITERAL

**Premisa del arranque (canon S74):**
> *"D-513 🔴 NACE (gestión de NEGOCIO sin rol administrador: servicios,
> horarios y **precios editables por cualquier empleado** — choca con la letra
> de roles recién firmada)."*

**El literal la contradice: NO son editables por cualquier empleado. Todo es
titular-only.** Relevé TODA policy de escritura sobre las tablas de negocio, y
TODO wrapper que las escribe:

| Tabla de negocio | Policy de escritura | Gate literal |
|---|---|---|
| `prestador_servicios` | `prestador_servicios_own [ALL]` | `prestador_id IN (SELECT id FROM prestadores WHERE user_id = auth.uid()) OR is_admin()` — **titular** |
| `prestador_zonas` | `prestador_zonas_own [ALL]` | ídem — **titular** |
| `prestador_servicio_tallas` | `pst_own [ALL]` | ídem (vía `prestador_servicios` del titular) |
| `prestador_programas` | `pp_own [ALL]` | ídem |
| `prestador_especialidades` | `prestador_especialidades_own [ALL]` | ídem — **titular** |
| `prestador_documentos` | `pd_own` / `prestador_documentos_own [ALL]` | ídem — **titular** |
| `prestador_empleado_servicios` | `empleado_servicios_dueño_{inserta,elimina}` | ídem — **titular** |
| `prestadores` | `prestador_own_profile [ALL]` | `user_id = auth.uid() OR is_admin()` — **titular** (la plata/perfil) |
| `cuentas_comerciales` | `owner_update_own_cuentas_data` | `owner_profile_id = auth.uid()` — **owner** (la plata, verificado S74) |
| `prestador_horarios` | `prestador_horarios_own [ALL]` | `prestador_id …user_id = auth.uid()` — **titular** |
| `prestador_horarios` | **`ph_empleado_own [ALL]`** | `empleado_id IN (SELECT id FROM prestador_empleados WHERE user_id = auth.uid() AND activo = true)` — **el ÚNICO por empleado** |

**Los precios viven en `prestador_servicios` / `prestador_servicio_tallas` /
`prestador_programas`** — las tres son titular-only. **La plata** (`fee_configs`
admin-only, `cuentas_comerciales` owner-only) ya la verificó S74. No hay una
sola tabla de negocio escribible por "cualquier empleado".

---

## 2. LA ÚNICA POLICY POR-EMPLEADO Y POR QUÉ NO ES FUGA HOY

`ph_empleado_own` **estructuralmente** dejaría a un empleado activo escribir
franjas cuyo `empleado_id` sea el suyo. Pero **ningún wrapper vivo la
ejerce**: los dos únicos que escriben franjas —`horarios-modo.ts` (líneas 169,
176, 236, 244, 311) y `configuracionPaseo.ts` (303, 313, 364, 376, 481)—
escriben SIEMPRE con `empleado_id = obtenerTitularId(prestadorId)`, o sea las
franjas **del titular**.

Consecuencia, camino por camino, para un empleado logueado (que ahora entra por
R1):
- abre el taller de horarios → el wrapper intenta escribir con
  `empleado_id = titularId` →
  - `prestador_horarios_own` lo rebota (no es titular),
  - `ph_empleado_own` lo rebota también (el `empleado_id` apuntado es el del
    titular, no el suyo).
- **Resultado: no puede guardar.** `ph_empleado_own` es un **habilitador FUTURO
  del modelo de agenda por-persona** (la fundación V0 puso `empleado_id NOT
  NULL` justamente para eso), no un agujero explotado.

El único RPC DEFINER que escribe negocio (`escenario_paseo_iniciado`) está
gateado por `test_guard_activo()` — es un guard de escenario de test, no
superficie de producto (su `anon=X` es clase D-503, ventana aparte).

---

## 3. EL HALLAZGO — QUÉ ES D-513 CONTRA EL LITERAL

**No es una fuga de escritura.** Con R1 ya abriendo la puerta del resolvedor,
un empleado que entra al taller de negocio **ve** las pantallas pero **no puede
guardar nada** — la RLS titular-only lo rebota en las 11 superficies. Es UX
rota (ve un taller que no puede usar), **no entrega de la lapicera**.

Lo que el literal SÍ muestra es el **hueco inverso**: **el ADMINISTRADOR (el rol
que A0 acaba de crear) NO puede gestionar el negocio — solo el titular puede.**
La letra §2 dice que el administrador ve *"la plata, la gestión del negocio y el
equipo"*. El motor de hoy es **más restrictivo que la letra**: reserva la
gestión al titular. Cumplir la letra exige **AMPLIAR** de `titular` a
`titular OR administrador` — que es abrir acceso, dirección opuesta a "poner un
gate".

**Por qué esto importa para el orden del arco:** el arranque puso *"ANTES DE LA
PUERTA VAN D-490 Y D-513 — la CONDICIÓN para que abrirla no entregue la
lapicera."* D-490 sí entregaba escritura (clínica) y se cerró. **D-513, contra
el literal, NO entrega escritura de negocio** (titular-only rebota), así que su
rol de "candado antes de la puerta" **se disuelve**: abrir B3 no fuga gestión de
negocio. Lo que queda es que el administrador no podrá gestionar hasta que se
amplíe — un hueco de FUNCIÓN de la letra, no un hueco de SEGURIDAD.

Es el mismo patrón L-158 de S72 (*"las 14 policies nombran recepción" → CERO*):
la conclusión de mesa ("hay que gatear antes de la puerta") descansaba sobre una
premisa ("editables por cualquier empleado") que el literal no sostiene.

---

## 4. LO QUE LA MESA TIENE QUE DECIDIR (con el literal a la vista)

**(1) ¿D-513 sigue siendo 🔴 bloqueante de la puerta?** Contra el literal, no
entrega escritura — la puerta (B3) puede abrirse sin que D-513 esté cerrada, y
el peor caso es un administrador que ve el taller y no puede guardar (UX, no
fuga). Propuesta: **baja de 🔴 a 🟠** y deja de ser precondición de B3.

**(2) ¿Se AMPLÍA la gestión al administrador ahora, o es construcción del arco?**
La ampliación es limpia para 9 de las 11 superficies: reemplazar el subselect
`prestador_id IN (SELECT id FROM prestadores WHERE user_id = auth.uid())` por
`empleado_tiene_rol(prestador_id, ARRAY['dueño','administrador'])` (el brazo 2
cubre al titular — L-150, cero segunda verdad). **PERO** cruza un nudo de
modelo en horarios (ver 3).

**(3) EL NUDO DE HORARIOS — decisión de modelo, no de policy:** las franjas
tienen `empleado_id NOT NULL`. Si un administrador que NO es titular edita "las
franjas del negocio", ¿escribe las del titular? ¿las suyas? ¿el negocio
unipersonal tiene "franjas del negocio" o "franjas de cada persona"? Esto es el
modelo de agenda por-persona (V0, S67) que todavía no se ejerció con >1 persona.
**No se resuelve en una policy** — se resuelve en la mesa que defina el modelo
multi-empleado, junto con B.

**(4) `ph_empleado_own` — ¿se toca?** Es el habilitador del modelo por-persona.
Hoy inerte (ningún wrapper lo ejerce). Si el modelo multi-empleado se activa,
esta policy es correcta (cada persona gestiona SUS franjas). Propuesta: **se
deja** — no es fuga, es infraestructura futura correcta.

---

## 5. LO QUE NO SE HIZO, Y POR QUÉ

**No se escribió ni aplicó migración de D-513.** Una migración de "gate
restrictivo" curaría un agujero que el literal muestra inexistente; una
migración de "ampliación a administrador" es correcta en dirección pero cruza el
nudo de modelo (4.3) que la mesa debe resolver primero — y el founder fue
explícito en que D-513 pide su OK con el literal, que ahora dice algo distinto
de la premisa. **El literal está entregado; la migración nace cuando la mesa
resuelva (1)–(4).**

---

## 6. VERIFICACIÓN

Todo el literal salió de la DB viva (`pg_policies`, `pg_proc`,
`pg_get_functiondef`) y de grep sobre los wrappers en `2a7ecae`. Cero
escritura: censo de solo lectura. La afirmación central —"toda escritura de
negocio es titular-only"— es verificable: ninguna de las 11 policies de
escritura nombra `prestador_empleados` con rol, y las dos que tocan `empleado_id`
(los wrappers de horario) apuntan al titular por `obtenerTitularId`.
