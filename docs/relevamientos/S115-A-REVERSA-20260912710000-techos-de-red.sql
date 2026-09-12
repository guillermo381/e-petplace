-- REVERSA de 20260912710000_s115a_techos_de_red.sql — escrita ANTES.
-- ⚠️ Revertir deja al cliente SIN techo configurable. El código cae a sus
--    valores de arranque (los mismos números), así que NO vuelve a colgar —
--    lo que se pierde es poder moverlos sin publicar.
DELETE FROM public.app_config
 WHERE clave IN ('red_techo_lectura_ms','red_techo_escritura_ms',
                 'red_techo_auth_ms','red_techo_subida_ms');
