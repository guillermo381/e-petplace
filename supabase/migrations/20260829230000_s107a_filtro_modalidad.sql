/* ═══════════════════════════════════════════════════════════════════════════
   S107-A · EL FILTRO POR MODALIDAD — y la cura del guard que escondía lugares
   ═══════════════════════════════════════════════════════════════════════════

   **Firma del founder:** *la modalidad es un FILTRO y va PRIMERO.*
   `modalidad → día → ver quién puede → elegir lugar → pagar`.
   Contrato publicado: `docs/contratos/s107-contrato-filtro-por-modalidad.md`.

   ── 🔴 EL DEFECTO QUE ESTA MIGRACIÓN CURA, y no daba error ───────────────
   `_guarderia_ofertas_cobrables` exigía **`ps.precio IS NOT NULL AND > 0`** —
   el precio del **día**. Pero la mesa firmó el 29-ago que **el precio del día
   es OPCIONAL** (`chk_precio_obligatorio_salvo_guarderia`).

   > ### ⇒ Un lugar que ofreciera **sólo paquete** o **sólo mensual** no aparecía
   > en ninguna parte — **ni siquiera para la modalidad que sí ofrece.**
   >
   > *Y no fallaba: devolvía una lista más corta. El lugar simplemente no
   > existía para nadie.* Hoy no se ve porque el único publicado tiene los tres
   > precios — **el defecto estaba esperando al segundo prestador.**

   ── ⚠️ POR QUÉ MOVER ESE GUARD NO ABRE UNA PUERTA A «GRATIS» (medido) ────
   La pregunta obligada era si al aflojar el guard alguien podía reservar un día
   sin precio. **No: `reservar_dia_guarderia` NO usa este helper y tiene su
   propio guard** —`IF v_ps.precio IS NULL THEN RAISE 'no_ofrece_dia_suelto'`—
   verificado en su cuerpo. *La reserva se defiende sola; el helper sólo decide
   quién se muestra.*

   ── LA FORMA ─────────────────────────────────────────────────────────────
   `p_modalidad` es **NULLABLE con default NULL**, y `NULL` = *«el lugar ofrece
   ALGO»*. **Así la firma vieja de 4 argumentos sigue funcionando** y la pantalla
   de C enciende su selector cuando quiera, sin un despliegue coordinado.
   *Un cambio de contrato que obliga a mover dos piezas a la vez es cómo se
   rompe una pantalla en producción.*

   🔴 **L-119: las dos funciones cambian de firma ⇒ DROP explícito.** Un
   `CREATE OR REPLACE` con firma distinta **no reemplaza: crea sobrecarga y deja
   la vieja zombi.**

   **76(g): NO RIGE.** Sin backfill, sin anclas.
   **Reversa:** `S107-A-REVERSA-filtro-modalidad.sql` — declara que **correrla
   reinstala el defecto** y que rompe a quien ya llame con `p_modalidad`.
   ═══════════════════════════════════════════════════════════════════════════ */

BEGIN;

DROP FUNCTION IF EXISTS public.obtener_guarderias_disponibles(date, uuid, double precision, double precision);
DROP FUNCTION IF EXISTS public._guarderia_ofertas_cobrables(uuid);

-- ══ ① EL HELPER — el guard de precio pasa a ser POR MODALIDAD ════════════
CREATE FUNCTION public._guarderia_ofertas_cobrables(
  p_mascota_id uuid, p_modalidad text DEFAULT NULL)
RETURNS TABLE(prestador_id uuid, prestador_servicio_id uuid, prestador_nombre text,
              precio numeric, precio_paquete numeric, precio_mensual numeric,
              jornada_minutos integer, direccion text, ciudad text,
              modalidad text, precio_modalidad numeric)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $fn$
  SELECT pr.id, ps.id, pr.nombre_comercial,
         ps.precio, ps.precio_paquete, ps.precio_mensual_plan,
         ps.duracion_minutos, pr.direccion, pr.ciudad,
         p_modalidad,
         /* El precio DE LA MODALIDAD, ya resuelto. La pantalla no elige entre
            tres: si eligiera, podría mostrar uno y cobrar otro.
            🔴 Para paquete manda la TABLA `guarderia_paquetes` (la que el
            taller escribe y la que admite 5·10·15), jamás la columna
            `ps.precio_paquete`, que es del molde de otro oficio. */
         CASE p_modalidad
           WHEN 'dia'     THEN ps.precio
           WHEN 'mensual' THEN ps.precio_mensual_plan
           WHEN 'paquete' THEN (SELECT min(gp.precio) FROM guarderia_paquetes gp
                                 WHERE gp.prestador_id = pr.id AND gp.activo)
           ELSE NULL
         END
    FROM mascotas m
    CROSS JOIN prestador_servicios ps
    JOIN prestadores pr         ON pr.id = ps.prestador_id AND pr.estado = 'activo'
    -- Regla founder S54 / 7.13: no se oferta quien no puede cobrar.
    JOIN cuentas_comerciales cc ON cc.id = pr.cuenta_comercial_id AND cc.estado = 'activa'
    JOIN tipos_servicio ts      ON ts.codigo = ps.tipo_servicio AND ts.activo AND ts.reservable
   WHERE m.id = p_mascota_id
     AND ps.tipo_servicio = 'guarderia_dia'
     AND ps.activo AND ps.reservable
     AND ps.duracion_minutos IS NOT NULL AND ps.duracion_minutos > 0
     -- el prestador ACOTA; NULL = rige el techo del tipo (patrón §5 grooming)
     AND (ps.especies_compatibles IS NULL OR ps.especies_compatibles ? m.especie)
     /* ⏪ ACÁ VIVÍA `ps.precio IS NOT NULL AND ps.precio > 0`, que escondía a
        quien no vende el día suelto. Ahora se exige el precio de LA MODALIDAD
        pedida — y sin modalidad, que ofrezca AL MENOS UNA. */
     AND CASE p_modalidad
           WHEN 'dia'     THEN ps.precio IS NOT NULL AND ps.precio > 0
           WHEN 'mensual' THEN ps.precio_mensual_plan IS NOT NULL AND ps.precio_mensual_plan > 0
           WHEN 'paquete' THEN EXISTS (SELECT 1 FROM guarderia_paquetes gp
                                        WHERE gp.prestador_id = pr.id AND gp.activo)
           ELSE (ps.precio IS NOT NULL AND ps.precio > 0)
             OR (ps.precio_mensual_plan IS NOT NULL AND ps.precio_mensual_plan > 0)
             OR EXISTS (SELECT 1 FROM guarderia_paquetes gp
                         WHERE gp.prestador_id = pr.id AND gp.activo)
         END;
$fn$;

-- ══ ② EL LECTOR ══════════════════════════════════════════════════════════
CREATE FUNCTION public.obtener_guarderias_disponibles(
  p_fecha date, p_mascota_id uuid,
  p_lat double precision DEFAULT NULL, p_lon double precision DEFAULT NULL,
  p_modalidad text DEFAULT NULL)
RETURNS TABLE(prestador_id uuid, prestador_servicio_id uuid, prestador_nombre text,
              precio numeric, precio_paquete numeric, precio_mensual numeric,
              jornada_minutos integer, direccion text, ciudad text,
              disponible integer, sobrevendido boolean,
              modalidad text, precio_modalidad numeric)
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $fn$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501'; END IF;
  IF p_fecha IS NULL OR p_mascota_id IS NULL THEN
    RAISE EXCEPTION 'ventana_invalida' USING ERRCODE = '22023';
  END IF;
  IF p_modalidad IS NOT NULL AND p_modalidad NOT IN ('dia','paquete','mensual') THEN
    RAISE EXCEPTION 'modalidad_invalida' USING ERRCODE = '22023';
  END IF;
  IF NOT user_tiene_acceso_a_mascota(p_mascota_id) THEN
    RAISE EXCEPTION 'no_access_to_mascota' USING ERRCODE = '42501';
  END IF;
  IF NOT _mascota_elegible_servicio(p_mascota_id, 'guarderia_dia') THEN
    RAISE EXCEPTION 'mascota_no_elegible' USING ERRCODE = '22023';
  END IF;
  -- 🔴 hoy tampoco: el primer día ofertable es mañana en adelante (la víspera).
  IF p_fecha <= public.hoy_local() THEN RETURN; END IF;

  RETURN QUERY
  SELECT o.prestador_id, o.prestador_servicio_id, o.prestador_nombre,
         o.precio, o.precio_paquete, o.precio_mensual,
         o.jornada_minutos, o.direccion, o.ciudad,
         (c->>'disponible')::int, (c->>'sobrevendido')::boolean,
         o.modalidad, o.precio_modalidad
    FROM _guarderia_ofertas_cobrables(p_mascota_id, p_modalidad) o
    CROSS JOIN LATERAL public.cupo_guarderia_del_dia(o.prestador_id, p_fecha) c
   WHERE (
       p_lat IS NULL OR p_lon IS NULL
       OR EXISTS (
         SELECT 1 FROM prestadores geo
          WHERE geo.id = o.prestador_id
            AND geo.lat IS NOT NULL AND geo.lon IS NOT NULL
            AND geo.radio_cobertura_km IS NOT NULL
            AND 2 * 6371 * asin(sqrt(
                  power(sin(radians((geo.lat - p_lat) / 2)), 2)
                  + cos(radians(p_lat)) * cos(radians(geo.lat))
                    * power(sin(radians((geo.lon - p_lon) / 2)), 2)
                )) <= geo.radio_cobertura_km))
     AND (c->>'disponible')::int > 0
     AND public._guarderia_dia_operativo(o.prestador_id, p_fecha)
   /* Con modalidad ordena por SU precio; sin ella, por el del día como antes. */
   ORDER BY COALESCE(o.precio_modalidad, o.precio), o.prestador_nombre;
END $fn$;

REVOKE EXECUTE ON FUNCTION public._guarderia_ofertas_cobrables(uuid,text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.obtener_guarderias_disponibles(date,uuid,double precision,double precision,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.obtener_guarderias_disponibles(date,uuid,double precision,double precision,text) TO authenticated;

-- ══ ③ CINTURÓN — el discriminador es EL LUGAR ESCONDIDO ══════════════════
DO $cint$
DECLARE
  v_rol text := current_user;
  v_masc uuid; v_duenio uuid; v_prest uuid; v_fecha date := public.hoy_local() + 3;
  v_n_dia int; v_n_mens int; v_n_null int;
BEGIN
  -- una mascota elegible y su dueño (no se inventan: se buscan)
  SELECT c.mascota_id, c.user_id INTO v_masc, v_duenio
    FROM evento_cita_servicio c JOIN mascotas m ON m.id = c.mascota_id
   WHERE m.especie IN ('perro','gato') AND c.user_id IS NOT NULL LIMIT 1;
  SELECT prestador_id INTO v_prest FROM prestador_servicios WHERE tipo_servicio='guarderia_dia' LIMIT 1;
  IF v_masc IS NULL OR v_prest IS NULL THEN
    RAISE EXCEPTION 'CINTURON: sin mascota elegible o sin prestador para el arnes';
  END IF;

  BEGIN   -- subtransacción que se deshace sola (L-406)
    /* 🔴 EL CASO QUE ANTES ERA INVISIBLE: un lugar SIN precio de día.
       Se fabrica acá y se deshace — no se espera al segundo prestador real. */
    UPDATE prestador_servicios SET precio = NULL
     WHERE prestador_id = v_prest AND tipo_servicio = 'guarderia_dia';

    EXECUTE format('SET LOCAL request.jwt.claims = %L',
                   json_build_object('sub', v_duenio, 'role','authenticated')::text);
    SET LOCAL ROLE authenticated;

    SELECT count(*) INTO v_n_dia  FROM public.obtener_guarderias_disponibles(v_fecha, v_masc, NULL, NULL, 'dia');
    SELECT count(*) INTO v_n_mens FROM public.obtener_guarderias_disponibles(v_fecha, v_masc, NULL, NULL, 'mensual');
    SELECT count(*) INTO v_n_null FROM public.obtener_guarderias_disponibles(v_fecha, v_masc, NULL, NULL, NULL);

    EXECUTE format('SET LOCAL ROLE %I', v_rol);

    -- (a) sin precio de día, la modalidad 'dia' NO lo ofrece
    IF v_n_dia <> 0 THEN
      RAISE EXCEPTION 'CINTURON (a): un lugar SIN precio de dia se ofrecio para modalidad dia (n=%)', v_n_dia;
    END IF;
    -- (b) 🔴 LA CURA: para 'mensual' SÍ aparece. **Antes NO aparecía.**
    IF v_n_mens < 1 THEN
      RAISE EXCEPTION 'CINTURON (b): EL DEFECTO SIGUE — un lugar de solo-mensual no aparece ni para mensual (n=%)', v_n_mens;
    END IF;
    -- (c) y sin modalidad tampoco desaparece: ofrece ALGO
    IF v_n_null < 1 THEN
      RAISE EXCEPTION 'CINTURON (c): sin modalidad el lugar desaparecio (n=%)', v_n_null;
    END IF;

    RAISE EXCEPTION 'CINTURON_OK_ROLLBACK';
  EXCEPTION
    WHEN OTHERS THEN
      EXECUTE format('SET LOCAL ROLE %I', v_rol);
      IF SQLERRM <> 'CINTURON_OK_ROLLBACK' THEN RAISE; END IF;
  END;

  RAISE NOTICE 'CINTURON VERDE · el lugar sin precio de dia: invisible para dia (0), VISIBLE para mensual y sin modalidad — el defecto estaba y ya no esta';
END
$cint$;

COMMIT;
