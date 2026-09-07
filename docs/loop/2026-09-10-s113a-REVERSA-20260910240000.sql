-- REVERSA de 20260910240000_s113a_placa_no_existe.sql (ESCRITA ANTES)
-- Devuelve `estado_de_placa` a dos valores: la app vuelve a ofrecer activar
-- cualquier cadena, y se entera de que no existe por el rebote de activar.
-- 🔴 La respuesta SIN SESIÓN no cambia en ninguna dirección: sigue siendo
-- `libre` para lo inexistente, que es lo firmado y lo que evita enumerar.
select 'reversa 20260910240000 · la app vuelve a ofrecer activar cualquier cadena' as nota;
