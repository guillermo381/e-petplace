-- ════════════════════════════════════════════════════════════════════════
-- REVERSA de `20260827000000_s106a_borrador_nota_clinica.sql`
-- Escrita ANTES de aplicar.
--
-- QUÉ DESHACE: borra la tabla `nota_clinica_borrador`, sus dos puertas y el
-- trigger que la limpia al sedimentar.
--
-- 🔴 QUÉ **NO** DESHACE, y hay que leerlo antes de correrla:
--    · **BORRA DATOS.** `DROP TABLE` se lleva **todo borrador en vuelo** — o
--      sea, el trabajo de cualquier profesional que tenga una nota a medio
--      escribir en ese momento. *No es una reversa de código: es una que
--      destruye trabajo humano no sedimentado.* Si hay que revertir con
--      consultas en curso, primero se mide `SELECT count(*)` y se avisa.
--    · No toca ninguna historia clínica ya sedimentada: el borrador y el
--      expediente son dos cosas y sólo se borra la primera.
-- ════════════════════════════════════════════════════════════════════════

DROP TRIGGER IF EXISTS trg_hc_limpia_borrador ON public.evento_historia_clinica_registrada;
DROP FUNCTION IF EXISTS public._trg_hc_limpia_borrador();
DROP FUNCTION IF EXISTS public.guardar_borrador_nota(uuid, jsonb);
DROP FUNCTION IF EXISTS public.leer_borrador_nota(uuid);
DROP TABLE IF EXISTS public.nota_clinica_borrador;
