-- REVERSA de 20260908560000 · la vista pública deja de exponer
-- `cuenta_comercial_id` y muere el editor de la vitrina del refugio.
-- ⚠️ Revertir NO borra datos —la fila de `prestadores` del refugio queda—
-- pero **el adoptable pierde el puente a la vitrina de su refugio**: la
-- pantalla tiene el id de la cuenta y ningún lector que lo acepte.
-- La vista se re-crea con sus 22 columnas originales (sin la nueva).
DROP FUNCTION IF EXISTS public.poblar_vitrina_refugio(text, text, text, text);
-- v_prestadores_publicos se recupera de pg_get_viewdef del commit anterior.
