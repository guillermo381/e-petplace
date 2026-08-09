-- 🔴 P0-C · EL ESLABÓN 1: `get_estado_onboarding_dueno`, que corre ANTES.
-- Mismo encuadre: claims del founder, rol authenticated, todo con ROLLBACK.
BEGIN;
SELECT set_config('request.jwt.claims',
  '{"sub":"dd024680-3d1c-4465-b38b-dedab45da037","role":"authenticated"}', true);
SET LOCAL ROLE authenticated;

EXPLAIN (ANALYZE, BUFFERS, COSTS OFF)
SELECT get_estado_onboarding_dueno();

ROLLBACK;
