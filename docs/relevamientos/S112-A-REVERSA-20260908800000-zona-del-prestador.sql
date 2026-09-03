-- REVERSA de 20260908800000 · `prestadores` pierde su zona horaria.
-- ⚠️ BORRA DATOS: si algún prestador tenía una zona distinta del default, se
-- pierde y su día vuelve a calcularse con la constante de la casa. Hoy los 12
-- son `EC` con el mismo valor, así que revertir HOY no cambia ningún día — y
-- eso deja de ser cierto con el primer prestador fuera de Ecuador.
ALTER TABLE public.prestadores DROP COLUMN IF EXISTS zona_horaria;
