-- ============================================================================
-- REVERSA de `20260826280000_s106a_hechos_de_sala.sql`
-- Escrita ANTES de aplicar la migración, como manda la casa.
--
-- ⚠️ QUÉ **NO** DESHACE, dicho antes que nada:
--    Revertir esto **BORRA LOS HECHOS YA REGISTRADOS**. Si para cuando alguien
--    corra esta reversa ya entraron eventos de salas reales, se pierde el
--    único registro con el que soporte puede resolver una devolución con dato
--    en vez de con relato — que es literalmente la razón por la que la tabla
--    existe.
--
--    ⇒ **Antes de correrla, se mide:** `SELECT count(*) FROM
--    public.videollamada_hechos;` Si no es cero, la decisión de borrar es de
--    la mesa, no de quien revierte.
--
--    Y lo que la reversa **no puede** deshacer de ninguna manera: los eventos
--    que LiveKit ya envió y que esta tabla dejó de recibir mientras no existía.
--    *Un webhook que rebota no se reintenta para siempre.*
-- ============================================================================

BEGIN;

REVOKE ALL ON FUNCTION public.registrar_hecho_de_sala(text, text, timestamptz, jsonb, text, text) FROM service_role;
DROP FUNCTION IF EXISTS public.registrar_hecho_de_sala(text, text, timestamptz, jsonb, text, text);

DROP POLICY IF EXISTS videollamada_hechos_admin_lee ON public.videollamada_hechos;
DROP TABLE IF EXISTS public.videollamada_hechos;

COMMIT;
