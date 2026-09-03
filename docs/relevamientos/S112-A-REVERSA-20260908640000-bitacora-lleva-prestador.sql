-- REVERSA de 20260908640000 · la bitácora del cuidador vuelve a escribir sin
-- `prestador_id` en la columna, y las dos filas backfilleadas vuelven a NULL.
-- ⚠️ REVERTIR NO ROMPE NADA VISIBLE — y eso es lo peligroso: las 60 funciones
-- que leen esa columna vuelven a no ver estas observaciones, **sin error**.
-- Las dos anclas del backfill, para deshacerlo exacto:
UPDATE eventos_mascota SET prestador_id = NULL
 WHERE id IN ('8e10d1be-48d1-4c39-b9a3-0f2edb1070c7',
              '5405a614-e080-4903-b567-fc748a8ea3e9');
-- El cuerpo previo de registrar_bitacora_guarderia se recupera de
-- pg_get_functiondef del commit anterior a esta migración.
