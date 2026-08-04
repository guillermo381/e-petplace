-- ─────────────────────────────────────────────────────────────────────
-- REVERSA de `20260804160000_s86_lectores_datos_negocio.sql`
-- Escrita ANTES de aplicar la migración (regla de la casa).
--
-- QUÉ REVIERTE: los lectores del dashboard de DATOS (S86-A, lámina
-- firmada 4-ago-2026) y el helper del predicado contable.
--
-- ⚠️ AVISO PROPIO DE ESTA REVERSA — LEER ANTES DE CORRERLA:
-- la migración NO solo agrega: también REESCRIBE `obtener_plata_del_dia`
-- para que consuma el helper `_estados_cita_contables()` en vez de
-- llevar la lista de estados escrita adentro. Revertir el helper SIN
-- reponer el cuerpo viejo de `obtener_plata_del_dia` deja la portada del
-- prestador ROTA (función inexistente en tiempo de ejecución).
--
-- Por eso esta reversa REPONE el cuerpo de S85 VERBATIM. Si algún día
-- `obtener_plata_del_dia` cambia por otra vía, esta reversa queda vieja
-- y hay que re-leerla antes de usarla (L-166: el dato se lee al momento
-- de usarlo).
--
-- LO QUE REVERTIR NO DESHACE: nada de datos. Estos lectores son STABLE
-- y no escriben una sola fila — revertir solo quita capacidad de leer.
-- ─────────────────────────────────────────────────────────────────────

BEGIN;

DROP FUNCTION IF EXISTS public.obtener_datos_negocio(uuid, date);

-- Reponer `obtener_plata_del_dia` TAL CUAL vivía al cierre de S85, con
-- su lista de estados adentro (el estado previo a la extracción).
CREATE OR REPLACE FUNCTION public.obtener_plata_del_dia(p_prestador_id uuid, p_fecha date)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_uid       uuid := auth.uid();
  v_es_titular boolean;
  v_total     numeric;
  v_contadas  integer;
  v_sin_precio integer;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'auth_required'; END IF;

  SELECT EXISTS (SELECT 1 FROM prestadores p WHERE p.id = p_prestador_id AND p.user_id = v_uid)
    INTO v_es_titular;

  IF NOT (v_es_titular OR is_admin()) THEN
    /* NO es un error: es la modulación. La superficie recibe `visible:false` y
       DICE algo — un tercer número ausente sin voz se lee como pantalla rota.
       (A3.5bis: no se esconde que existe, se modula qué se ve.) */
    RETURN jsonb_build_object('visible', false);
  END IF;

  SELECT
    coalesce(sum(c.precio), 0),
    count(*),
    count(*) FILTER (WHERE c.precio IS NULL)
  INTO v_total, v_contadas, v_sin_precio
  FROM evento_cita_servicio c
  WHERE c.prestador_id = p_prestador_id
    AND c.fecha = p_fecha
    AND c.estado IN ('confirmada', 'en_curso', 'completada');

  RETURN jsonb_build_object(
    'visible', true,
    'total', v_total,
    'citas', v_contadas,
    'sinPrecio', v_sin_precio   -- >0 ⇒ el total es PARCIAL y la superficie lo dice
  );
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.obtener_plata_del_dia(uuid, date) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.obtener_plata_del_dia(uuid, date) TO authenticated;

-- El helper se va ÚLTIMO: antes hay que haber sacado a sus dos consumidores.
DROP FUNCTION IF EXISTS public._estados_cita_contables();

COMMIT;
