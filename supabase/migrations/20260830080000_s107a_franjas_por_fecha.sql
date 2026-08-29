/* ═══════════════════════════════════════════════════════════════════════════
   S107-A · LA VENTANA ES **LA DE ESE DÍA** — el min/max, corregido
   ═══════════════════════════════════════════════════════════════════════════

   ⏪ **DEFECTO PROPIO, de hace una hora.** La migración anterior hizo viajar las
   dos ventanas en la proyección (bien) **y las calculó con `min`/`max` sobre
   TODAS las franjas del lugar** (mal).

   ── 🔴 C LO MIDIÓ Y COLAPSA DE VERDAD: no era un borde ───────────────────
   **El índice es la prueba:** `uq_guarderia_franja (prestador_id, tipo,
   dias_semana)` **incluye los días** ⇒ **dos ventanas del mismo tipo SON EL
   DISEÑO**, no una rareza.

   > Un lugar con recogida **L-V 07:00–09:00** y **sábados 09:00–11:00** se
   > mostraba como **07:00–11:00**: *un rango que no ofrece ningún día.* Y a una
   > familia que mira un martes le decía que **recogen a las 10:30.**
   >
   > **No falla, no avisa, y suena razonable.**

   ── 🔴 LA CLASE, Y ES LA LECCIÓN: el criterio era correcto, la PREGUNTA no ─
   No inventé el `min`/`max`: lo tomé de `obtener_estado_guarderia`, **donde
   está BIEN** — ahí deriva **un lapso** de la configuración propia del
   prestador, y para un lapso el mínimo y el máximo *son* la respuesta.

   **La lista de la familia pregunta otra cosa:** *«¿a qué hora pasan a buscarlo
   ESE día?»* — y **un agregado sobre todos los días no describe ninguno.**

   > ### Trasplantar un criterio correcto a una pregunta que no es la suya es
   > cómo un número bien calculado termina diciendo algo falso.
   >
   > *Y es peor que inventarlo, porque viene con la autoridad de haber
   > funcionado en otro lado.* Ficha: `D-976`.

   ── LA CURA, más chica que las dos alternativas que ofrecí ───────────────
   **El lector YA recibe `p_fecha`.** Se le pasa al helper y las cuatro columnas
   salen de **la franja que RIGE PARA ESA FECHA**.

   · El día se resuelve con el **MISMO** criterio que `_guarderia_dia_operativo`
     —`EXTRACT(dow FROM fecha)::int = ANY(dias_semana)`—: **no se inventa una
     segunda convención de días** (dos convenciones de día es el próximo defecto
     de esta misma familia).
   · **Si para una misma fecha hay MÁS DE UNA franja, `min`/`max` vuelve a ser
     correcto** — ahí sí son ventanas del mismo día.
   · **Sin `p_fecha` las cuatro salen `NULL`**, no un envolvente. *Un agregado
     sobre todos los días no describe ninguno, y devolverlo igual sería repetir
     el defecto en el caso que nadie mira.*

   ⚠️ **Y NO se ofrecen las franjas una por una**, que era mi otra alternativa:
   C la rechazó bien — *obligaría a la pantalla a elegir cuál aplica, que es
   justo lo que el §⓪ del contrato del filtro prohíbe.*

   **76(g): NO RIGE.** Lectores.
   **Reversa:** `S107-A-REVERSA-franjas-por-fecha.sql` — **correrla reinstala el
   defecto** y lo dice.
   ═══════════════════════════════════════════════════════════════════════════ */

BEGIN;

DROP FUNCTION IF EXISTS public.obtener_guarderias_disponibles(date, uuid, double precision, double precision, text);
DROP FUNCTION IF EXISTS public._guarderia_ofertas_cobrables(uuid, text);

CREATE FUNCTION public._guarderia_ofertas_cobrables(p_mascota_id uuid, p_modalidad text DEFAULT NULL::text, p_fecha date DEFAULT NULL::date)
 RETURNS TABLE(prestador_id uuid, prestador_servicio_id uuid, prestador_nombre text, precio numeric, precio_paquete numeric, precio_mensual numeric, jornada_minutos integer, direccion text, ciudad text, modalidad text, precio_modalidad numeric, recoge_desde time without time zone, recoge_hasta time without time zone, devuelve_desde time without time zone, devuelve_hasta time without time zone)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
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
         END,
         /* LAS DOS VENTANAS — `min`/`max` sobre las franjas ACTIVAS del lugar.
            Índice `(prestador_id, tipo, dias_semana)`: entra por el prefijo. */
         /* 🔴 LA VENTANA **DE ESE DÍA**, no el envolvente de todos.
            El día se resuelve con el MISMO criterio que `_guarderia_dia_operativo`
            —`EXTRACT(dow FROM fecha) = ANY(dias_semana)`—, que es el que la casa
            ya firmó: no se inventa una segunda convención de días.
            **Sin `p_fecha` las cuatro salen `NULL`**, que es lo honesto: *un
            agregado sobre todos los días no describe ninguno.* */
         (SELECT min(f.desde) FROM guarderia_franjas f
           WHERE f.prestador_id = pr.id AND f.tipo = 'recogida' AND f.activo
             AND p_fecha IS NOT NULL AND EXTRACT(dow FROM p_fecha)::int = ANY(f.dias_semana)),
         (SELECT max(f.hasta) FROM guarderia_franjas f
           WHERE f.prestador_id = pr.id AND f.tipo = 'recogida' AND f.activo
             AND p_fecha IS NOT NULL AND EXTRACT(dow FROM p_fecha)::int = ANY(f.dias_semana)),
         (SELECT min(f.desde) FROM guarderia_franjas f
           WHERE f.prestador_id = pr.id AND f.tipo = 'devolucion' AND f.activo
             AND p_fecha IS NOT NULL AND EXTRACT(dow FROM p_fecha)::int = ANY(f.dias_semana)),
         (SELECT max(f.hasta) FROM guarderia_franjas f
           WHERE f.prestador_id = pr.id AND f.tipo = 'devolucion' AND f.activo
             AND p_fecha IS NOT NULL AND EXTRACT(dow FROM p_fecha)::int = ANY(f.dias_semana))
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
$function$
;

CREATE FUNCTION public.obtener_guarderias_disponibles(p_fecha date, p_mascota_id uuid, p_lat double precision DEFAULT NULL::double precision, p_lon double precision DEFAULT NULL::double precision, p_modalidad text DEFAULT NULL::text)
 RETURNS TABLE(prestador_id uuid, prestador_servicio_id uuid, prestador_nombre text, precio numeric, precio_paquete numeric, precio_mensual numeric, jornada_minutos integer, direccion text, ciudad text, disponible integer, sobrevendido boolean, modalidad text, precio_modalidad numeric, recoge_desde time without time zone, recoge_hasta time without time zone, devuelve_desde time without time zone, devuelve_hasta time without time zone)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
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
         o.modalidad, o.precio_modalidad,
         o.recoge_desde, o.recoge_hasta, o.devuelve_desde, o.devuelve_hasta
    FROM _guarderia_ofertas_cobrables(p_mascota_id, p_modalidad, p_fecha) o
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
END $function$
;

REVOKE EXECUTE ON FUNCTION public._guarderia_ofertas_cobrables(uuid,text,date) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.obtener_guarderias_disponibles(date,uuid,double precision,double precision,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.obtener_guarderias_disponibles(date,uuid,double precision,double precision,text) TO authenticated;

DO $cint$
DECLARE
  v_rol text := current_user; v_masc uuid; v_duenio uuid; v_prest uuid;
  v_lunes date; v_sabado date; v_r record; v_sob int;
BEGIN
  SELECT count(*) INTO v_sob FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
   WHERE n.nspname='public' AND p.proname IN ('_guarderia_ofertas_cobrables','obtener_guarderias_disponibles');
  IF v_sob <> 2 THEN RAISE EXCEPTION 'CINTURON (1): % firmas vivas, esperaba 2 (L-119)', v_sob; END IF;

  SELECT c.mascota_id, c.user_id INTO v_masc, v_duenio
    FROM evento_cita_servicio c JOIN mascotas m ON m.id = c.mascota_id
   WHERE m.especie IN ('perro','gato') AND c.user_id IS NOT NULL LIMIT 1;
  SELECT prestador_id INTO v_prest FROM prestador_servicios WHERE tipo_servicio='guarderia_dia' LIMIT 1;

  -- el próximo lunes y el próximo sábado, a partir de mañana
  SELECT min(d)::date INTO v_lunes  FROM generate_series(public.hoy_local()+1, public.hoy_local()+9, '1 day') d
   WHERE EXTRACT(dow FROM d)::int = 1;
  SELECT min(d)::date INTO v_sabado FROM generate_series(public.hoy_local()+1, public.hoy_local()+9, '1 day') d
   WHERE EXTRACT(dow FROM d)::int = 6;

  BEGIN   -- subtransacción que se deshace sola
    /* 🔴 SE FABRICA EL CASO QUE C DESCRIBIÓ: una segunda ventana de recogida,
       SÓLO sábados, más tarde. Con el defecto viejo el lunes habría dicho
       07:00-11:00; con la cura tiene que decir 07:00-09:00. */
    INSERT INTO guarderia_franjas (prestador_id, tipo, desde, hasta, dias_semana, activo)
    VALUES (v_prest, 'recogida', '09:00', '11:00', ARRAY[6], true);
    -- y el sábado tiene que ser día operativo para que aparezca
    UPDATE guarderia_espacios SET dias_operacion = ARRAY[1,2,3,4,5,6]
     WHERE prestador_id = v_prest;

    EXECUTE format('SET LOCAL request.jwt.claims = %L',
                   json_build_object('sub', v_duenio, 'role','authenticated')::text);
    SET LOCAL ROLE authenticated;
    SELECT * INTO v_r FROM public.obtener_guarderias_disponibles(v_lunes, v_masc, NULL, NULL, 'dia') LIMIT 1;
    EXECUTE format('SET LOCAL ROLE %I', v_rol);

    IF v_r.recoge_desde IS NULL THEN
      RAISE EXCEPTION 'CINTURON (2): el lunes no trajo ventana';
    END IF;
    /* EL DISCRIMINADOR: con el min/max viejo esto era 11:00. */
    IF v_r.recoge_hasta <> TIME '09:00' THEN
      RAISE EXCEPTION 'CINTURON (3): EL DEFECTO SIGUE — el lunes dice que recogen hasta las %, y la ventana del sabado no rige ese dia', v_r.recoge_hasta;
    END IF;

    EXECUTE format('SET LOCAL request.jwt.claims = %L',
                   json_build_object('sub', v_duenio, 'role','authenticated')::text);
    SET LOCAL ROLE authenticated;
    SELECT * INTO v_r FROM public.obtener_guarderias_disponibles(v_sabado, v_masc, NULL, NULL, 'dia') LIMIT 1;
    EXECUTE format('SET LOCAL ROLE %I', v_rol);

    /* Y EL OTRO BRAZO: el sábado tiene que decir SU ventana, no la del lunes.
       Sin esto, un lector que devolviera siempre la primera pasaria (3). */
    IF v_r.recoge_desde <> TIME '09:00' OR v_r.recoge_hasta <> TIME '11:00' THEN
      RAISE EXCEPTION 'CINTURON (4): el sabado dice %-%, esperaba 09:00-11:00', v_r.recoge_desde, v_r.recoge_hasta;
    END IF;

    RAISE EXCEPTION 'CINTURON_OK_ROLLBACK';
  EXCEPTION
    WHEN OTHERS THEN
      EXECUTE format('SET LOCAL ROLE %I', v_rol);
      IF SQLERRM <> 'CINTURON_OK_ROLLBACK' THEN RAISE; END IF;
  END;

  RAISE NOTICE 'CINTURON VERDE · lunes 07:00-09:00 y sabado 09:00-11:00 — cada dia dice SU ventana, con las dos franjas vivas a la vez';
END
$cint$;

COMMIT;
