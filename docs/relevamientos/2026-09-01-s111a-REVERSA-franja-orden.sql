-- ══════════════════════════════════════════════════════════════════════════
-- REVERSA de 20260907680000_s111a_franja_orden_base.sql
-- ESCRITA ANTES DE APLICAR.
--
-- 🔴 QUÉ **NO** DESHACE: el orden MANUAL que el cuidador dejó guardado NO se
--    toca — vive del lado de la app y no en esta función. Revertir devuelve el
--    orden base ALFABÉTICO, que es el que no tiene nada que ver con el día.
--    **No es un estado neutro: es el estado que esta migración vino a curar.**
-- ⚠️ Y devuelve la firma VIEJA (sin las tres columnas de franja) ⇒ si la
--    pantalla ya las lee, revertir ROMPE su lectura. Se revierten JUNTAS.
-- ══════════════════════════════════════════════════════════════════════════
BEGIN;

DROP FUNCTION IF EXISTS public.obtener_estadias_del_dia(uuid, date);

CREATE OR REPLACE FUNCTION public.obtener_estadias_del_dia(p_prestador_id uuid, p_fecha date)
 RETURNS TABLE(estadia_id uuid, cita_id uuid, estado text, mascota_id uuid, mascota_nombre text, mascota_especie text, mascota_foto_url text, espacio_nombre text, direccion_snapshot jsonb, a_bordo_en timestamp with time zone, llegada_en timestamp with time zone, entregada_en timestamp with time zone, retorno_en timestamp with time zone, no_recogida_en timestamp with time zone, no_recogida_motivo text, estado_reserva text, raza_ruta_imagen text)
 LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'auth_required' USING ERRCODE='42501'; END IF;
  IF NOT user_gestiona_prestador(p_prestador_id) AND NOT is_admin() THEN
    RAISE EXCEPTION 'no_gestionas_este_prestador' USING ERRCODE='42501';
  END IF;
  RETURN QUERY
  SELECT g.id, c.id, g.estado, m.id, m.nombre, m.especie, m.foto_url,
         e.nombre, c.direccion_snapshot,
         g.a_bordo_en, g.llegada_en, g.entregada_en,
         g.retorno_en, g.no_recogida_en, g.no_recogida_motivo,
         c.estado_reserva, rz.ruta_imagen
    FROM guarderia_estadias g
    JOIN evento_cita_servicio c ON c.id = g.cita_id
    JOIN mascotas m             ON m.id = c.mascota_id
    LEFT JOIN guarderia_espacios e ON e.id = g.espacio_id
    LEFT JOIN cat_razas rz ON rz.especie = m.especie AND lower(rz.nombre) = lower(m.raza)
   WHERE c.prestador_id = p_prestador_id AND c.fecha = p_fecha
     AND c.estado_reserva = 'pagada' AND g.estado <> 'cancelada'
   ORDER BY m.nombre;
END $function$;

REVOKE EXECUTE ON FUNCTION public.obtener_estadias_del_dia(uuid, date) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.obtener_estadias_del_dia(uuid, date) TO authenticated;

COMMIT;
