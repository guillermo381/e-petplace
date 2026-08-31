-- REVERSA de 20260907180000_s109a_la_ventana_el_hueco_declarado_y_el_intento_del_link.sql
--
-- ⚠️ QUÉ NO DESHACE: los intentos que `vencer_links_mensuales` haya movido a
--    `expirado` NO vuelven a `iniciado`. Son transiciones de plata y se
--    reponen a mano si hace falta, con la lista a la vista.
--
-- ⚠️ Y REVERTIR ① ROMPE AL CONSUMIDOR: `obtenerMisProgramas` en packages/api
--    lee `pago_expira_en`. Revertir la firma sin revertir el wrapper deja al
--    wrapper pidiendo una columna que la función ya no devuelve (`L-442`).

BEGIN;

DROP FUNCTION IF EXISTS public.pagos_conciliacion_cobertura();
COMMENT ON FUNCTION public.pagos_pendientes_de_conciliar(integer, text) IS NULL;

-- ① `obtener_mis_programas` vuelve a su firma SIN `pago_expira_en`
--    y ② `vencer_links_mensuales` a su cuerpo previo: los dos cuerpos viven
--    completos en 20260905140000 y 20260906200000 respectivamente, y
--    `pg_get_functiondef` los da del objeto. No se transcriben: copiar un
--    cuerpo largo a mano es cómo una reversa restaura algo que no era.

COMMIT;
