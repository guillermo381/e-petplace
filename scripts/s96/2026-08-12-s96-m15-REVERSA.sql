-- ═══════════════════════════════════════════════════════════════════════════
-- REVERSA de 20260812235000_s96_firma_vocabulario_alergenos.sql
--
-- Deshace: `cat_alergenos` + el trigger que valida/normaliza
-- `productos.alergenos` contra el catálogo.
--
-- ⚠️ QUÉ NO DESHACE: nada de datos de productos (el trigger normaliza al
--    escribir; lo ya escrito queda). Pero revertir REABRE el bloqueo de la
--    firma: sin `moluscos_crustaceos` en el vocabulario, un húmedo de gato
--    que lo declara en etiqueta vuelve a no tener dónde ponerlo — y la app
--    callaría sobre un alérgeno declarado con todas las letras.
-- ═══════════════════════════════════════════════════════════════════════════
BEGIN;

DROP TRIGGER IF EXISTS trg_producto_alergenos_vocabulario ON public.productos;
DROP FUNCTION IF EXISTS public._trg_producto_alergenos_vocabulario();
DROP TABLE IF EXISTS public.cat_alergenos;

COMMIT;
