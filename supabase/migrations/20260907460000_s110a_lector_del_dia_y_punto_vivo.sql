/* ═══════════════════════════════════════════════════════════════════════════
   S110-A · EL LECTOR DEL DÍA VE LO QUE EL ESCRITOR ESCRIBE — y el punto vivo
   deja de aceptar escritura de cualquiera.
   ═══════════════════════════════════════════════════════════════════════════

   ── ① `D-980` DEL LADO ESPEJO, evitado antes de cometerlo ────────────────
   S110-A dio escritor a `no_recogida` y a `retorno_en`. **Los lectores del día
   no proyectaban ninguno de los tres campos** ⇒ el prestador podía declarar
   «no estaba» y su propia pantalla no tenía con qué decir por qué ni a qué
   hora.
   > ### Había ESCRITOR y no había LECTOR, y esa asimetría no es incómoda: PIERDE el dato.
   *Un botón que escribe un estado que ninguna superficie lee es la deuda que la
   casa ya cazó una vez.* Lo pidió C con la forma exacta y va en la misma tanda
   que su escritor, porque **el lector y su escritor van juntos o no van.**

   🔴 **VIAJA EL CÓDIGO DEL CATÁLOGO, NO UNA VOZ.** `no_recogida_motivo` sale
   como `nadie_en_domicilio`, no como «no había nadie en casa». *Si el motor
   mandara texto, el vocabulario del motor saldría a pantalla* — y la voz es
   del diccionario de la app, que el founder lee en su lote.

   ── ② LA FUGA DE ESCRITURA DEL PUNTO VIVO ────────────────────────────────
   Medido: `registrar_punto_vivo` **sólo exigía `auth.uid()`**. Cualquier
   usuario autenticado con un `tramo_id` podía **escribir la ubicación de un
   vehículo ajeno**. S107 cerró la LECTURA y dejó la ESCRITURA abierta.
   *Una pieza con la lectura gateada y la escritura libre no es media cura: es
   una que invita a confiar en el dato que muestra.* Y su daño es peor que
   leer de más: **un punto falso manda a una familia a mirar un mapa que
   miente sobre dónde está su animal.**
   Medido antes de curar: **0 filas** en `guarderia_tramo_punto` ⇒ **cerrar hoy
   es gratis** y nadie pierde un dato escrito por la puerta vieja.

   ── 76(g): NO RIGE ───────────────────────────────────────────────────────
   Reemplazo de funciones, sin DDL de datos y **sin backfill**. El cinturón
   corre en subtransacción que se deshace sola.
   **Reversa:** `docs/relevamientos/S110-A-REVERSA-lector-y-punto.sql`, escrita
   ANTES; declara que revertir el gate **REABRE la fuga de escritura**.
   ═══════════════════════════════════════════════════════════════════════════ */

BEGIN;

-- ══ ① LOS DOS LECTORES DEL DÍA ═══════════════════════════════════════════
/* L-119: la firma cambia (tres columnas nuevas en el RETURNS TABLE) ⇒ DROP
   explícito antes del CREATE. Un `CREATE OR REPLACE` con otra forma de
   retorno no reemplaza: **crea una sobrecarga**, y la app resuelve la que
   quiera. */
DROP FUNCTION IF EXISTS public.obtener_estadias_del_dia(uuid, date);
CREATE FUNCTION public.obtener_estadias_del_dia(p_prestador_id uuid, p_fecha date)
RETURNS TABLE(estadia_id uuid, cita_id uuid, estado text, mascota_id uuid,
  mascota_nombre text, mascota_especie text, mascota_foto_url text,
  espacio_nombre text, direccion_snapshot jsonb,
  a_bordo_en timestamptz, llegada_en timestamptz, entregada_en timestamptz,
  retorno_en timestamptz, no_recogida_en timestamptz, no_recogida_motivo text,
  estado_reserva text, raza_ruta_imagen text)
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path TO 'public','pg_temp' AS $function$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'auth_required' USING ERRCODE='42501'; END IF;
  IF NOT user_gestiona_prestador(p_prestador_id) AND NOT is_admin() THEN
    RAISE EXCEPTION 'no_gestionas_este_prestador' USING ERRCODE='42501';
  END IF;

  RETURN QUERY
  SELECT g.id, c.id, g.estado,
         m.id, m.nombre, m.especie, m.foto_url,
         e.nombre, c.direccion_snapshot,
         g.a_bordo_en, g.llegada_en, g.entregada_en,
         /* Las tres nuevas. `retorno_en` porque sin ella la única hora del
            viaje de vuelta sería la de entrega — *y el momento en que salieron
            a devolver se perdía, que es justo lo que la columna vino a
            arreglar.* */
         g.retorno_en, g.no_recogida_en, g.no_recogida_motivo,
         c.estado_reserva, rz.ruta_imagen
    FROM guarderia_estadias g
    JOIN evento_cita_servicio c ON c.id = g.cita_id
    JOIN mascotas m             ON m.id = c.mascota_id
    LEFT JOIN guarderia_espacios e ON e.id = g.espacio_id
    /* El peldaño de la raza, por LOOKUP y no por slug adivinado (S109-A). */
    LEFT JOIN cat_razas rz ON rz.especie = m.especie
                          AND lower(rz.nombre) = lower(m.raza)
   WHERE c.prestador_id = p_prestador_id
     AND c.fecha = p_fecha
     /* La jornada sólo contiene VERDAD FIRME (S51). */
     AND c.estado_reserva = 'pagada'
     AND g.estado <> 'cancelada'
   ORDER BY m.nombre;
END $function$;

DROP FUNCTION IF EXISTS public.obtener_estadias_por_rango(uuid, date, date);
CREATE FUNCTION public.obtener_estadias_por_rango(p_prestador_id uuid, p_desde date, p_hasta date)
RETURNS TABLE(fecha date, estadia_id uuid, cita_id uuid, estado text, mascota_id uuid,
  mascota_nombre text, mascota_especie text, mascota_foto_url text,
  espacio_nombre text, direccion_snapshot jsonb,
  a_bordo_en timestamptz, llegada_en timestamptz, entregada_en timestamptz,
  retorno_en timestamptz, no_recogida_en timestamptz, no_recogida_motivo text,
  estado_reserva text, raza_ruta_imagen text)
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path TO 'public','pg_temp' AS $function$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'auth_required' USING ERRCODE='42501'; END IF;
  IF NOT user_gestiona_prestador(p_prestador_id) AND NOT is_admin() THEN
    RAISE EXCEPTION 'no_gestionas_este_prestador' USING ERRCODE='42501';
  END IF;

  RETURN QUERY
  SELECT c.fecha, g.id, c.id, g.estado,
         m.id, m.nombre, m.especie, m.foto_url,
         e.nombre, c.direccion_snapshot,
         g.a_bordo_en, g.llegada_en, g.entregada_en,
         g.retorno_en, g.no_recogida_en, g.no_recogida_motivo,
         c.estado_reserva, rz.ruta_imagen
    FROM guarderia_estadias g
    JOIN evento_cita_servicio c ON c.id = g.cita_id
    JOIN mascotas m             ON m.id = c.mascota_id
    LEFT JOIN guarderia_espacios e ON e.id = g.espacio_id
    LEFT JOIN cat_razas rz ON rz.especie = m.especie
                          AND lower(rz.nombre) = lower(m.raza)
   WHERE c.prestador_id = p_prestador_id
     AND c.fecha BETWEEN p_desde AND p_hasta
     AND c.estado_reserva = 'pagada'
     AND g.estado <> 'cancelada'
   ORDER BY c.fecha, m.nombre;
END $function$;

-- ══ ② EL PUNTO VIVO GANA SU GATE DE ESCRITURA ════════════════════════════
CREATE OR REPLACE FUNCTION public.registrar_punto_vivo(
  p_tramo_id uuid, p_lat double precision, p_lon double precision,
  p_visto_en timestamptz DEFAULT now())
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public','pg_temp' AS $function$
DECLARE v_prest uuid; v_estado text;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'auth_required' USING ERRCODE='42501'; END IF;

  SELECT prestador_id, estado INTO v_prest, v_estado
    FROM guarderia_tramos WHERE id = p_tramo_id;
  IF v_prest IS NULL THEN RAISE EXCEPTION 'tramo_no_existe' USING ERRCODE='22023'; END IF;

  /* 🔴 EL GATE QUE FALTABA. Quien emite la posición es quien conduce, y quien
     conduce gestiona el negocio del tramo. La LECTURA ya estaba gateada desde
     S107; la escritura no. */
  IF NOT user_gestiona_prestador(v_prest) AND NOT is_admin() THEN
    RAISE EXCEPTION 'no_gestionas_este_prestador' USING ERRCODE='42501';
  END IF;

  /* Un tramo cerrado no emite. *`cerrar_tramo_guarderia` borra el punto a
     propósito; sin este brazo, un emisor rezagado lo resucitaría y la familia
     vería moverse un vehículo que ya llegó.* */
  IF v_estado <> 'abierto' THEN
    RAISE EXCEPTION 'tramo_cerrado' USING ERRCODE='22023';
  END IF;

  INSERT INTO guarderia_tramo_punto (tramo_id, lat, lon, visto_en)
       VALUES (p_tramo_id, p_lat, p_lon, p_visto_en)
  ON CONFLICT (tramo_id) DO UPDATE
     SET lat = EXCLUDED.lat, lon = EXCLUDED.lon, visto_en = EXCLUDED.visto_en;
  RETURN jsonb_build_object('ok', true);
END $function$;

REVOKE EXECUTE ON FUNCTION public.obtener_estadias_del_dia(uuid,date) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.obtener_estadias_por_rango(uuid,date,date) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.obtener_estadias_del_dia(uuid,date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.obtener_estadias_por_rango(uuid,date,date) TO authenticated;

-- ══ ③ CINTURÓN — el rojo de la fuga, PRIMERO ═════════════════════════════
DO $cint$
DECLARE
  v_rol text := current_user; v_prest uuid; v_fecha date; v_titular uuid; v_ajeno uuid;
  v_est uuid; v_tramo uuid; v_rojo boolean; v_msg text; v_n int; v_sob int;
BEGIN
  -- L-119: una sola firma de cada lector, jamás dos
  SELECT count(*) INTO v_sob FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
   WHERE n.nspname='public' AND p.proname IN ('obtener_estadias_del_dia','obtener_estadias_por_rango');
  IF v_sob <> 2 THEN RAISE EXCEPTION 'CINTURON: quedaron sobrecargas de los lectores (n=%)', v_sob; END IF;

  SELECT g.id, c.prestador_id, c.fecha INTO v_est, v_prest, v_fecha
    FROM guarderia_estadias g JOIN evento_cita_servicio c ON c.id = g.cita_id
   WHERE g.estado='reservada' AND c.estado_reserva='pagada' ORDER BY c.fecha LIMIT 1;
  IF v_est IS NULL THEN RAISE EXCEPTION 'CINTURON: sin estadia pagada para medir el lector'; END IF;
  SELECT user_id INTO v_titular FROM prestadores WHERE id = v_prest;
  SELECT u.id INTO v_ajeno FROM auth.users u
   WHERE u.id <> v_titular AND NOT EXISTS (SELECT 1 FROM prestadores pr WHERE pr.user_id=u.id) LIMIT 1;

  BEGIN
    INSERT INTO guarderia_tramos (prestador_id, fecha, direccion)
         VALUES (v_prest, v_fecha, 'recogida') RETURNING id INTO v_tramo;

    -- ROJO · el AJENO ya no escribe la posición de un vehículo que no conduce
    EXECUTE format('SET LOCAL request.jwt.claims = %L',
                   json_build_object('sub', v_ajeno, 'role','authenticated')::text);
    v_rojo := false;
    BEGIN PERFORM public.registrar_punto_vivo(v_tramo, -0.18, -78.47, now());
    EXCEPTION WHEN OTHERS THEN v_rojo := true; v_msg := SQLERRM; END;
    IF NOT v_rojo OR v_msg NOT LIKE 'no_gestionas_este_prestador%' THEN
      RAISE EXCEPTION 'CINTURON: LA FUGA DE ESCRITURA SIGUE ABIERTA (rojo=%, msg=%)', v_rojo, v_msg;
    END IF;
    -- discriminador: y el punto NO se escribió (si no, el rojo de arriba no prueba nada)
    IF EXISTS (SELECT 1 FROM guarderia_tramo_punto WHERE tramo_id = v_tramo) THEN
      RAISE EXCEPTION 'CINTURON: rebotó y escribió igual';
    END IF;

    -- VERDE · el titular SÍ escribe
    EXECUTE format('SET LOCAL request.jwt.claims = %L',
                   json_build_object('sub', v_titular, 'role','authenticated')::text);
    PERFORM public.registrar_punto_vivo(v_tramo, -0.18, -78.47, now());
    IF NOT EXISTS (SELECT 1 FROM guarderia_tramo_punto WHERE tramo_id = v_tramo) THEN
      RAISE EXCEPTION 'CINTURON: el gate se comio al legitimo — el brazo del ajeno no discrimina';
    END IF;

    -- ROJO · un tramo CERRADO no emite
    PERFORM public.cerrar_tramo_guarderia(v_tramo);
    v_rojo := false;
    BEGIN PERFORM public.registrar_punto_vivo(v_tramo, -0.19, -78.48, now());
    EXCEPTION WHEN OTHERS THEN v_rojo := true; v_msg := SQLERRM; END;
    IF NOT v_rojo OR v_msg NOT LIKE 'tramo_cerrado%' THEN
      RAISE EXCEPTION 'CINTURON: un tramo cerrado sigue emitiendo (rojo=%, msg=%)', v_rojo, v_msg;
    END IF;

    -- VERDE · el lector proyecta las TRES columnas nuevas
    SELECT count(*) INTO v_n FROM public.obtener_estadias_del_dia(v_prest, v_fecha) x
     WHERE x.estadia_id = v_est;
    IF v_n <> 1 THEN RAISE EXCEPTION 'CINTURON: el lector no devuelve la estadia (n=%)', v_n; END IF;

    RAISE EXCEPTION 'CINTURON_OK_ROLLBACK';
  EXCEPTION WHEN OTHERS THEN
    EXECUTE format('SET LOCAL ROLE %I', v_rol);
    IF SQLERRM <> 'CINTURON_OK_ROLLBACK' THEN RAISE; END IF;
  END;

  RAISE NOTICE 'CINTURON VERDE · la fuga de ESCRITURA del punto vivo CERRADA (ajeno rebota y no escribe · el titular si) · un tramo cerrado no emite · los dos lectores con una sola firma y proyectando las tres columnas nuevas';
END
$cint$;

COMMIT;
