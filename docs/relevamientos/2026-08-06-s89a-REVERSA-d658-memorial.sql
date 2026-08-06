-- ═══════════════════════════════════════════════════════════════════════════
-- REVERSA de 20260806180000_s89a_d658_memorial_no_reservable.sql
-- Escrita ANTES de aplicar.
-- ⚠️ REVERTIR REABRE D-658: con este body, una mascota en memorial vuelve a
-- ser reservable en los cuatro oficios por RPC directa (la frontera queda
-- SOLO en TS). Body vivo pre-migración (pg_get_functiondef, 2026-08-06):
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public._mascota_elegible_servicio(p_mascota_id uuid, p_tipo_servicio text)
 RETURNS boolean
 LANGUAGE sql
 STABLE
 SET search_path TO 'public', 'pg_temp'
AS $function$
  SELECT COALESCE(
    (SELECT ts.especies_elegibles IS NULL OR ts.especies_elegibles ? m.especie
       FROM mascotas m
       LEFT JOIN tipos_servicio ts ON ts.codigo = p_tipo_servicio
      WHERE m.id = p_mascota_id),
    false  -- mascota inexistente: jamás elegible
  );
$function$;
