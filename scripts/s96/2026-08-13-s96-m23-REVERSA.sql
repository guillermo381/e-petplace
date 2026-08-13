-- ═══════════════════════════════════════════════════════════════════════════
-- REVERSA de 20260813030000_s96_track_gps_envio.sql (M23 — el GPS del
-- repartidor: la firma del founder del 13-ago que mata D-770 de verdad).
--
-- ⚠️ NOTA DE DATOS (leer antes de correr): DROP COLUMN borra TODOS los tracks
-- capturados hasta ese momento y NO hay forma de recuperarlos — el track del
-- envío no vive en ningún otro lado. Revertir el motor NO revierte el bundle:
-- si algún OTA del prestador ya llama `registrar_track_envio`, la pantalla
-- del repartidor va a recibir un 404 de PostgREST en cada flush (el wrapper
-- lo degrada a error tipado, no crashea — pero la captura se pierde en
-- silencio para quien no mire el forense).
-- ═══════════════════════════════════════════════════════════════════════════

DROP FUNCTION IF EXISTS public.registrar_track_envio(uuid, jsonb);

ALTER TABLE public.envios DROP COLUMN IF EXISTS track_gps;

-- Verificación de la reversa: ni la función ni la columna quedan vivas.
DO $$
BEGIN
  IF to_regprocedure('public.registrar_track_envio(uuid, jsonb)') IS NOT NULL THEN
    RAISE EXCEPTION 'reversa incompleta: registrar_track_envio sigue viva';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema='public' AND table_name='envios' AND column_name='track_gps') THEN
    RAISE EXCEPTION 'reversa incompleta: envios.track_gps sigue viva';
  END IF;
END $$;
