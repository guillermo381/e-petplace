-- ═══════════════════════════════════════════════════════════════════════════
-- REVERSA de `20260826160000_s105d_anotar_sin_cerrar.sql`
-- ESCRITA ANTES DE APLICAR (regla de la casa).
--
-- 🔴 QUÉ DESHACE Y QUÉ NO:
--
--   · DESHACE el mecanismo: la función `anotar_incidente_alta` y la columna
--     `altas_tarjeta.incidentes`.
--
--   · **NO DESHACE NADA DE PLATA.** Esta migración no toca tarjetas, ni
--     intentos, ni pedidos. No mueve un centavo ni un estado. Es telemetría.
--
--   · 🔴 **BORRA LAS ANOTACIONES YA HECHAS, Y ESO ES PÉRDIDA REAL.**
--     El `DROP COLUMN` se lleva todos los incidentes registrados hasta ese
--     momento — que son, por definición, los únicos casos que tenemos del
--     defecto que la migración existe para poder ver. *Revertir esto no vuelve
--     al estado anterior: vuelve al estado anterior MENOS la evidencia que se
--     juntó mientras tanto.*
--     ⇒ Antes de correr esto, **volcar la evidencia**:
--         CREATE TABLE respaldo_incidentes_alta AS
--           SELECT id, user_id, estado, creada_en, incidentes
--             FROM altas_tarjeta WHERE incidentes <> '[]'::jsonb;
--
--   · **NO REABRE NINGÚN AGUJERO.** El camino que se retira sólo escribía en
--     una columna nueva. Al irse, el estado del alta vuelve a ser lo único que
--     se registra — o sea, el estado de hoy, con su ambigüedad: un alta
--     `pendiente` no distingue «falló el SDK» de «cerró la página».
--
-- ORDEN: **primero se revierte la EDGE, después esta migración.** Al revés, la
-- edge desplegada llamaría a una función inexistente y el `desenlace:
-- 'incidente'` devolvería `no_se_pudo_completar` a la familia — un error nuevo
-- en la pantalla del alta, que es justo la que no queremos empeorar.
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

DROP FUNCTION IF EXISTS public.anotar_incidente_alta(uuid, text, text);

ALTER TABLE public.altas_tarjeta DROP CONSTRAINT IF EXISTS chk_altas_incidentes_es_arreglo;
ALTER TABLE public.altas_tarjeta DROP COLUMN IF EXISTS incidentes;

COMMIT;
