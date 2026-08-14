-- REVERSA de 20260814190000_s97a_banda_del_dia.sql
-- ESCRITA ANTES DE APLICAR (regla de la casa).
--
-- QUÉ DESHACE: devuelve `obtener_plata_del_dia` a su cuerpo previo — el que
-- solo respondía total/citas/sinPrecio.
--
-- 🔴 QUÉ **NO** DESHACE, y hay que leerlo antes de correrla:
--   · El ensanche es ADITIVO sobre un `jsonb`: no hubo cambio de firma, no
--     hubo DROP, no se tocó ni una fila. **Revertir no restaura nada de
--     datos porque no se perdió nada.**
--   · Pero SÍ deja a la banda de `ATENDER` sin sus dos números: la superficie
--     de C va a leer `prestadas`/`cobrado` y recibir NULL. **Revertir el
--     motor sin revertir el bundle deja la banda mostrando huecos**, que es
--     el mismo modo de falla que la zona de S94-PERF.
--   · `cobro_presencial_registrado` no se toca en ningún sentido.
--
-- CUÁNDO CORRERLA: solo si el ensanche resultara equivocado ANTES de que C
-- publique la banda. Después, se corrige hacia adelante.

BEGIN;

CREATE OR REPLACE FUNCTION public.obtener_plata_del_dia(p_prestador_id uuid, p_fecha date)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_total      numeric;
  v_contadas   integer;
  v_sin_precio integer;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'auth_required'; END IF;

  IF NOT public.empleado_es_mostrador_o_gestion(p_prestador_id) THEN
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
    AND c.estado = ANY(public._estados_cita_contables());

  RETURN jsonb_build_object(
    'visible', true,
    'total', v_total,
    'citas', v_contadas,
    'sinPrecio', v_sin_precio
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.obtener_plata_del_dia(uuid, date) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.obtener_plata_del_dia(uuid, date) TO authenticated;

COMMIT;
