-- ═══════════════════════════════════════════════════════════════════════════
-- REVERSA de 20260813000000_s96_vocabulario_relaciones_alergenos.sql
--
-- Deshace: las 13 entradas nuevas de `cat_alergenos`, la tabla de RELACIONES
-- (`cat_alergeno_relaciones`), su trigger de parejas prohibidas y la función
-- de expansión `expandir_alergenos_a_vigilar`.
--
-- ⚠️ QUÉ NO DESHACE Y POR QUÉ NO SE CORRE A LA LIGERA: revertir APAGA el
--    motor de alergias sobre el catálogo real — 242 de 456 productos con
--    composición declaran un alérgeno que el vocabulario chico no sostiene, y
--    Thor (alérgico a pollo) vuelve a NO ser advertido ante
--    `ave_no_especificada`. Si hay productos cargados usando las entradas
--    nuevas, el DELETE de abajo REBOTA por el trigger de vocabulario — y ese
--    rebote es correcto: primero se recategoriza, después se achica.
-- ═══════════════════════════════════════════════════════════════════════════
BEGIN;

DROP FUNCTION IF EXISTS public.expandir_alergenos_a_vigilar(text[]);
DROP TRIGGER IF EXISTS trg_alergeno_relacion_prohibida ON public.cat_alergeno_relaciones;
DROP FUNCTION IF EXISTS public._trg_alergeno_relacion_prohibida();
DROP TABLE IF EXISTS public.cat_alergeno_relaciones;

DELETE FROM public.cat_alergenos WHERE codigo IN (
  'levadura','ave_no_especificada','legumbres','cebada','avena','pavo',
  'insectos','pato','soja','res','cerdo','jabali','bufalo_de_agua'
);

COMMIT;
