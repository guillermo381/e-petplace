-- 🔴 P0-C · EL PLAN REAL DE LA CONSULTA QUE TARDA, con la RLS del founder.
--
-- Todo dentro de una transacción con ROLLBACK: no escribe nada. El `SET LOCAL
-- ROLE` + los claims hacen que la RLS se evalúe **igual que en la app** — sin
-- eso el EXPLAIN mide la consulta del owner, que no es la que corre.
BEGIN;
SELECT set_config('request.jwt.claims',
  '{"sub":"dd024680-3d1c-4465-b38b-dedab45da037","role":"authenticated"}', true);
SET LOCAL ROLE authenticated;

EXPLAIN (ANALYZE, BUFFERS, COSTS OFF)
SELECT id, nombre, especie, foto_url, paseo_social_ok, talla, pelaje,
       estado_vida, sujeto, tipo_agua, raza
FROM mascotas
WHERE familia_id = 'ce057f90-82d8-40f8-a816-796c0f2b5b2a'
ORDER BY fecha_alta;

ROLLBACK;
