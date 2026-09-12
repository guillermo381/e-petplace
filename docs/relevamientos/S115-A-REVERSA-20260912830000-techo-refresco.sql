-- REVERSA de 20260912830000. ⚠️ Revertir devuelve el refresco al techo del
-- login (20 s) y con eso a 2 intentos en vez de 4 — el estado de D-1074.
DELETE FROM public.app_config WHERE clave='red_techo_refresco_ms';
