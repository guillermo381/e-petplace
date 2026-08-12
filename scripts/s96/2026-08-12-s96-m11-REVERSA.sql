-- ═══════════════════════════════════════════════════════════════════════════
-- REVERSA de 20260812220000_s96_firma_composicion_tres_estados.sql
--
-- Deshace: los tres estados de la composición (firma founder 12-ago, 2ª tanda)
-- — la columna `productos.composicion_estado`, su trigger de coherencia y la
-- puerta `declarar_composicion_estado`.
--
-- ⚠️ QUÉ NO DESHACE: nada de conocimiento — pero OJO: tirar la columna BORRA
--    las verificaciones que e-PetPlace haya declarado (`verificada` es un acto
--    de curaduría que no vive en ningún otro lado). Revertir después de haber
--    verificado composiciones es perder ese trabajo. Y revertir reabre el
--    hueco que la firma vino a cerrar: la composición sin verificar vuelve a
--    leerse idéntica a la confiable.
-- ═══════════════════════════════════════════════════════════════════════════
BEGIN;

DROP TRIGGER IF EXISTS trg_producto_composicion_estado ON public.productos;
DROP FUNCTION IF EXISTS public._trg_producto_composicion_estado();
DROP FUNCTION IF EXISTS public.declarar_composicion_estado(uuid, text);
ALTER TABLE public.productos DROP COLUMN IF EXISTS composicion_estado;

COMMIT;
