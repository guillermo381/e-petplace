-- ═══════════════════════════════════════════════════════════════════════════
-- REVERSA de 20260910120000_s113a_estado_de_placa.sql       (ESCRITA ANTES)
--
-- Borra la RPC y su tabla de límite.
--
-- 🔴 QUÉ NO DESHACE: la app vuelve a enterarse de que una placa está activada
-- POR EL REBOTE de `activar_placa`, en vez de antes de intentar. No se rompe
-- nada —el rebote es hablado— pero *la familia vuelve a descubrir el problema
-- después de haber elegido la mascota, que es el peor momento.*
--
-- `pasaporte_placa` sigue SIN grant, que es lo correcto y no se toca acá.
-- ═══════════════════════════════════════════════════════════════════════════

drop function if exists public.estado_de_placa(text);
drop table if exists public.placa_consulta;

select 'reversa 20260910120000 · la app vuelve a enterarse por el rebote' as nota;
