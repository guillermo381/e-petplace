# RELEVAMIENTO S76-A0bis — los chips son EXCLUYENTES, y la fila del vínculo es escribible por su dueño

> SOLO LECTURA (con UN test de escritura en `DO` block con salida por
> `RAISE EXCEPTION` incondicional → rollback garantizado, residuo verificado en
> 0). Cero migración, cero commit de código. Fecha: 24 Jul 2026 (S76-A0bis).
>
> Citado por: `LETRA_RECEPCION_S76.md` §6.1 · D-526 (nace) · D-486 (enmienda).

---

## 1. Las 8 funciones que leen `prestador_empleado_servicios`: UN solo predicado, EXCLUYENTE

Las 8 usan **byte-idéntico** este predicado (solo cambia la variable del servicio):

```sql
AND (pe.rol = 'dueño' OR EXISTS (
      SELECT 1 FROM prestador_empleado_servicios pes
      WHERE pes.empleado_id = pe.id AND pes.servicio_id = <servicio>))
```

donde `pe` viene siempre del mismo join: `prestador_horarios h JOIN prestador_empleados pe ON pe.id = h.empleado_id AND pe.activo`. Ubicación literal por función:

| función | `<servicio>` |
|---|---|
| `_generar_citas_plan` | `v_susc.prestador_servicio_id` |
| `_generar_citas_programa` | `v_prog.prestador_servicio_id` |
| `_inicios_disponibles_prestador` | `p_servicio_id` |
| `crear_bloqueo_agenda` | `p_servicio_id` |
| `obtener_inicios_paseo_disponibles` | `ps.id` |
| `obtener_paseadores_disponibles` | `ps.id` |
| `obtener_slots_disponibles` | `p_servicio_id` |
| `reservar_salida_paquete` | `p_servicio_id` |

**Clasificación — las 8 son EXCLUYENTES, con la excepción del titular adentro del propio predicado:**

- **Con 0 filas:** el `EXISTS` es falso para todo el mundo → solo sobrevive la rama `pe.rol = 'dueño'`. Un empleado no-titular (`rol='empleado'`) **ya está excluido HOY** de generar disponibilidad, recibir asignación de bloqueo, plan, programa o paquete — aunque tenga horarios propios y esté activo. El motor no está "ciego al empleado": lo **veta** hasta que alguien puebla `prestador_empleado_servicios`. Que hoy no se note es porque ningún no-titular tiene filas en `prestador_horarios` — el veto es estático, no operativo.
- **El día que exista 1 fila:** ese empleado entra al pool de disponibilidad **solo para ESE `servicio_id`** (la oferta puntual, no el oficio), y desde ahí compite en el `ORDER BY` de asignación (menos citas del día → `created_at` → `id`) y ocupa capacidad vía `_agenda_ocupacion(pe.id, …)`. Todo el circuito posterior ya es por-persona; solo falta la fila.
- **Hallazgo colateral (D-486):** `pe.rol = 'dueño'` acá es el **eje legacy con OCHO lectores vivos más** — no es solo `titular.ts`. El motor entero de disponibilidad se sostiene hoy sobre esa rama: si el DROP del eje legacy llegara sin migrar este predicado, la disponibilidad del titular muere en las 8 puertas.

Nota de precisión: el grep dio 9 ocurrencias — 8 predicados reales + 1 en el **comentario** de `_inicios_disponibles_prestador` (*"el empleado, si su oferta lo habilita vía prestador_empleado_servicios"* — el comentario y el código coinciden).

## 2. `prestador_empleados` — la fila es del empleado, entera. El test PASÓ (para mal).

**Shape:** 16 columnas; las relevantes: `activo boolean NOT NULL DEFAULT true` · `rol text NOT NULL CHECK (rol = ANY (ARRAY['dueño','empleado']))` · más `modelo_pago`, `porcentaje_comision`, `datos_bancarios`, `prestador_id`, `user_id`.

**Triggers: CERO** (ninguno no-interno sobre la tabla). No hay protección de columnas estilo `_prestadores_protege_columnas` (D-389) acá.

**Grants:** `authenticated` tiene UPDATE **de tabla entera** — las 16 columnas listadas en `column_privileges`, incluidas `activo`, `rol`, `datos_bancarios`, `modelo_pago`, `porcentaje_comision`, y hasta `user_id`/`prestador_id`. No existe ningún grant por columna que angoste. (De paso: `anon` también figura con los 7 privilegios de tabla — la RLS lo frena porque `auth.uid()` es NULL, pero es la clase de grant heredado que L-140 documenta; queda registrado.)

**El test vivo** (DO block como el empleado desactivado real `2e989931…` / user `27f1e55f…`, la fila legacy más vieja con `activo=false`, `rol='empleado'`; identidad por `set_config` de JWT + role `authenticated`, salida por `RAISE EXCEPTION` incondicional):

```
antes:  activo=f  rol=empleado
T1 (UPDATE ... SET activo = true  WHERE id = propia):  rows=1, sin error
T2 (UPDATE ... SET rol = 'dueño' WHERE id = propia):   rows=1, sin error
releído con la misma identidad:  activo=t  rol=dueño
```

Residuo verificado después del run (nueva consulta, misma fila): `activo=false, rol='empleado'` — el rollback por excepción funcionó, cero escritura persistida.

**Respuesta a la pregunta: PASA, las dos.** `empleados_self_actualiza` (`USING`/`WITH CHECK` = `user_id = auth.uid()`, sin condición de `activo`, sin lista de columnas) + grant de tabla entera + cero triggers = **el empleado desactivado puede reactivarse solo (T1) y además escribirse `rol='dueño'` en su propia fila (T2)**. Las consecuencias, con las piezas ya fotografiadas en A0:

- **T1 — la desactivación es reversible por el desactivado:** `activo=true` lo devuelve a TODO lo que gatea por membresía activa — R1/`obtenerMiPrestador` (la puerta del arco), la rama empleado de las 3 policies de agenda, `user_puede_acceder_prestador` (mostrador), `_user_opera_cuenta_comercial` (cobro presencial), y la rama empleado de `empleado_tiene_rol`. El interruptor que el titular apaga desde `/negocio/equipo`, el empleado lo vuelve a prender por PostgREST directo.
- **T2 — peor que T1:** `rol='dueño'` en la fila propia hace que la rama legacy de los 8 predicados del punto 1 lo trate como dueño en el motor de disponibilidad, y que `titular.ts` (lector vivo de D-486) lo lea como EL TITULAR. Combinado con T1, un empleado desactivado se auto-eleva a titular-de-hecho sin tocar RLS de otras tablas.

**El alcance real, medido — NO toca lo clínico:** `empleado_tiene_rol` lee `empleado_roles` y `prestadores.user_id`; T2 escribe `prestador_empleados.rol`, que **no es ninguna de las dos**. La mudanza de roles a la tabla hija (S73) es lo que impide que esto sea catástrofe: el gate clínico (D-490) no se toca por esta vía.

**Forma del problema, en una línea:** DESVINCULAR NO DESVINCULA — el titular apaga desde `/negocio/equipo` y el desactivado se reactiva por PostgREST directo. La policy `empleados_self_actualiza` fue pensada para "editá tu perfil (nombre/foto/descripción)" pero al no acotar columnas deja escribir `activo` y `rol`, que son campos de gobierno, no de perfil.

**Hueco declarado, no resuelto:** el test corrió sobre `27f1e55f` (una de las 3 filas legacy desactivadas). ¿Alguna es persona real con credencial usable, o son seed? Si hay una real, esto es puerta abierta HOY, no riesgo futuro. Lectura pendiente.

Se deja fotografiado sin proponer cura (mandato A0bis). La forma que tendría —whitelist de columnas en el grant, o trigger de protección espejo de D-389, o mover `activo`/`rol` fuera del alcance de `_self`— es decisión de mesa.
