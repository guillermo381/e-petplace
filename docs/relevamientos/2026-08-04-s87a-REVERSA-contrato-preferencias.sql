-- REVERSA de `20260805000000_lote1_contrato_preferencias.sql` (S87-A).
-- Escrita ANTES de aplicar.
--
-- ⚠️ NOTA DE DATOS — ESTA REVERSA **NO ES LIMPIA**, y hay que leerla:
--  1. La tabla vieja se CONSERVA como `user_notificacion_prefs_legacy` con sus
--     5 filas intactas: revertir las devuelve enteras. Nada se pierde.
--  2. PERO revertir **REABRE LOS DOS DEFECTOS** que la migración cierra:
--     `promocion` vuelve a nacer ENCENDIDA (contra §3/§6/§12.3) y
--     `salud_seguridad` vuelve a poder apagarse en su existencia (contra la
--     letra firmada del founder). **Revertir no es neutro: reinstala el
--     defecto.** Si hay que revertir, se declara eso en el mismo acto.
--  3. Las preferencias que se hayan escrito con el modelo nuevo (por canal)
--     NO tienen equivalente en el modelo viejo: se PIERDEN. Hoy son 0.

BEGIN;

DROP TRIGGER IF EXISTS trg_prefs_honra_categoria ON public.user_notificacion_prefs;
DROP FUNCTION IF EXISTS public._trg_prefs_honra_categoria();
DROP FUNCTION IF EXISTS public.preferencia_efectiva(uuid, text, text);
DROP TABLE IF EXISTS public.user_notificacion_prefs;

ALTER TABLE public.user_notificacion_prefs_legacy
  RENAME TO user_notificacion_prefs;

DROP TABLE IF EXISTS public.cat_notificacion_canales;

COMMIT;
