-- REVERSA de 20260903200000_s108a_el_cupo_suelta.sql — escrita ANTES.
-- ⚠️ Revertir REABRE la retención: los checkouts abandonados vuelven a comerse
--    un lugar para siempre en el servicio cuyo cupo se cuenta POR LUGAR.
BEGIN;
CREATE OR REPLACE FUNCTION public.cupo_guarderia_del_dia(p_prestador_id uuid, p_fecha date)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_capacidad int;
  v_consumido int;
  v_dow int := EXTRACT(dow FROM p_fecha)::int;
BEGIN
  /* 🔴 `p_fecha` es FECHA LOCAL DEL LUGAR (public.hoy_local() la resuelve para
     «hoy»). Contar por timestamp UTC parte el día a medianoche y sobrevende el
     borde. */

  -- Confirmado para el día = activo Y (su patrón lo incluye O una excepción lo
  -- trae) Y ninguna excepción lo saca. LA EXCEPCIÓN GANA. (Molde despensa.)
  SELECT COALESCE(SUM(e.capacidad_por_dia), 0) INTO v_capacidad
    FROM guarderia_espacios e
   WHERE e.prestador_id = p_prestador_id AND e.activo
     AND (
       (v_dow = ANY(e.dias_operacion)
         AND NOT EXISTS (SELECT 1 FROM guarderia_espacio_excepciones x
                          WHERE x.espacio_id = e.id AND x.fecha = p_fecha AND NOT x.disponible))
       OR EXISTS (SELECT 1 FROM guarderia_espacio_excepciones x
                   WHERE x.espacio_id = e.id AND x.fecha = p_fecha AND x.disponible)
     );

  -- Lo que ya se prometió contra ese día. Un cancelado devuelve su lugar.
  SELECT count(*) INTO v_consumido
    FROM guarderia_estadias g
    JOIN evento_cita_servicio c ON c.id = g.cita_id
   WHERE c.prestador_id = p_prestador_id
     AND c.fecha = p_fecha
     AND g.estado NOT IN ('cancelada');

  RETURN jsonb_build_object(
    'fecha',        p_fecha,
    'capacidad',    v_capacidad,
    'consumido',    v_consumido,
    'disponible',   GREATEST(v_capacidad - v_consumido, 0),
    /* 🔴 Bajar la capacidad con reservas tomadas RIGE HACIA ADELANTE Y JAMÁS
       CANCELA. El día queda sobrevendido DECLARADO y visible al prestador —
       nunca se resuelve solo. */
    'sobrevendido', (v_consumido > v_capacidad)
  );
END $function$

;
COMMIT;
