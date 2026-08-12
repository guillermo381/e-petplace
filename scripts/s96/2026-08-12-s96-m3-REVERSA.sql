-- ═══════════════════════════════════════════════════════════════════════════
-- REVERSA de 20260812140000_s96_b3_cupo_ventana_fecha.sql
--
-- Deshace: el cupo por recurso (tablas + funciones), los turnos de entrega,
-- el catálogo de tipos de servicio de envío, la columna de fecha objetivo, y
-- `crear_pedido_despensa` vuelve a su firma de la M2 (6 parámetros, promesa
-- por bodega). `calcular_promesa_entrega` (la de bodega, dropeada en la M3)
-- se restaura desde scripts/s96/functiondef-pre-m3.sql.
--
-- ⚠️ QUÉ NO DESHACE: los pedidos reales creados con fecha objetivo pierden la
--    columna (el dato muere con ella). Los seeds del vendedor de pruebas
--    (moto + turnos) caen con las tablas.
-- ═══════════════════════════════════════════════════════════════════════════
BEGIN;

DROP FUNCTION IF EXISTS public.crear_pedido_despensa(uuid, jsonb, jsonb, text, uuid, text, date, text);
-- (re-crear la versión M2 de 6 parámetros desde
--  supabase/migrations/20260812130000_s96_b2_entrega_con_evidencia_y_destino.sql)

DROP FUNCTION IF EXISTS public.calcular_promesa_despensa(uuid, timestamptz, date, text);
DROP FUNCTION IF EXISTS public.cupo_reparto_del_dia(uuid, date);
DROP FUNCTION IF EXISTS public.definir_recurso_reparto(uuid, text, integer, integer[], boolean);
DROP FUNCTION IF EXISTS public.declarar_excepcion_recurso(uuid, date, boolean, text);
DROP FUNCTION IF EXISTS public.definir_turno_entrega(uuid, text, time, time, time, integer, integer, text);

-- `calcular_promesa_entrega` (bodega) se restaura del literal capturado:
--   scripts/s96/functiondef-pre-m3.sql

ALTER TABLE public.pedidos
  DROP COLUMN IF EXISTS entrega_fecha_objetivo,
  DROP COLUMN IF EXISTS envio_servicio;

DROP TABLE IF EXISTS public.recurso_reparto_excepciones;
DROP TABLE IF EXISTS public.recursos_reparto;
DROP TABLE IF EXISTS public.entrega_turnos;
DROP TABLE IF EXISTS public.cat_tipos_servicio_envio;

COMMIT;
