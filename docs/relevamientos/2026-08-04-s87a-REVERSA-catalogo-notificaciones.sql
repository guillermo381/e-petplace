-- REVERSA de `20260804230000_lote1_catalogo_notificaciones.sql` (S87-A).
-- Escrita ANTES de aplicar (regla de la casa).
--
-- ⚠️ NOTA DE DATOS: esta reversa es LIMPIA. La migración es ADITIVA PURA
-- (dos catálogos nuevos + seeds); NO toca `notificaciones`, NO toca
-- `user_notificacion_prefs`, NO altera ningún CHECK vivo. Revertir no
-- pierde ni un dato de negocio: solo borra vocabulario que nadie consume
-- todavía. El día que algo tenga FK a estos catálogos, esta reversa deja
-- de ser limpia y hay que reescribirla.

BEGIN;

DROP TABLE IF EXISTS public.cat_notificacion_tipos;
DROP TABLE IF EXISTS public.cat_notificacion_categorias;

COMMIT;
