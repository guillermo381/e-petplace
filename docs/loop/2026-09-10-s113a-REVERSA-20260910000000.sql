-- ═══════════════════════════════════════════════════════════════════════════
-- REVERSA de 20260910000000_s113a_tablero_mascota.sql   (ESCRITA ANTES)
--
-- ── QUÉ DESHACE ────────────────────────────────────────────────────────────
-- Borra `obtener_tablero_mascota(uuid)`. Es una función de LECTURA pura: no
-- escribe una sola fila, así que revertirla no pierde ningún dato.
--
-- 🔴 QUÉ **NO** DESHACE, y es lo único que importa acá:
-- El perfil del cliente queda sin su tablero. La pantalla que lo consume
-- (superficie de C) muestra su estado de error, no una pantalla en blanco —
-- pero *revertir la base sin revertir el bundle deja la sección rota en el
-- teléfono de cada familia hasta el próximo OTA.* Se revierte en pareja.
--
-- No toca `obtener_serie_peso` ni `obtener_plan_vacunal`: esta migración las
-- REUSA y no las modifica. Borrarlas acá sería llevarse dos funciones que
-- tienen sus propios consumidores.
-- ═══════════════════════════════════════════════════════════════════════════

drop function if exists public.obtener_tablero_mascota(uuid);

select 'reversa 20260910000000 aplicada · el bundle se revierte aparte' as nota;
